"""Reproduce the supplied profile-trigger race in a disposable local Docker DB.

Not a production schema or Supabase Auth test. Uses reported functions, policies,
RLS and grants, with an auth.uid() stub for test identities.
Creates a new named database; refuses to overwrite an existing database.
Usage: python supabase/tests/profile_protection_repro.py CONTAINER_NAME
Add --verify-fix to require migration 012 to pass 18 concurrent scenarios.
CI may use --local instead of a container for a disposable localhost database.
"""
import argparse
import json
import os
import select
import subprocess
import sys
import time
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('container', nargs='?')
parser.add_argument('--local', action='store_true', help='Use psql against localhost for disposable CI service')
parser.add_argument('--verify-fix', action='store_true', help='Also apply migration 012 and require concurrency tests to pass')
args = parser.parse_args()
if bool(args.container) == bool(args.local):
    parser.error('Specify either a local Docker container or --local')

DB = 'peakguide_role_audit'
A = '00000000-0000-0000-0000-000000000001'
B = '00000000-0000-0000-0000-000000000002'
env = {k: v for k, v in os.environ.items() if k not in {
    'DOCKER_HOST', 'DOCKER_CONTEXT', 'DOCKER_TLS', 'DOCKER_TLS_VERIFY', 'DOCKER_CERT_PATH'
}}
base = (['psql', '-h', '127.0.0.1'] if args.local else
        ['docker', '--host=unix:///var/run/docker.sock', 'exec', '-i', args.container, 'psql'])
base += ['-X', '-qAt', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose']


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
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$
 select nullif(current_setting('test.uid',true),'')::uuid
$$;
do $$ begin
 if not exists(select from pg_roles where rolname='authenticated') then create role authenticated; end if;
 if not exists(select from pg_roles where rolname='anon') then create role anon; end if;
end $$;
create table public.profiles(id uuid primary key references auth.users on delete cascade, role text default 'user', is_admin boolean default false);
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
revoke all on function public.is_peakguide_admin() from public,anon;
grant execute on function public.is_peakguide_admin() to authenticated;
create policy "Admins can delete profiles" on profiles for delete to authenticated
using((select public.is_peakguide_admin()) and id<>(select auth.uid()));
create policy "Admins can read all profiles" on profiles for select to authenticated
using((select public.is_peakguide_admin()));
create policy "Admins can update profiles" on profiles for update to authenticated
using((select public.is_peakguide_admin())) with check((select public.is_peakguide_admin()));
create policy "Users can read own profile" on profiles for select to authenticated
using((select auth.uid())=id);
""" + f"insert into auth.users values ('{A}'),('{B}'); insert into profiles values ('{A}','admin',true),('{B}','admin',true);")

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
    'scope': 'reported trigger, policies, grants and RLS; auth.uid and auth.users stubs; not production'
}, indent=2))

if not args.verify_fix:
    sys.exit(0)

migration = Path(__file__).resolve().parents[1] / 'migrations/202611090012_serialize_profile_writes.sql'
sql(migration.read_text())


def reset_accounts():
    sql(f"truncate profiles,auth.users; insert into auth.users values ('{A}'),('{B}'); "
        f"insert into profiles values ('{A}','admin',true),('{B}','admin',true);")


def session():
    return subprocess.Popen(base + ['-d', DB], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE, text=True, env=env)


def ready_after(process, statement):
    process.stdin.write(statement + '\n\\echo READY\n')
    process.stdin.flush()
    received = ''
    while not received.endswith('READY\n'):
        readable, _, _ = select.select([process.stdout], [], [], 20)
        if not readable:
            raise RuntimeError('Transaction setup timed out')
        chunk = os.read(process.stdout.fileno(), 4096).decode()
        if not chunk:
            raise RuntimeError(process.stderr.read())
        received += chunk


def mutate(kind, uid):
    if kind == 'demote':
        return demote(uid)
    if kind == 'delete':
        return f"delete from profiles where id='{uid}' returning id;"
    return f"delete from auth.users where id='{uid}' returning id;"


results = []
for isolation in ['read committed', 'repeatable read', 'serializable']:
    for kind in ['demote', 'delete', 'auth_cascade']:
        for first_result in ['commit', 'rollback']:
            reset_accounts()
            first, second = session(), session()
            try:
                # Explicit snapshot before either write also exercises stale RR/SERIALIZABLE views.
                ready_after(first, f'begin isolation level {isolation};' + (actor(A) if kind != 'auth_cascade' else '') + 'select count(*) from profiles;')
                ready_after(second, f"set application_name='peakguide_waiter'; begin isolation level {isolation};" + (actor(B) if kind != 'auth_cascade' else '') + 'select count(*) from profiles;')
                ready_after(first, mutate(kind, B))
                second.stdin.write(mutate(kind, A) + '\ncommit;\n')
                second.stdin.flush()
                deadline = time.monotonic() + 15
                while True:
                    blocked = sql("select exists(select 1 from pg_stat_activity where application_name='peakguide_waiter' and cardinality(pg_blocking_pids(pid))>0);").stdout.strip()
                    if blocked == 't':
                        break
                    if second.poll() is not None or time.monotonic() > deadline:
                        raise RuntimeError('Second writer failed to wait for the transaction lock')
                    time.sleep(0.05)
                _, first_errors = first.communicate(first_result + ';\n', timeout=20)
                assert first.returncode == 0, first_errors
                second_output, second_errors = second.communicate(timeout=20)
                remaining_after = count()
                assert remaining_after == 1, (isolation, kind, first_result, remaining_after, second_errors)
                if first_result == 'rollback':
                    assert second.returncode == 0 and A in second_output, second_errors
                elif second.returncode != 0:
                    assert 'P0001' in second_errors or '40001' in second_errors, second_errors
                else:
                    assert A not in second_output, 'Second operation must not remove the remaining administrator'
                results.append({'isolation': isolation, 'operation': kind, 'first_transaction': first_result,
                                'remaining_admins': remaining_after, 'second_returncode': second.returncode})
            finally:
                for process in [first, second]:
                    if process.poll() is None:
                        process.kill()
                        process.wait()

reset_accounts()
for statement in [demote(A), f"delete from profiles where id='{A}';"]:
    result = sql(actor(A) + statement, check=False)
    assert count() == 2, result
assert sql("select has_schema_privilege('authenticated','peakguide_private','USAGE');").stdout.strip() == 'f'
assert sql("select has_function_privilege('authenticated','peakguide_private.serialize_profile_writes()','EXECUTE');").stdout.strip() == 'f'
bulk = sql("update profiles set role='user',is_admin=false;", check=False)
assert bulk.returncode != 0 and count() == 2, bulk
print(json.dumps({'migration_012': 'PASS', 'concurrent_cases': results,
                  'self_protection_and_bulk_rollback': 'PASS', 'private_lock_access': 'PASS'}, indent=2))
