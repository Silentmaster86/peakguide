"""Integration checks; resets ONLY a dedicated local nonkgp_06_test database."""
import argparse
import json
import os
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
FOLDER=ROOT/'docs/catalogue/nonkgp-06'
parser=argparse.ArgumentParser();parser.add_argument('--docker');args=parser.parse_args()
if not args.docker and os.environ.get('PGHOST','localhost') not in {'localhost','127.0.0.1','::1'}:
    raise SystemExit('Local test host required')
cmd=(['docker','exec','-i',args.docker] if args.docker else [])+['psql','-h','/var/run/postgresql' if args.docker else os.environ.get('PGHOST','localhost'),'-X','-U','postgres','-d','nonkgp_06_test','-qAt','-v','ON_ERROR_STOP=1']
def sql(text,error=None):
    result=subprocess.run(cmd,input=text,text=True,capture_output=True)
    if error:assert result.returncode and error in result.stderr,result.stderr
    else:assert result.returncode==0,result.stderr
    return result.stdout.strip()
assert sql('select current_database()')=='nonkgp_06_test'
apply=(FOLDER/'apply.sql').read_text(encoding='ascii');rollback=(FOLDER/'rollback.sql').read_text(encoding='ascii');verify=(FOLDER/'verify.sql').read_text(encoding='ascii')
records=json.loads((FOLDER/'records.json').read_text());identities=json.loads((FOLDER/'peaks.json').read_text())
assert {r['body']['peak_slug'] for r in records}=={'czarna-gora','kalenica','wiezyca'} and len(records)==6
assert all(set(r['body']['i18n'])=={'en','pl','ua','zh'} for r in records)
assert sum(sum(map(len,r['body']['route_geometry']['coordinates'])) for r in records if r['kind']=='trail')==403

def reset():
    sql('drop schema if exists peakguide_private cascade; drop schema public cascade; create schema public;')
    sql((ROOT/'supabase/tests/catalogue_management_fixture.sql').read_text())
    sql((ROOT/'supabase/migrations/202611150014_catalogue_management.sql').read_text())
    sql('''create table mountain_ranges(id bigint primary key,slug text not null unique);
insert into mountain_ranges values(2,'masyw-snieznika'),(6,'gory-sowie'),(12,'gory-walbrzyskie'),(27,'masyw-slezy'),(3,'gory-izerskie'),(13,'gory-bardzkie'),(17,'beskid-zywiecki'),(18,'bieszczady-zachodnie'),(19,'gorce'),(22,'beskid-wyspowy'),(23,'beskid-niski');
alter table peaks add column range_id bigint references mountain_ranges,add column is_korona boolean default false,
 add column latitude numeric(9,6),add column longitude numeric(9,6),add column elevation_m integer,
 add column cover_image_author text;
delete from peaks; delete from poi_types;
insert into poi_types(id,slug)values(1,'shelter'),(2,'viewpoint'),(3,'transport'),(4,'trailhead'),(5,'attraction');
create schema peakguide_private;
create table peakguide_private.catalogue_batch_receipts(batch_key text primary key,snapshot jsonb not null,created_at timestamptz default now());
insert into peakguide_private.catalogue_batch_receipts values('kgp-sentinel','{"unchanged":true}',now());
grant select on trails,trails_i18n,pois,pois_i18n to anon;
create policy public_trails on trails for select to anon,authenticated using(active);
create policy public_trails_i18n on trails_i18n for select to anon,authenticated using(exists(select from trails t where t.id=trail_id and t.active));
create policy public_pois on pois for select to anon,authenticated using(active);
create policy public_pois_i18n on pois_i18n for select to anon,authenticated using(exists(select from pois p where p.id=poi_id and p.active));
''')
    for peak in identities:
        sql("insert into peaks(id,slug,active,is_korona,range_id,latitude,longitude,elevation_m)select id,slug,active,is_korona,range_id,latitude,longitude,elevation_m from jsonb_populate_record(null::peaks,$j$"+json.dumps(peak)+"$j$)")
    sql("insert into peaks(id,slug,active,is_korona,range_id,latitude,longitude,elevation_m) values(73,'ostry-wierch',true,false,23,49.4178,20.4204,851),(1,'sniezka',true,true,23,50,15,1603);")
    excluded=json.loads((FOLDER/'unresolved.json').read_text())[0]['peak']
    sql("insert into peaks(id,slug,active,is_korona,range_id,latitude,longitude,elevation_m)select id,slug,active,is_korona,range_id,latitude,longitude,elevation_m from jsonb_populate_record(null::peaks,$j$"+json.dumps(excluded)+"$j$)")
    sql("select setval(pg_get_serial_sequence('trails','id'),10);select setval(pg_get_serial_sequence('pois','id'),10);")

def counts():return sql("select concat((select count(*) from trails),',',(select count(*) from pois),',',(select range_id from peaks where id=31),',',(select count(*) from peakguide_private.catalogue_batch_receipts where batch_key='nonkgp-06'))")
# Use a wrapper to get simple row JSON without depending on psql table formatting.
def read_verification():
    query=verify[verify.index('with manifest'):].strip().rstrip(';')
    return json.loads(sql('select jsonb_agg(v) from ('+query+') v'))

