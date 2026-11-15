"""20-peak rollout on a dedicated PostGIS DB, including the pre-applied-five case."""
import argparse,json,math,subprocess,xml.etree.ElementTree as E
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('--docker');args=parser.parse_args()
root=Path(__file__).resolve().parents[2];base=root/'docs/catalogue';folder=base/'twenty-peaks'
command=(['docker','exec','-i',args.docker] if args.docker else [])+['psql','-X','-U','postgres','-d','catalogue_twenty_test','-At','-v','ON_ERROR_STOP=1']
def sql(text,fail=None):
 r=subprocess.run(command,input=text,text=True,capture_output=True)
 if fail:assert r.returncode and fail in r.stderr,r.stderr
 else:assert not r.returncode,r.stderr
 return r.stdout.strip()
records=[]
for batch in ['02','03']:
 rows=json.loads((base/f'batch-{batch}/records.json').read_text());records+=rows
 for record in rows:
  b=record['body'];assert set(b['i18n'])=={'pl','en','ua','zh'}
  assert all(t['name'].strip() and t['description'].strip() for t in b['i18n'].values())
  if record['kind']!='trail':continue
  geometry=b['route_geometry'];lines=[geometry['coordinates']] if geometry['type']=='LineString' else geometry['coordinates']
  assert all(len(line)>=2 for line in lines)
  assert all(len(p)==2 and 14<=p[0]<=25 and 48<=p[1]<=52 for line in lines for p in line)
  xml=E.parse(base/f'batch-{batch}/routes'/f"{b['slug']}.gpx");ns={'g':'http://www.topografix.com/GPX/1/1'}
  assert [e.tag.split('}')[-1] for e in xml.find('g:metadata',ns)]==['name','desc','link']
  xml_lines=[[[float(p.attrib['lon']),float(p.attrib['lat'])] for p in s.findall('g:trkpt',ns)] for s in xml.findall('g:trk/g:trkseg',ns)]
  assert lines==xml_lines,'Map and download disagree'
  for metric in ['distance','elevation_gain','time']:
   field={'distance':'distance_km','elevation_gain':'elevation_gain_m','time':'time_min'}[metric]
   assert bool(b[metric+'_source_url'])==(b[field] is not None),'Missing metric provenance'
assert len(records)==40
# Independent named endpoint anchors: reviewed provider coordinates, not the audit file.
anchors={'rudawiec':([16.921919,50.225871],[16.976879,50.244770]),'kowadlo':([16.995029,50.263893],[17.013229,50.264444]),'lubomir':(None,[20.059763,49.766956]),'tarnica':([22.686245,49.062145],[22.726319,49.074529]),'babia-gora':([19.516661,49.587397],[19.529499,49.5731]),'turbacz':(None,[20.118545,49.544005]),'skrzyczne':([19.075643,49.666522],[19.075643,49.666522])}
for row in records:
 b=row['body']
 if row['kind']!='trail' or b['peak_slug'] not in anchors:continue
 lines=b['route_geometry']['coordinates']
 for actual,expected in zip([lines[0][0],lines[-1][-1]],anchors[b['peak_slug']]):
  if expected:assert math.hypot((actual[0]-expected[0])*71000,(actual[1]-expected[1])*111000)<100,(b['peak_slug'],actual,expected)
def reset():
 sql('drop schema if exists peakguide_private cascade; drop schema public cascade; create schema public;')
 sql((root/'supabase/tests/catalogue_management_fixture.sql').read_text());sql((root/'supabase/migrations/202611150014_catalogue_management.sql').read_text())
 peaks={'sniezka':1,'snieznik':2,'wielka-sowa':6,'skalnik':8,'szczeliniec-wielki':11,'rudawiec':4,'orlica':5,'jagodna':7,'kowadlo':9,'klodzka-gora':13,'biskupia-kopa':15,'babia-gora':17,'tarnica':18,'turbacz':19,'radziejowa':20,'lubomir':21,'mogielica':22,'czupel':24,'skrzyczne':25,'wysoka-pieniny':26,'waligora':10,'chelmiec':12,'skopiec':14,'sleza':27,'lysica':28}
 sql('delete from peaks;insert into peaks(id,slug,active)values'+','.join(f"({v},'{k}',true)" for k,v in peaks.items())+";insert into poi_types(id,slug)values(2,'viewpoint'),(3,'trailhead'),(4,'shelter'),(5,'attraction');")
apply=(folder/'apply.sql').read_text();rollback=(folder/'rollback.sql').read_text();first=(base/'batch-01/apply.sql').read_text();five=(base/'batch-02/apply.sql').read_text()
reset()
# A late conflict in component 03 must also undo component 02.
sql("insert into trails(peak_id,slug) values(26,'wysoka-pieniny-katalog-03');")
sql(apply,fail='Trail slug already exists');assert sql('select count(*) from trails')=='1';assert sql('select count(*) from pois')=='0';assert sql("select to_regclass('peakguide_private.catalogue_batch_receipts') is null")=='t'
sql("delete from trails where slug='wysoka-pieniny-katalog-03';")
sql(apply);sql(apply)
assert sql('select count(*) from trails')=='20';assert sql('select count(*) from pois')=='20'
assert sql('select count(*) from trails_i18n')=='80';assert sql('select count(*) from pois_i18n')=='80'
assert sql("select count(*) from trails where st_isvalid(st_geomfromgeojson(route_geometry::text))")=='20'
verification=json.loads(sql((folder/'verify.sql').read_text()));assert len(verification['peaks'])==len(verification['package_trails'])==len(verification['package_pois'])==20
assert all(x['languages']==['en','pl','ua','zh'] for x in verification['package_trails']+verification['package_pois'])
sql(rollback);sql(rollback);assert sql('select count(*) from trails')=='0'
# Existing first batch and already-imported five remain byte-for-byte unchanged.
sql(first);sql(five);sql(apply);sql(first);sql(five)
assert sql('select count(*) from trails')=='25';assert sql('select count(*) from pois')=='25'
sql((base/'batch-03/rollback.sql').read_text());sql(five);sql(first);assert sql('select count(*) from trails')=='10'
sql(apply);sql("update pois_i18n set tips='Later edit' where poi_id in(select id from pois where peak_id=4) and lang='pl';")
sql(rollback,fail='Imported record changed');sql(apply,fail='Imported record changed')
assert sql('select count(*) from trails')=='25';assert sql('select count(*) from pois')=='25'
print('PASS 20 peaks: map/GPX agreement, anchors, 160 translations, atomic late conflict, idempotency, fresh/pre-applied-five rollout, preserved batch01, protected later edits')

# Changed component 02 blocks the expansion before inserting any component 03 row.
reset();sql(five)
sql("update trails_i18n set notes='Owner edit' where lang='pl';")
sql(apply,fail='Imported record changed')
assert sql('select count(*) from trails')=='5';assert sql('select count(*) from pois')=='5'
assert sql("select count(*) from peakguide_private.catalogue_batch_receipts where batch_key='kgp-03'")=='0'
print('PASS changed pre-applied-five records block expansion without any partial additions')
