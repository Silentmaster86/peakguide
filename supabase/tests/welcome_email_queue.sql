\set ON_ERROR_STOP on
-- Disposable database only: a small Auth fixture, not production Auth.
create schema auth;
create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,is_anonymous boolean default false);
do $$ begin
 if not exists(select 1 from pg_roles where rolname='anon') then create role anon; end if;
 if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
 if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role; end if;
end $$;
insert into auth.users values('00000000-0000-4000-8000-000000000001','old@example.test',now(),false);
\ir ../migrations/202611100013_welcome_email_queue.sql

do $$
declare jid uuid; token uuid;
begin
 if exists(select 1 from peakguide_private.welcome_email_queue) then raise exception 'Historical user queued'; end if;
 if has_function_privilege('anon','public.claim_welcome_email()','execute')
 or has_function_privilege('authenticated','public.finish_welcome_email(uuid,uuid,text)','execute')
 or has_schema_privilege('authenticated','peakguide_private','usage') then raise exception 'Client access leaked'; end if;
 if not has_function_privilege('service_role','public.claim_welcome_email()','execute') then raise exception 'Worker cannot claim'; end if;
 insert into auth.users values('00000000-0000-4000-8000-000000000002','new@example.test',null,false);
 if exists(select 1 from public.claim_welcome_email()) then raise exception 'Unconfirmed user claimed'; end if;
 update auth.users set email_confirmed_at=now() where id='00000000-0000-4000-8000-000000000002';
 select user_id,claim_token into jid,token from public.claim_welcome_email();
 if jid is null then raise exception 'Confirmed user not claimed'; end if;
 if exists(select 1 from public.claim_welcome_email()) then raise exception 'Double claim'; end if;
 if public.finish_welcome_email(jid,gen_random_uuid(),'sent') then raise exception 'Wrong lease accepted'; end if;
 if not public.finish_welcome_email(jid,token,'retry') then raise exception 'Could not retry'; end if;
 if exists(select 1 from public.claim_welcome_email()) then raise exception 'Retry backoff ignored'; end if;
 update peakguide_private.welcome_email_queue set available_at=now();
 select claim_token into token from public.claim_welcome_email();
 perform public.finish_welcome_email(jid,token,'retry');
 update peakguide_private.welcome_email_queue set available_at=now();
 select claim_token into token from public.claim_welcome_email();
 perform public.finish_welcome_email(jid,token,'retry');
 if (select state from peakguide_private.welcome_email_queue where user_id=jid)<>'failed' then raise exception 'Retry limit ignored'; end if;
 insert into auth.users values('00000000-0000-4000-8000-000000000003','timeout@example.test',now(),false);
 select user_id,claim_token into jid,token from public.claim_welcome_email();
 update peakguide_private.welcome_email_queue set claimed_at=now()-interval '10 minutes' where user_id=jid;
 if exists(select 1 from public.claim_welcome_email()) then raise exception 'Uncertain delivery retried'; end if;
 if (select state from peakguide_private.welcome_email_queue where user_id=jid)<>'uncertain' then raise exception 'Lease not expired'; end if;
 if public.finish_welcome_email(jid,token,'sent') then raise exception 'Expired lease accepted'; end if;
 insert into auth.users values('00000000-0000-4000-8000-000000000004','ok@example.test',now(),false);
 select user_id,claim_token into jid,token from public.claim_welcome_email();
 perform public.finish_welcome_email(jid,token,'sent');
 update auth.users set email_confirmed_at=now() where id=jid;
 if exists(select 1 from public.claim_welcome_email()) then raise exception 'Sent job requeued'; end if;
 delete from auth.users where id=jid;
 if exists(select 1 from peakguide_private.welcome_email_queue where user_id=jid) then raise exception 'Deleted user retained'; end if;
 insert into auth.users values('00000000-0000-4000-8000-000000000005','anonymous@example.test',now(),true);
 if exists(select 1 from public.claim_welcome_email()) then raise exception 'Anonymous account mailed'; end if;
end $$;
set role anon;
do $$ begin
 begin
  perform public.claim_welcome_email();
  raise exception 'Anon was allowed to claim';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;

-- Concurrent worker transactions: the second skips the row held by the first.
create extension dblink;
insert into auth.users values
 ('00000000-0000-4000-8000-000000000006','a@example.test',now(),false),
 ('00000000-0000-4000-8000-000000000007','b@example.test',now(),false);
select dblink_connect('worker_a','host=127.0.0.1 user=postgres password=local-test-only dbname='||current_database());
select dblink_connect('worker_b','host=127.0.0.1 user=postgres password=local-test-only dbname='||current_database());
select dblink_exec('worker_a','begin');
select dblink_exec('worker_b','begin');
do $$ declare first_id text; second_id text;
begin
 select id into first_id from dblink('worker_a','select user_id::text from public.claim_welcome_email()') as t(id text);
 select id into second_id from dblink('worker_b','select user_id::text from public.claim_welcome_email()') as t(id text);
 if first_id is null or second_id is null or first_id=second_id then raise exception 'Concurrent claims overlap'; end if;
end $$;
select dblink_exec('worker_a','commit');
select dblink_exec('worker_b','commit');
select dblink_disconnect('worker_a');
select dblink_disconnect('worker_b');
select 'welcome email queue: PASS' as result;