def schema_permissions():
    return sql("select jsonb_build_object('policies',(select jsonb_agg(to_jsonb(p)order by tablename,policyname)from pg_policies p where schemaname='public'),'grants',(select jsonb_agg(to_jsonb(g)order by table_name,grantee,privilege_type)from information_schema.role_table_grants g where table_schema='public'))")

reset();before_permissions=schema_permissions();before_other=sql('select jsonb_agg(to_jsonb(p)order by id)from peaks p')
assert all(row['trails']==row['pois']==0 and not row['package_applied'] for row in read_verification())
sql(apply);assert counts()=='3,3,2,1'
assert schema_permissions()==before_permissions
assert sql('select jsonb_agg(to_jsonb(p)order by id)from peaks p')==before_other
first=sql("select snapshot from peakguide_private.catalogue_batch_receipts where batch_key='nonkgp-06'")
sql("set timezone='Pacific/Honolulu';"+apply)
assert sql("select snapshot from peakguide_private.catalogue_batch_receipts where batch_key='nonkgp-06'")==first
sql("update peakguide_private.catalogue_batch_receipts set snapshot=jsonb_set(snapshot,'{manifest_sha256}', '\"bad\"')where batch_key='nonkgp-06'")
sql(apply,'Incomplete or different');sql(rollback,'Incomplete or different');assert counts()=='3,3,2,1'
assert all(not row['package_applied'] for row in read_verification())
sql("update peakguide_private.catalogue_batch_receipts set snapshot=$receipt$"+first+"$receipt$::jsonb where batch_key='nonkgp-06'")
rows=read_verification();assert len(rows)==3 and all(row['review_matches'] and row['package_applied'] and row['mapped_trails']==1 and row['trail_languages']==row['poi_languages']==['en','pl','ua','zh'] for row in rows),rows
assert sql('select count(*)from trails where st_isvalid(st_geomfromgeojson(route_geometry::text))')=='3'
for kind in ['trail','poi']:
    table='trails' if kind=='trail' else 'pois';extra='notes' if kind=='trail' else 'tips'
    for record in [r for r in records if r['kind']==kind]:
        body=record['body'];pid=next(p['id']for p in identities if p['slug']==body['peak_slug'])
        actual=json.loads(sql(f"select jsonb_object_agg(i.lang,jsonb_build_object('name',i.name,'description',i.description,'{extra}',i.{extra})) from {table}_i18n i join {table} p on p.id=i.{kind}_id where p.peak_id={pid}"))
        assert actual==body['i18n']
assert sql('set role anon;select count(*)from trails;reset role;').splitlines()==['3']
sql('set role anon;select *from peakguide_private.catalogue_batch_receipts;','permission denied')
sql("set role authenticated;select public.admin_save_trail(null,'{}',null);",'Admin access required')
# Imported child edits must block both repeat and rollback.
sql("update trails_i18n set notes='Owner edit'where lang='pl'and trail_id=(select id from trails where peak_id=31)")
sql(apply,'Imported record changed');sql(rollback,'Imported record changed');assert counts()=='3,3,2,1'
reset();sql(apply)
# Unknown future referencing tables must not lose CASCADE or SET NULL rows.
sql('create table saved_walks(id int,trail_id bigint references trails on delete cascade);insert into saved_walks select 1,id from trails where peak_id=31;')
sql(rollback,'Dependent records');assert counts()=='3,3,2,1';assert sql('select count(*)from saved_walks')=='1'
sql('delete from saved_walks;create table itinerary(id int,poi_id bigint references pois on delete set null);insert into itinerary select 1,id from pois where peak_id=82;')
sql(rollback,'Dependent records');assert sql('select count(*)from itinerary where poi_id is not null')=='1'
sql('delete from itinerary;')
# Rollback must preserve later non-identity peak fields, not restore a whole stale row.
sql("update peaks set cover_image_author='Later photo credit'where id=31;")
sql(rollback);sql(rollback);assert counts()=='0,0,2,0'
assert sql('select cover_image_author from peaks where id=31')=='Later photo credit'
assert sql("select snapshot from peakguide_private.catalogue_batch_receipts where batch_key='kgp-sentinel'")=='{"unchanged": true}'
sql(apply);assert counts()=='3,3,2,1'
# Hidden records cannot be silently duplicated.
reset();sql("insert into trails(peak_id,slug,active)values(82,'existing-draft',false)")
sql(apply,'Existing catalogue content');assert counts()=='1,0,2,0'
# A late translation failure must undo all preceding inserts.
reset();sql("""create function fail_translation()returns trigger language plpgsql as $$begin if new.lang='zh'and new.name='Wieżyca——石制观景塔'then raise exception 'Late translation failure';end if;return new;end$$;
create trigger fail_translation before insert on pois_i18n for each row execute function fail_translation();""")
sql(apply,'Late translation failure');assert counts()=='0,0,2,0'
# Parent identity and range drift stop the entire package.
reset();sql('update peaks set longitude=20 where id=31;');sql(apply,'Reviewed peak identity changed');assert counts()=='0,0,2,0'
reset();sql(apply);sql("update mountain_ranges set slug='changed'where id=2;")
assert not next(r for r in read_verification() if r['peak_slug']=='czarna-gora')['review_matches']
sql(apply,'Reviewed range changed');sql(rollback,'Reviewed range changed');assert counts()=='3,3,2,1'
# A postponed SQL batch must not become an implicit dependency or be overwritten.
reset()
for peak in json.loads((ROOT/'docs/catalogue/nonkgp-05/peaks.json').read_text()):
    sql("insert into peaks(id,slug,active,is_korona,range_id,latitude,longitude,elevation_m)select id,slug,active,is_korona,range_id,latitude,longitude,elevation_m from jsonb_populate_record(null::peaks,$j$"+json.dumps(peak)+"$j$)")
