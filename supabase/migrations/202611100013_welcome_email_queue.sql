-- Queue only NEW registrations after this migration. No historical mail blast.
-- SMTP is performed asynchronously by welcome-email, never inside signup.
begin;
create schema if not exists peakguide_private;
revoke all on schema peakguide_private from public, anon, authenticated;
create table peakguide_private.welcome_email_queue (
 user_id uuid primary key references auth.users(id) on delete cascade,
 state text not null default 'pending' check(state in ('pending','processing','sent','failed','uncertain','cancelled')),
 attempts integer not null default 0,
 available_at timestamptz not null default now(),
 claimed_at timestamptz,
 claim_token uuid,
 created_at timestamptz not null default now(),
 sent_at timestamptz
);
alter table peakguide_private.welcome_email_queue enable row level security;
revoke all on peakguide_private.welcome_email_queue from public, anon, authenticated;
create index welcome_email_pending_idx on peakguide_private.welcome_email_queue(available_at,created_at) where state='pending';

create function peakguide_private.queue_welcome_email()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 -- Queue at INSERT, but the worker waits for a confirmed address. This also
 -- covers email-confirmation-enabled signup without backfilling existing users.
 if new.email is not null and coalesce(new.is_anonymous,false)=false then
  insert into peakguide_private.welcome_email_queue(user_id) values(new.id)
  on conflict(user_id) do nothing;
 end if;
 return new;
end $$;
revoke all on function peakguide_private.queue_welcome_email() from public, anon, authenticated;
create trigger peakguide_queue_welcome_email
 after insert on auth.users for each row execute function peakguide_private.queue_welcome_email();

create function public.claim_welcome_email()
returns table(user_id uuid, claim_token uuid)
language plpgsql security definer set search_path = '' as $$
begin
 -- SMTP has no idempotency key. An expired lease may have sent already; never
 -- automatically retry that uncertain delivery and risk a duplicate welcome.
 update peakguide_private.welcome_email_queue q set state='uncertain'
 where q.state='processing' and q.claimed_at < now()-interval '5 minutes';
 return query
 with candidate as (
  select q.user_id from peakguide_private.welcome_email_queue q
  join auth.users u on u.id=q.user_id
  where q.state='pending' and q.available_at<=now() and q.attempts<3
    and u.email_confirmed_at is not null and u.email is not null
    and coalesce(u.is_anonymous,false)=false
  order by q.created_at for update of q skip locked limit 1
 )
 update peakguide_private.welcome_email_queue q
 set state='processing', attempts=q.attempts+1, claimed_at=now(), claim_token=gen_random_uuid()
 from candidate c where q.user_id=c.user_id
 returning q.user_id,q.claim_token;
end $$;
revoke all on function public.claim_welcome_email() from public, anon, authenticated;
grant execute on function public.claim_welcome_email() to service_role;

create function public.finish_welcome_email(p_user_id uuid,p_claim_token uuid,p_outcome text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
 if p_outcome not in ('sent','retry','failed','uncertain','cancelled') or p_outcome is null then
  raise exception 'Invalid delivery outcome';
 end if;
 update peakguide_private.welcome_email_queue q
 set state=case when p_outcome='retry' then case when q.attempts<3 then 'pending' else 'failed' end else p_outcome end,
     available_at=case when p_outcome='retry' then now()+interval '15 minutes' else q.available_at end,
     sent_at=case when p_outcome='sent' then now() else q.sent_at end
 where q.user_id=p_user_id and q.claim_token=p_claim_token and q.state='processing';
 return found;
end $$;
revoke all on function public.finish_welcome_email(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.finish_welcome_email(uuid,uuid,text) to service_role;
commit;
