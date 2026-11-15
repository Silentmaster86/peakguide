"""Integration against dedicated catalogue_management_test DB; fixture is not production schema."""
import argparse,json,subprocess
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('--docker');args=parser.parse_args()
root=Path(__file__).resolve().parents[2]
command=(['docker','exec','-i',args.docker] if args.docker else [])+['psql','-X','-U','postgres','-d','catalogue_management_test','-At','-v','ON_ERROR_STOP=1']
def sql(text,fail=None):
 r=subprocess.run(command,input=text,text=True,capture_output=True)
 if fail: assert r.returncode and fail in r.stderr,r.stderr
 else: assert not r.returncode,r.stderr
 return r.stdout.strip()
def call(kind,body,id='null',rev='null',admin=True,fail=None):
 return sql(f"set role authenticated; set test.admin='{'yes' if admin else 'no'}'; select public.admin_save_{kind}({id},$j${json.dumps(body)}$j$,{rev});",fail)
# Separate DB prevents accidental changes to a production database.
sql('drop schema if exists peakguide_private cascade; drop schema public cascade; create schema public;')
sql((root/'supabase/tests/catalogue_management_fixture.sql').read_text())
sql((root/'supabase/migrations/202611150014_catalogue_management.sql').read_text())
trail={'peak_id':1,'slug':'sample','active':False,'route_type':'out-and-back','i18n':{'en':{'name':'Sample','description':'Description'}}}
call('trail',trail,admin=False,fail='Admin access required')
sql("set role anon; select public.admin_save_trail(null,'{}');",'permission denied')
id=call('trail',trail).splitlines()[-1];assert sql('select count(*) from trails_i18n')=='1'
revision=sql(f'select updated_at from trails where id={id}')
changed={**trail,'slug':'edited'}
call('trail',changed,id,f"'{revision}'")
call('trail',trail,id,f"'{revision}'",fail='Record changed')
revision=sql(f'select updated_at from trails where id={id}')
call('trail',{**trail,'i18n':{'en':{'name':'FORCE_FAIL'}}},id,f"'{revision}'",fail='check constraint')
assert sql(f'select slug from trails where id={id}')=='edited'
assert sql(f'select updated_at from trails where id={id}')==revision
sql("set role authenticated;set test.admin='yes';update trails_i18n set description='Direct change' where lang='en';")
call('trail',trail,id,f"'{revision}'",fail='Record changed')
poi={'peak_id':1,'trail_id':int(id),'type_id':1,'latitude':50,'longitude':20,'active':True,'source_url':'https://example.test/source','i18n':{'pl':{'name':'Parking'}}}
poi_id=call('poi',poi).splitlines()[-1]
assert sql('select count(*) from pois_i18n')=='1'
call('poi',{**poi,'peak_id':2},fail='Trail belongs to another peak')
revision=sql(f'select updated_at from trails where id={id}')
call('trail',{**trail,'peak_id':2},id,f"'{revision}'",fail='Linked POIs')
call('poi',{**poi,'longitude':None},fail='Invalid coordinates')
call('poi',{**poi,'website_url':'javascript:alert(1)'},fail='Invalid URL')
call('trail',{**trail,'slug':'geo','route_geometry':{'type':'LineString','coordinates':[[20,50],[20.1,50.1]]}},fail='Geometry needs source')
geo={**trail,'slug':'geo','route_geometry':{'type':'LineString','coordinates':[[20,50],[20.1,50.1]]},'geometry_source_url':'https://example.test/geometry','geometry_verified_at':'2026-11-15T00:00:00Z'}
call('trail',geo)
call('trail',{**geo,'slug':'bad','route_geometry':{'type':'LineString','coordinates':[[20,50],[200,50.1]]}},fail='Invalid route geometry')
assert sql('select count(*) from trails')=='2'
# Published rows/translated content stay hidden when the parent peak is inactive.
assert sql("set role anon; select count(*) from trails;").splitlines()[-1]=='0'
assert sql("set role anon; select count(*) from pois;").splitlines()[-1]=='1'
sql("update peaks set active=false where id=1;")
assert sql("set role anon; select count(*) from pois;").splitlines()[-1]=='0'
assert sql("set role anon; select count(*) from pois_i18n;").splitlines()[-1]=='0'
# RLS prevents regular users from direct writes as well as RPC use.
sql("set role authenticated;set test.admin='no';insert into trails(peak_id,slug,route_type,active)values(1,'denied','loop',true);",'row-level security')
print('PASS admin/anon/RLS, atomic translations, stale edits, direct translation revision, POI-parent consistency, URL/coordinate and geometry validation')
# The five-peak import is idempotent and rollback refuses later editorial changes.
sql("insert into peaks(id,slug,active)values(10,'waligora',true),(12,'chelmiec',true),(14,'skopiec',true),(27,'sleza',true),(28,'lysica',true);")
sql("insert into poi_types(id,slug)values(2,'shelter'),(3,'trailhead'),(4,'viewpoint');")
apply=(root/'docs/catalogue/batch-01/apply.sql').read_text();rollback=(root/'docs/catalogue/batch-01/rollback.sql').read_text()
sql(apply);assert float(sql("select st_length(st_geomfromgeojson(route_geometry::text)::geography)/1000 from trails where slug='lysica-czas-w-las-petla'"))>11;assert sql('select count(*) from trails')=='7';assert sql('select count(*) from pois')=='6'
sql(apply);assert sql('select count(*) from trails')=='7'
sql(rollback);assert sql('select count(*) from trails')=='2';assert sql('select count(*) from pois')=='1'
sql(apply)
sql("update trails_i18n set notes='Later editor change' where trail_id=(select id from trails where slug='lysica-czas-w-las-petla') and lang='pl';")
sql(rollback,fail='Imported record changed')
assert sql('select count(*) from trails')=='7'
print('PASS batch01 insert/idempotency/rollback and protection of later edits')
