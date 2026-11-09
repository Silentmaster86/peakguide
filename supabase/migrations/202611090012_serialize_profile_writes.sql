-- Preserve the last-admin trigger, but serialize profile mutations before row
-- locks are taken. Run after reviewing the supplied production definitions.
-- Does not grant clients access or modify account data.
begin;
do $$ begin
 if not exists(select 1 from pg_trigger where tgrelid='public.profiles'::regclass
   and tgname='protect_peakguide_admin_trigger' and tgenabled in ('O','A')
   and tgfoid='public.protect_peakguide_admin()'::regprocedure) then
  raise exception 'Enabled administrator protection trigger is required';
 end if;
end $$;

create schema if not exists peakguide_private;
revoke all on schema peakguide_private from public, anon, authenticated;
create table peakguide_private.profile_write_lock (
 singleton boolean primary key default true check(singleton),
 revision boolean not null default false
);
insert into peakguide_private.profile_write_lock(singleton) values(true);
revoke all on peakguide_private.profile_write_lock from public, anon, authenticated;

create function peakguide_private.serialize_profile_writes()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 -- UPDATE creates a row version as well as taking a transaction-scoped lock.
 -- Stale REPEATABLE READ/SERIALIZABLE transactions must abort instead of
 -- evaluating the last-admin count using their old snapshot.
 update peakguide_private.profile_write_lock set revision=not revision where singleton;
 if not found then raise exception 'Profile write lock is missing'; end if;
 return null;
end $$;
revoke all on function peakguide_private.serialize_profile_writes() from public, anon, authenticated;

create trigger serialize_profile_writes_trigger
before insert or update or delete on public.profiles
for each statement execute function peakguide_private.serialize_profile_writes();
commit;
