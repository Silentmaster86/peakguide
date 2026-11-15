"""Guarded batch-02 integration on a dedicated DB, not production."""
import argparse,json,math,subprocess,xml.etree.ElementTree as E
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('--docker');args=parser.parse_args()
root=Path(__file__).resolve().parents[2];folder=root/'docs/catalogue/batch-02'
command=(['docker','exec','-i',args.docker] if args.docker else [])+['psql','-X','-U','postgres','-d','catalogue_batch02_test','-At','-v','ON_ERROR_STOP=1']
def sql(text,fail=None):
 r=subprocess.run(command,input=text,text=True,capture_output=True)
 if fail:assert r.returncode and fail in r.stderr,r.stderr
 else:assert not r.returncode,r.stderr
 return r.stdout.strip()
records=json.loads((folder/'records.json').read_text())
for record in records:
 b=record['body'];assert set(b['i18n'])=={'pl','en','ua','zh'}
 if record['kind']=='trail':
  geometry=b['route_geometry'];lines=[geometry['coordinates']] if geometry['type']=='LineString' else geometry['coordinates']
  assert all(len(line)>=2 for line in lines)
  assert all(len(p)==2 and -180<=p[0]<=180 and -90<=p[1]<=90 for line in lines for p in line)
  xml=E.parse(folder/'routes'/f"{b['slug']}.gpx");ns={'g':'http://www.topografix.com/GPX/1/1'}
  assert [e.tag.split('}')[-1] for e in xml.find('g:metadata',ns)]==['name','desc','link'],'GPX metadata order must match GPX 1.1'
  xml_lines=[[[float(p.attrib['lon']),float(p.attrib['lat'])] for p in s.findall('g:trkpt',ns)] for s in xml.findall('g:trk/g:trkseg',ns)]
  assert lines==xml_lines,'Download and map disagree'
  assert b['geometry_source_url'] and b['geometry_verified_at']
# Independent endpoint checks against the reviewed PTTK place coordinates.
endpoints={
 'sniezka-bialy-jar-czarny-wejscie':([15.73866598,50.773586],[15.739546,50.735998]),
 'snieznik-schronisko-zielony-szczyt':([16.83248699,50.207941643333],[16.847099,50.207895]),
 'skalnik-czarnow-czartak-niebieski':([15.910256,50.801265],[15.900134,50.808689]),
}
for record in records:
 b=record['body']
 if b.get('slug') not in endpoints:continue
 g=b['route_geometry'];lines=[g['coordinates']] if g['type']=='LineString' else g['coordinates']
 for actual,expected in zip([lines[0][0],lines[-1][-1]],endpoints[b['slug']]):
  assert math.hypot((actual[0]-expected[0])*71000,(actual[1]-expected[1])*111000)<100,'Wrong endpoint/direction'
# This resets only the explicitly named test DB.
sql('drop schema if exists peakguide_private cascade; drop schema public cascade; create schema public;')
sql((root/'supabase/tests/catalogue_management_fixture.sql').read_text())
sql((root/'supabase/migrations/202611150014_catalogue_management.sql').read_text())
sql("update peaks set slug='sniezka' where id=1;update peaks set slug='snieznik' where id=2;insert into peaks(id,slug,active)values(6,'wielka-sowa',true),(8,'skalnik',true),(11,'szczeliniec-wielki',true);insert into poi_types(id,slug)values(2,'viewpoint'),(3,'trailhead');")
apply=(folder/'apply.sql').read_text();rollback=(folder/'rollback.sql').read_text()
# A conflicting existing slug rolls back every row and its receipt.
sql("insert into trails(peak_id,slug,active)values(11,'szczeliniec-letnia-trasa-edukacyjna',true);")
sql(apply,fail='Trail slug already exists')
assert sql('select count(*) from trails')=='1';assert sql('select count(*) from pois')=='0'
sql("delete from trails where slug='szczeliniec-letnia-trasa-edukacyjna';")
sql(apply);sql("insert into peakguide_private.catalogue_batch_receipts(batch_key,snapshot)values('kgp-01','[]');");sql(apply)
assert sql('select count(*) from trails')=='5';assert sql('select count(*) from pois')=='5'
assert sql('select count(*) from trails_i18n')=='20';assert sql('select count(*) from pois_i18n')=='20'
assert sql("select count(*) from trails where st_isvalid(st_geomfromgeojson(route_geometry::text))")=='5'
assert sql("select count(*) from trails where slug in ('snieznik-schronisko-zielony-szczyt','skalnik-czarnow-czartak-niebieski') and distance_km is null and elevation_gain_m is null and time_min is null")=='2'
assert sql("select elevation_gain_m||':'||time_min from trails where slug='sniezka-bialy-jar-czarny-wejscie'")=='1196:255'
sql(rollback);sql(rollback)
assert sql("select count(*) from peakguide_private.catalogue_batch_receipts where batch_key='kgp-01' and snapshot='[]'::jsonb")=='1'
assert sql('select count(*) from trails')=='0';assert sql('select count(*) from pois')=='0'
sql(apply);sql("update pois_i18n set tips='Later edit' where lang='pl';")
sql(rollback,fail='Imported record changed')
assert sql('select count(*) from trails')=='5';assert sql('select count(*) from pois')=='5'
sql(apply,fail='Imported record changed')
print('PASS batch02: matching map/download GPX; atomic conflict, insert, idempotency, rollback and later-edit protection; 5 valid geometries and 40 translations')

# Exercise both real batches together, matching the existing production rollout.
sql('drop schema peakguide_private cascade; drop schema public cascade; create schema public;')
sql((root/'supabase/tests/catalogue_management_fixture.sql').read_text())
sql((root/'supabase/migrations/202611150014_catalogue_management.sql').read_text())
sql("update peaks set slug='sniezka' where id=1;update peaks set slug='snieznik' where id=2;insert into peaks(id,slug,active)values(6,'wielka-sowa',true),(8,'skalnik',true),(11,'szczeliniec-wielki',true),(10,'waligora',true),(12,'chelmiec',true),(14,'skopiec',true),(27,'sleza',true),(28,'lysica',true);insert into poi_types(id,slug)values(2,'viewpoint'),(3,'trailhead'),(4,'shelter');")
first=(root/'docs/catalogue/batch-01/apply.sql').read_text()
sql(first);sql(apply)
assert sql('select count(*) from trails')=='10';assert sql('select count(*) from pois')=='10'
sql(rollback)
assert sql('select count(*) from trails')=='5';assert sql('select count(*) from pois')=='5'
sql(first)  # Full receipt equality proves batch 01 was unchanged.
sql(apply)
print('PASS batch01 + batch02 coexist; rollback02 preserves every batch01 row, translation and revision')
