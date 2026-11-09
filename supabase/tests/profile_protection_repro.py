"""Reproduce the supplied profile-trigger race in a disposable local Docker DB.

Not a production schema or Supabase Auth test. Uses reported functions/policies,
assumes RLS enabled and supplies grants and an auth.uid() stub for test identities.
Creates a new named database; refuses to overwrite an existing database.
Usage: python supabase/tests/profile_protection_repro.py CONTAINER_NAME
"""
import json
import os
import select
import subprocess
import sys

DB = 'peakguide_role_audit'
A = '00000000-0000-0000-0000-000000000001'
B = '00000000-0000-0000-0000-000000000002'
env = {k: v for k, v in os.environ.items() if k not in {
    'DOCKER_HOST', 'DOCKER_CONTEXT', 'DOCKER_TLS', 'DOCKER_TLS_VERIFY', 'DOCKER_CERT_PATH'
}}
base = ['docker', '--host=unix:///var/run/docker.sock', 'exec', '-i', sys.argv[1],
        'psql', '-X', '-qAt', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1']


def sql(statement, database=DB, check=True):
    return subprocess.run(base + ['-d', database], input=statement, text=True,
                          capture_output=True, check=check, timeout=30, env=env)


def actor(uid):
    return f"set role authenticated; set test.uid = '{uid}';"


def demote(uid):
    return f"update public.profiles set role='user',is_admin=false where id='{uid}' returning id;"


def count():
    return int(sql("select count(*) from profiles where role='admin' and is_admin=true;").stdout.strip())


sql(f'create database {DB};', database='postgres')
sql("""
create schema auth;
create function auth.uid() returns uuid language sql stable as $$
 select nullif(current_setting('test.uid',true),'')::uuid
$$;
do $$ begin
 if not exists(select from pg_roles where rolname='authenticated') then create role authenticated; end if;
end $$;
create table public.profiles(id uuid primary key, role text default 'user', is_admin boolean default false);
create function public.is_peakguide_admin() returns boolean language sql stable security definer
set search_path='' as $$
 select exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin' and is_admin=true)
$$;
create function public.protect_peakguide_admin() returns trigger language plpgsql security definer
set search_path='' as $$
declare remaining_admins integer;
begin
 if TG_OP='DELETE' then
  if old.id=(select auth.uid()) then raise exception 'You cannot delete your own administrator profile'; end if;
  if old.role='admin' and old.is_admin=true then
   select count(*) into remaining_admins from public.profiles where id<>old.id and role='admin' and is_admin=true;
   if remaining_admins=0 then raise exception 'The last administrator cannot be deleted'; end if;
  end if;
  return old;
 end if;
 if old.id=(select auth.uid()) and (new.role is distinct from old.role or new.is_admin is distinct from old.is_admin) then
  raise exception 'You cannot change your own administrator permissions';
 end if;
 if old.role='admin' and old.is_admin=true and (new.role is distinct from 'admin' or new.is_admin is distinct from true) then
  select count(*) into remaining_admins from public.profiles where id<>old.id and role='admin' and is_admin=true;
  if remaining_admins=0 then raise exception 'The last administrator cannot be demoted'; end if;
 end if;
 return new;
end $$;
create trigger protect_peakguide_admin_trigger before delete or update on public.profiles
for each row execute function public.protect_peakguide_admin();
alter table public.profiles enable row level security;
grant usage on schema public,auth to authenticated;
grant select,update,delete on public.profiles to authenticated;
create policy "Admins can delete profiles" on profiles for delete to authenticated
using((select public.is_peakguide_admin()) and id<>(select auth.uid()));
create policy "Admins can read all profiles" on profiles for select to authenticated
using((select public.is_peakguide_admin()));
create policy "Admins can update profiles" on profiles for update to authenticated
using((select public.is_peakguide_admin())) with check((select public.is_peakguide_admin()));
create policy "Users can read own profile" on profiles for select to authenticated
using((select auth.uid())=id);
""" + f"insert into profiles values ('{A}','admin',true),('{B}','admin',true);")

self_change = sql(actor(A) + demote(A), check=False)
assert self_change.returncode != 0 and 'You cannot change your own administrator permissions' in self_change.stderr
sql(actor(A) + demote(B))
sql(actor(B) + demote(A))
assert count() == 1, 'Sequential RLS operation should leave one administrator'
last_change = sql(demote(A), check=False)
assert last_change.returncode != 0 and 'The last administrator cannot be demoted' in last_change.stderr
sql("update profiles set role='admin',is_admin=true;")

# A changes B and holds its transaction open. B still sees its own committed
# administrator status, changes A and commits. Then A commits: no administrators.
p = subprocess.Popen(base + ['-d', DB], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                     stderr=subprocess.PIPE, text=True, env=env)
try:
    p.stdin.write('begin;\n' + actor(A) + demote(B) + '\n\\echo READY\n')
    p.stdin.flush()
    # Raw reads avoid TextIO prefetch hiding READY from select().
    received = ''
    while not received.endswith('READY\n'):
        ready, _, _ = select.select([p.stdout], [], [], 20)
        if not ready:
            raise RuntimeError('First transaction did not reach synchronization point')
        chunk = os.read(p.stdout.fileno(), 4096).decode()
        if not chunk:
            raise RuntimeError(p.stderr.read())
        received += chunk
    result_b = sql('begin;' + actor(B) + demote(A) + 'commit;')
    assert A in result_b.stdout, result_b
    _, errors = p.communicate('commit;\n', timeout=20)
    assert p.returncode == 0, errors
finally:
    if p.poll() is None:
        p.kill()
        p.wait()
remaining = count()
assert remaining == 0, f'Race not reproduced: {remaining} administrators remain'
print(json.dumps({
    'database': DB,
    'self_demotion_blocked': True,
    'sequential_operations_remaining_admins': 1,
    'last_admin_trigger_blocks_sequential_demotion': True,
    'overlapping_transactions_remaining_admins': remaining,
    'race_reproduced': True,
    'scope': 'reported trigger and policies, assumed grants/RLS, auth.uid stub; not production'
}, indent=2))
