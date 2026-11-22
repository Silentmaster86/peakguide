"""Integration fixture tests; never connects to a production database.

Uses a dedicated, explicitly named local DB and recreates only its test schemas.
Production practical defaults/constraints still require the owner's preflight.
"""
import argparse
import importlib.util
import json
import subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
FOLDER=ROOT/'docs/catalogue/kgp-practical-01'
p=argparse.ArgumentParser();p.add_argument('--docker');a=p.parse_args()
cmd=(['docker','exec','-i',a.docker] if a.docker else [])+['psql','-X','-U','postgres','-d','kgp_practical_01_test','-qAt','-v','ON_ERROR_STOP=1']
def sql(s,error=None):
 r=subprocess.run(cmd,input=s,text=True,capture_output=True)
 if error:assert r.returncode and error in r.stderr,r.stderr
 else:assert r.returncode==0,r.stderr
 return r.stdout.strip()
def literal(x):return '$seed$'+json.dumps(x,ensure_ascii=True,separators=(',',':'))+'$seed$::jsonb'
rows=json.loads((FOLDER/'records.json').read_text());apply=(FOLDER/'apply.sql').read_text(encoding='ascii');rollback=(FOLDER/'rollback.sql').read_text(encoding='ascii');verify=(FOLDER/'verify.sql').read_text(encoding='ascii')
assert apply.isascii() and rollback.isascii() and verify.isascii()
def reset():
 sql("do $$ begin create role anon;exception when duplicate_object then null;end $$;do $$ begin create role authenticated;exception when duplicate_object then null;end $$;drop schema if exists peakguide_private cascade;drop schema public cascade;create schema public;")
 sql((ROOT/'supabase/tests/kgp_practical_fixture.sql').read_text())
 seeds=[]
 for r in rows:
  t=r['expected_trail'];seeds.append(f"insert into peaks(id,slug)values({t['peak_id']},'{r['peak_slug']}');insert into trails select (jsonb_populate_record(null::trails,{literal(dict(t,active=True,route_geometry={'type':'LineString','coordinates':[[20,50],[20.1,50.1]]},distance_km=4,gpx_url='https://example.org/retained.gpx'))})).*;")
 sql('\n'.join(seeds))
 sql("insert into peaks(id,slug,active)values(999,'foreign-peak',true);insert into trails(id,peak_id,slug,active)values(999,999,'foreign-trail',true);insert into trail_access(trail_id,address,active)values(999,'Foreign access retained',true);insert into trail_access_i18n values(1,'pl','Foreign directions','Foreign bus','Foreign warnings');insert into trail_parking(trail_id,slug,paid,active)values(999,'foreign-parking',true,true);insert into trail_parking_i18n(parking_id,lang,name)values(1,'pl','Foreign parking');insert into peakguide_private.catalogue_batch_receipts(batch_key,snapshot)values('foreign-gpx-01','[{\"keep\":true}]');create table saved_user_links(id int,trail_id bigint references trails);insert into saved_user_links values(1,36);")
def snapshot():
 tables=['peaks','trails','trail_access','trail_access_i18n','trail_parking','trail_parking_i18n','saved_user_links','peakguide_private.catalogue_batch_receipts']
 return {t:sql(f'select coalesce(jsonb_agg(v order by v::text),\'[]\'::jsonb) from (select to_jsonb(t) v from {t} t) q;') for t in tables}
reset();before=snapshot();sql(rollback);assert snapshot()==before
sql(apply);after=snapshot()
for t in ['peaks','trails','saved_user_links']:assert after[t]==before[t],t
assert sql('select count(*) from trail_access')=='29'
assert sql('select count(*) from trail_parking')=='10'
assert sql('select count(*) from trail_access_i18n')=='113'
assert sql('select count(*) from trail_parking_i18n')=='37'
assert sql("select count(*) from trail_parking where trail_id<>999 and (toilets is not null or capacity is not null or overnight_allowed is not null or latitude is not null or longitude is not null)")=='0'
# Compare unrelated rows in all four practical tables explicitly.
for table,field in [('trail_access','id'),('trail_parking','id'),('trail_access_i18n','access_id'),('trail_parking_i18n','parking_id')]:
 assert [v for v in json.loads(after[table]) if v[field]==1] == json.loads(before[table])
checks=[json.loads(l) for l in sql('select row_to_json(q) from ('+verify.rstrip().removesuffix(';')+') q;').splitlines()]
assert len(checks)==28 and all(v['access_cards']==1 and v['access_translations']==4 and v['parking_cards']==v['expected_parking_cards'] and v['parking_translations']==4*v['parking_cards'] and v['route_identity_matches'] for v in checks)
for role in ['anon','authenticated']:
 assert sql(f'set role {role};select count(*) from trail_access;')=='29'
 assert sql(f'set role {role};select count(*) from trail_access_i18n;')=='113'
 sql(f'set role {role};'+apply,'Owner execution required')
 assert snapshot()==after
sql("set timezone='Europe/Warsaw';"+apply);assert snapshot()==after
sql("set timezone='America/New_York';"+rollback);assert snapshot()==before
sql(rollback);assert snapshot()==before
sql(apply)
# Guards cover later content changes, additions and referenced cards.
sql("update trail_access_i18n set directions='Owner later edit' where access_id=(select id from trail_access where trail_id=38) and lang='zh';")
later=snapshot();sql(apply,'Practical records changed');sql(rollback,'Practical records changed');assert snapshot()==later
reset();sql("insert into trail_access(trail_id,active)values(38,false);");before=snapshot();sql(apply,'Existing practical records');assert snapshot()==before
reset();sql("update trails set start_point_name='Owner changed start' where id=38;");before=snapshot();sql(apply,'Reviewed route identity changed');assert snapshot()==before
reset();sql("update trail_access set latitude=50;alter table trail_access alter column latitude set not null;");before=snapshot();sql(apply,'null value in column');assert snapshot()==before
reset();sql('alter table trail_access disable row level security;');before=snapshot();sql(apply,'Required practical table with RLS missing');assert snapshot()==before
reset();sql(apply);sql('create table test_bookmarks(id int,parking_id bigint references trail_parking on delete cascade);insert into test_bookmarks select 1,id from trail_parking where trail_id=36;');before=snapshot();sql(rollback,'Practical cards referenced');assert snapshot()==before;assert sql('select count(*) from test_bookmarks')=='1'
# Trigger altering content must roll back every earlier card in the package.
reset();sql("create function alter_card() returns trigger language plpgsql as $$begin if new.trail_id=38 then new.address='Unexpected';end if;return new;end $$;create trigger alter_card before insert on trail_access for each row execute function alter_card();")
before=snapshot();sql(apply,'Unexpected access content');assert snapshot()==before
print('PASS: 28 cards/112 texts, 9 parking/36 texts, NULL unknowns, read RLS, identity/inactive/trigger guards, idempotency, timezone-safe rollback/reapply, atomic late conflicts, preservation of foreign cards/routes/receipts and CASCADE references')
