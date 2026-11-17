"""Only the disposable lysica_review_test DB is reset. Supports --docker NAME."""
import argparse,json,subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[2];folder=root/'docs/catalogue/lysica-review'
parser=argparse.ArgumentParser();parser.add_argument('--docker');args=parser.parse_args()
cmd=(['docker','exec','-i',args.docker] if args.docker else [])+['psql','-X','-U','postgres','-d','lysica_review_test','-At','-v','ON_ERROR_STOP=1']
def sql(text,error=None):
 r=subprocess.run(cmd,input=text,text=True,capture_output=True)
 if error:assert r.returncode and error in r.stderr,r.stderr
 else:assert not r.returncode,r.stderr
 return r.stdout.strip()
data=json.loads((folder/'change.json').read_text());apply=(folder/'apply.sql').read_text();rollback=(folder/'rollback.sql').read_text()
def reset():
 sql('''drop schema public cascade; create schema public; create extension postgis;
 create table mountain_ranges(id bigint primary key,slug text);
 insert into mountain_ranges values(28,'gory-swietokrzyskie');
 create table peaks(id bigint primary key,slug text,range_id bigint references mountain_ranges,subrange_id bigint,
 elevation_m integer,latitude numeric(9,6),longitude numeric(9,6),difficulty text,best_season text,cover_image_url text,
 is_korona boolean,active boolean,created_at timestamptz,geom geography(Point,4326),
 cover_image_author text,cover_image_source_url text,cover_image_license text,cover_image_license_url text);
 create table peaks_i18n(peak_id bigint references peaks,lang text,name text,description text,short_description text,tips text,primary key(peak_id,lang));
 create table trails(id bigint primary key,peak_id bigint references peaks,slug text);
 create table pois(id bigint primary key,peak_id bigint references peaks);
 create table test_history(peak_id bigint references peaks,note text);
 ''')
 peak=data['before'];sql('insert into peaks select * from jsonb_populate_record(null::peaks,$seed$'+json.dumps(peak)+'$seed$::jsonb);')
 main={**peak,'id':28,'slug':'lysica','is_korona':True,'elevation_m':614,'latitude':50.891944,'longitude':20.896111};sql('insert into peaks select * from jsonb_populate_record(null::peaks,$seed$'+json.dumps(main)+'$seed$::jsonb);')
 texts=data['translations']+[{**t,'peak_id':28,'description':'Original main peak description'} for t in data['translations']]
 sql('insert into peaks_i18n select * from jsonb_populate_recordset(null::peaks_i18n,$seed$'+json.dumps(texts)+'$seed$::jsonb);')
 sql("insert into trails values(13,28,'lysica-czas-w-las-petla');insert into pois values(9,28);insert into test_history values(83,'Existing user reference must survive');")
 # Exercise anonymous visibility under a representative production active-only RLS policy.
 sql("do $$ begin create role anon; exception when duplicate_object then null; end $$;alter table peaks enable row level security;create policy public_active on peaks for select to anon using(active=true);grant usage on schema public to anon;grant select on peaks to anon;")
def snapshot():
 return sql("select jsonb_build_object('peaks',(select jsonb_agg(to_jsonb(p) order by id) from peaks p),'i18n',(select jsonb_agg(to_jsonb(i) order by peak_id,lang) from peaks_i18n i),'trails',(select jsonb_agg(to_jsonb(t)) from trails t),'pois',(select jsonb_agg(to_jsonb(p)) from pois p),'history',(select jsonb_agg(to_jsonb(h)) from test_history h));")
reset();before=json.loads(snapshot());sql(rollback);assert json.loads(snapshot())==before
sql(apply);after=json.loads(snapshot());expected=json.loads(json.dumps(before));next(p for p in expected['peaks'] if p['id']==83)['active']=False;assert after==expected,'Only active of peak83 may change'
assert sql('set role anon;select string_agg(id::text,\',\' order by id) from peaks;reset role;')=='SET\n28\nRESET'
sql(apply);assert json.loads(snapshot())==after
v=json.loads(sql((folder/'verify.sql').read_text()));assert v['public_matches']==[{'id':28,'slug':'lysica'}]
sql(rollback);sql(rollback);assert json.loads(snapshot())==before
print('PASS hide/repeat/rollback; anonymous RLS; preserve main peak, 8 translations, route, POI and existing history')
for change,error in [
 ("update peaks set latitude=50.91 where id=83",'Reviewed peak changed'),
 ("update peaks_i18n set description='New owner edit' where peak_id=83 and lang='pl'",'Reviewed translations changed'),
 ("delete from peaks_i18n where peak_id=83 and lang='zh'",'Reviewed translations changed'),
 ("insert into trails values(99,83,'new-owner-trail')",'linked trails or POIs'),
 ("insert into pois values(99,83)",'linked trails or POIs'),
 ("update peaks set slug='owner-new-slug' where id=28",'Main Lysica identity changed'),
 ("update mountain_ranges set slug='changed-range'",'Range identity changed')]:
 reset();sql(change);current=snapshot();sql(apply,error);assert snapshot()==current
reset();sql(apply);sql("update peaks_i18n set tips='Later review' where peak_id=83 and lang='en'");changed=snapshot();sql(rollback,'Reviewed translations changed');assert snapshot()==changed
print('PASS stale coordinates/text, missing translation, new linked records, changed identities and guarded rollback')