previous_apply=(ROOT/'docs/catalogue/nonkgp-05/apply.sql').read_text(encoding='ascii')
sql(previous_apply)
previous=sql("select snapshot from peakguide_private.catalogue_batch_receipts where batch_key='nonkgp-05'")
sql(apply);assert counts()=='5,5,2,1'
sql(rollback);assert counts()=='2,2,2,0'
assert sql("select snapshot from peakguide_private.catalogue_batch_receipts where batch_key='nonkgp-05'")==previous
sql(previous_apply)
# Reverse deployment order: new batch first, then the delayed batch.
sql((ROOT/'docs/catalogue/nonkgp-05/rollback.sql').read_text(encoding='ascii'))
sql(apply);assert counts()=='3,3,2,1'
sql(previous_apply);assert counts()=='5,5,2,1'
sql(apply)
print('PASS nonkgp-06: 3 trails, 3 POIs, 24 exact translations, 403 points; no peak changes; typed verification; repeat/rollback/edit/dependency/inactive/late-error guards; both deployment orders with nonkgp-05; public permissions and unrelated peaks retained')
# The grouped owner paste is a SINGLE transaction, not concatenated independent commits.
group_apply=(ROOT/'docs/catalogue/nonkgp-05-06/apply.sql').read_text(encoding='ascii')
group_verify=(ROOT/'docs/catalogue/nonkgp-05-06/verify.sql').read_text(encoding='ascii')
def reset_group():
    reset()
    for peak in json.loads((ROOT/'docs/catalogue/nonkgp-05/peaks.json').read_text()):
        sql("insert into peaks(id,slug,active,is_korona,range_id,latitude,longitude,elevation_m)select id,slug,active,is_korona,range_id,latitude,longitude,elevation_m from jsonb_populate_record(null::peaks,$j$"+json.dumps(peak)+"$j$)")
def group_rows():
    query=group_verify[group_verify.index('select *'):].strip().rstrip(';')
    return json.loads(sql('select jsonb_agg(v)from('+query+')v'))
reset_group();parents=sql('select jsonb_agg(to_jsonb(p)order by id)from peaks p');permissions=schema_permissions()
sql(group_apply);assert counts()=='5,5,2,1'
rows=group_rows();assert len(rows)==5 and all(r['review_matches']and r['package_applied']for r in rows)
assert sum(r['batch_key']=='nonkgp-05'for r in rows)==2
assert sum(r['batch_key']=='nonkgp-06'for r in rows)==3
receipts=sql('select jsonb_agg(to_jsonb(r)order by batch_key)from peakguide_private.catalogue_batch_receipts r')
sql(group_apply);assert receipts==sql('select jsonb_agg(to_jsonb(r)order by batch_key)from peakguide_private.catalogue_batch_receipts r')
assert parents==sql('select jsonb_agg(to_jsonb(p)order by id)from peaks p')
assert schema_permissions()==permissions
# A conflict in the SECOND package must not leave package05 inserted or receipted.
reset_group();sql('update peaks set longitude=20 where id=82;')
sql(group_apply,'Reviewed peak identity changed');assert counts()=='0,0,2,0'
assert sql("select count(*)from peakguide_private.catalogue_batch_receipts where batch_key='nonkgp-05'")=='0'
reset_group();sql("""create function fail_group_translation()returns trigger language plpgsql as $$begin if new.lang='zh'and new.name='Wieżyca——石制观景塔'then raise exception 'Grouped late translation failure';end if;return new;end$$;
create trigger fail_group_translation before insert on pois_i18n for each row execute function fail_group_translation();""")
sql(group_apply,'Grouped late translation failure');assert counts()=='0,0,2,0'
assert sql("select count(*)from peakguide_private.catalogue_batch_receipts where batch_key='nonkgp-05'")=='0'
print('PASS grouped owner rollout: 5 exact rows, unchanged parents/grants, repeat, cross-batch atomic conflict and late-error rollback')
