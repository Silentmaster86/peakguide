"""Geometry-only integration against the dedicated foreign_gpx_01_test DB."""
import argparse
import importlib.util
import json
import math
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[2]
folder = root / 'docs/catalogue/foreign-gpx-01'
parser = argparse.ArgumentParser()
parser.add_argument('--docker')
args = parser.parse_args()
cmd = (['docker', 'exec', '-i', args.docker] if args.docker else []) + ['psql', '-X', '-U', 'postgres', '-d', 'foreign_gpx_01_test', '-At', '-v', 'ON_ERROR_STOP=1']


def sql(text, error=None):
    r = subprocess.run(cmd, input=text, text=True, capture_output=True)
    if error:
        assert r.returncode and error in r.stderr, r.stderr
    else:
        assert not r.returncode, r.stderr
    return r.stdout.strip()


spec = importlib.util.spec_from_file_location('gpx_builder', root / 'scripts/build_foreign_gpx_01.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
sample = b'''<gpx xmlns="http://www.topografix.com/GPX/1/1" creator="https://mapa-turystyczna.pl"><metadata><time>2026-01-01T00:00:00Z</time></metadata><trk><name>Source credit</name><trkseg><trkpt lat="49" lon="20"><time>2026-01-01T00:00:00Z</time></trkpt><trkpt lat="49.1" lon="20.1"><time>2026-01-01T00:00:30Z</time></trkpt></trkseg></trk></gpx>'''
fingerprint = builder.semantic_gpx_hash(sample, 'mapa_relative_export_times')
assert fingerprint == builder.semantic_gpx_hash(sample.replace(b'2026-01-01', b'2026-02-01'), 'mapa_relative_export_times')
assert fingerprint != builder.semantic_gpx_hash(sample.replace(b'49.1', b'49.2'), 'mapa_relative_export_times')
assert fingerprint != builder.semantic_gpx_hash(sample.replace(b'Source credit', b'Changed licence'), 'mapa_relative_export_times')
assert fingerprint != builder.semantic_gpx_hash(sample.replace(b'00:00:30', b'00:00:31'), 'mapa_relative_export_times')
assert builder.semantic_gpx_hash(sample, 'none') != builder.semantic_gpx_hash(sample.replace(b'2026-01-01', b'2026-02-01'), 'none')
changes = json.loads((folder / 'changes.json').read_text(encoding='utf-8'))
apply = (folder / 'apply.sql').read_text(encoding='ascii')
rollback = (folder / 'rollback.sql').read_text(encoding='ascii')
verify = (folder / 'verify.sql').read_text(encoding='ascii')
assert all(s.isascii() for s in (apply, rollback, verify))
for c in changes:
    lines = c['after']['route_geometry']['coordinates']
    assert c['after']['route_geometry']['type'] == 'MultiLineString'
    assert len(lines) == 1
    assert all(len(p) == 2 and all(math.isfinite(v) for v in p) and 19 < p[0] < 25 and 48 < p[1] < 50 for line in lines for p in line)
    assert sum(map(len, lines)) == (252 if c['id'] == 8 else 939)
    if c['id'] == 10:
        assert lines[0][0] == lines[-1][-1]
        # The source loop must visit the summit before returning via Jamske pleso.
        summit = min(range(len(lines[0])), key=lambda i: math.dist(lines[0][i], [20.0001, 49.1628]))
        lake = min(range(len(lines[0])), key=lambda i: math.dist(lines[0][i], [20.0115, 49.1332]))
        assert summit < lake
        assert math.dist(lines[0][summit], [20.0001, 49.1628]) < .0005
        assert math.dist(lines[0][lake], [20.0115, 49.1332]) < .0005
    else:
        # Starts at the checkpoint, rather than at the much higher Zarosliak base.
        assert math.dist(lines[0][0], [24.5916, 48.2075]) < .0001
        assert math.dist(lines[-1][-1], [24.5001, 48.1603]) < .0005


def reset():
    sql('drop schema if exists peakguide_private cascade;drop schema public cascade;create schema public;')
    sql((root / 'supabase/tests/catalogue_management_fixture.sql').read_text())
    sql((root / 'supabase/migrations/202611150014_catalogue_management.sql').read_text())
    sql("alter table trails add column created_at timestamptz;insert into peaks(id,slug,active)values(148,'hoverla',true),(150,'krivan',true);create schema peakguide_private;create table peakguide_private.catalogue_batch_receipts(batch_key text primary key,snapshot jsonb not null,created_at timestamptz default now());alter table peakguide_private.catalogue_batch_receipts enable row level security;revoke all on schema peakguide_private from public,anon,authenticated;insert into peakguide_private.catalogue_batch_receipts(batch_key,snapshot)values('unrelated-kgp','[{\"unchanged\":true}]');")
    for c in changes:
        row = json.dumps(c['before']['row'], ensure_ascii=True)
        sql(f"insert into trails select (jsonb_populate_record(null::trails,$seed${row}$seed$::jsonb)).*;")
        for text in c['before']['i18n']:
            value = json.dumps(text, ensure_ascii=True)
            sql(f"insert into trails_i18n select (jsonb_populate_record(null::trails_i18n,$seed${value}$seed$::jsonb)).*;")
    sql("insert into trails(id,peak_id,slug,start_point_name)values(999,1,'unrelated-trail','Owner start');create table test_user_links(trail_id bigint references trails,label text);insert into test_user_links values(8,'preserve user relation');insert into pois(id,peak_id,trail_id,type_id,active)values(999,148,8,1,true);")


def snapshot():
    return json.loads(sql("select jsonb_build_object('trails',(select jsonb_agg(to_jsonb(t) order by id) from trails t),'i18n',(select jsonb_agg(to_jsonb(i) order by trail_id,lang) from trails_i18n i),'pois',(select jsonb_agg(to_jsonb(p) order by id) from pois p),'links',(select jsonb_agg(to_jsonb(l)) from test_user_links l),'receipts',(select jsonb_agg(to_jsonb(r) order by batch_key) from peakguide_private.catalogue_batch_receipts r));"))


def logical(state):
    state = json.loads(json.dumps(state))
    for t in state['trails']:
        t.pop('updated_at', None)
    return state


reset()
before = snapshot()
sql(rollback)
assert snapshot() == before
sql(apply)
after = snapshot()
expected = json.loads(json.dumps(before))
for t in expected['trails']:
    c = next((x for x in changes if x['id'] == t['id']), None)
    if c:
        t.update(c['after'])
        t['geometry_verified_at'] = t['geometry_verified_at'].replace('Z', '+00:00')
# Only four fields and native timestamps may change; references, texts and KGP receipts remain.
for key in ('trails', 'i18n', 'pois', 'links'):
    assert logical(after)[key] == logical(expected)[key], key
assert next(r for r in after['receipts'] if r['batch_key'] == 'unrelated-kgp') == before['receipts'][0]
rows = [json.loads(line) for line in sql('select row_to_json(v) from (' + verify.rstrip().removesuffix(';') + ') v').splitlines()]
assert len(rows) == 2 and all(r['geometry_matches_review'] and r['gpx_matches_review'] and r['upgrade_applied'] and r['languages'] == ['en', 'pl', 'ua', 'zh'] for r in rows)
sql("set timezone='Europe/Warsaw';" + apply)
assert snapshot() == after
sql("set timezone='America/New_York';" + rollback)
restored = snapshot()
assert logical(restored) == logical(before)
sql(rollback)
assert snapshot() == restored
sql(apply)  # Reapply after rollback must work despite native timestamp changes.
assert all(t['route_geometry'] for t in snapshot()['trails'] if t['id'] in (8, 10))
# A later edit must block both idempotent apply and rollback, atomically.
sql("update trails_i18n set notes='Owner later edit' where trail_id=10 and lang='pl';")
later = snapshot()
sql(apply, 'Upgraded trail changed')
sql(rollback, 'Upgraded trail changed')
assert snapshot() == later
# Late initial conflict rolls back the first geometry update and receipt insertion.
reset()
sql("update trails_i18n set description='Owner current description' where trail_id=10 and lang='zh';")
before = snapshot()
sql(apply, 'Reviewed trail changed')
assert snapshot() == before
reset()
sql("update trails set gpx_url='https://example.org/owner.gpx' where id=10;")
before = snapshot()
sql(apply, 'Reviewed trail changed')
assert snapshot() == before
reset()
sql("update peaks set active=false where id=150;")
before = snapshot()
sql(apply, 'Reviewed peak missing or changed')
assert snapshot() == before
reset()
sql(apply)
sql("create function test_unexpected_rollback() returns trigger language plpgsql as $$ begin if old.route_geometry is not null and new.route_geometry is null then new.distance_km=999; end if; return new; end $$;create trigger test_unexpected_rollback before update on trails for each row execute function test_unexpected_rollback();")
before = snapshot()
sql(rollback, 'Unexpected rollback content')
assert snapshot() == before
reset()
for role in ('anon', 'authenticated'):
    before = snapshot()
    sql(f'set role {role};' + apply, 'permission denied')
    assert snapshot() == before
print('PASS: 1191 source points, loop/ascent coverage, ASCII, typed snapshot guards, atomic late conflicts, no overwritten GPX, idempotency, rollback/reapply, preserved IDs/text/metrics/relations/KGP receipts and denied client writes')
