"""Disposable PostgreSQL/PostGIS fixture; never a production baseline.

Requires a dedicated database named catalogue_review_test. Use --docker NAME
for a local disposable container, or PGHOST/PGUSER/PGPASSWORD for CI.
"""
import argparse
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
REVIEW = ROOT / 'docs/audit/2026-11-14'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--docker')
args = parser.parse_args()
cmd = (['docker', 'exec', '-i', args.docker] if args.docker else []) + [
    'psql', '-X', '-U', 'postgres', '-d', 'catalogue_review_test', '-At', '-v', 'ON_ERROR_STOP=1']


def sql(text, fails=False):
    result = subprocess.run(cmd, input=text, text=True, capture_output=True)
    if fails:
        assert result.returncode != 0, 'Expected patch rejection'
        assert 'Row edited since review' in result.stderr or 'Missing row' in result.stderr, result.stderr
    else:
        assert result.returncode == 0, result.stderr
    return result.stdout.strip()


fixture = json.loads((REVIEW / 'catalogue-before.json').read_text())
setup = '''drop schema public cascade; create schema public; create extension postgis;
create table mountain_ranges(id bigint primary key, slug text unique);
insert into mountain_ranges values(22,'beskid-wyspowy');
create table peaks(id bigint primary key, slug text, range_id bigint, elevation_m integer,
 latitude numeric(9,6), longitude numeric(9,6), active boolean, geom geography(Point,4326));
create table peaks_i18n(peak_id bigint references peaks, lang text, name text, description text,
 primary key(peak_id,lang));
create table trails_i18n(trail_id bigint, lang text, notes text, primary key(trail_id,lang));
'''
for table, rows in fixture.items():
    # jsonb_populate_recordset ignores unrelated public snapshot fields.
    if table == 'peaks':
        rows = [{k:v for k,v in r.items() if k != 'geom'} for r in rows]
    setup += f'insert into {table} select * from jsonb_populate_recordset(null::{table}, $seed${json.dumps(rows, ensure_ascii=False)}$seed$::jsonb);\n'
setup += 'update peaks set geom = st_setsrid(st_makepoint(longitude::float8,latitude::float8),4326)::geography;'
apply = (REVIEW / 'apply.sql').read_text()
rollback = (REVIEW / 'rollback.sql').read_text()


def snapshot():
    return sql("select jsonb_build_object('peaks',(select jsonb_agg(to_jsonb(p) order by id) from peaks p),'texts',(select jsonb_agg(to_jsonb(p) order by peak_id,lang) from peaks_i18n p),'notes',(select jsonb_agg(to_jsonb(p) order by trail_id,lang) from trails_i18n p));")


sql(setup)
before = snapshot()
sql(apply)
assert sql('select elevation_m from peaks where id=71') == '803'
assert sql('select st_x(geom::geometry)=20.462113 and st_y(geom::geometry)=49.642726 from peaks where id=71') == 't'
assert sql('select count(*) from peaks_i18n where description is not null') == '8'
after = snapshot()
assert before != after
sql(apply)
assert snapshot() == after, 'Re-run must be a no-op'
sql(rollback)
assert snapshot() == before, 'Rollback must restore exactly the reviewed public fields'
sql(rollback)
assert snapshot() == before
print('PASS apply, coordinates/geom, eight descriptions, idempotent apply and rollback')

sql("update trails_i18n set notes='Concurrent editorial change' where trail_id=10 and lang='zh';")
stale = snapshot()
sql(apply, fails=True)
assert snapshot() == stale, 'Late stale row must roll back earlier writes'
print('PASS stale-row rejection and atomic rollback')
sql(setup)
sql("delete from peaks_i18n where peak_id=10 and lang='zh';")
missing = snapshot()
sql(apply, fails=True)
assert snapshot() == missing
print('PASS missing translation rejection')
sql(setup)
sql(apply)
sql("update peaks_i18n set description='Newer editor text' where peak_id=10 and lang='zh';")
changed = snapshot()
sql(rollback, fails=True)
assert snapshot() == changed
print('PASS rollback preserves subsequent editorial changes')
