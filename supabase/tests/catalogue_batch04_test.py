"""Three remaining KGP entries on a disposable catalogue_batch04_test DB."""
import argparse,json,math,subprocess,xml.etree.ElementTree as E
from pathlib import Path
root=Path(__file__).resolve().parents[2];base=root/'docs/catalogue';folder=base/'batch-04'
parser=argparse.ArgumentParser();parser.add_argument('--docker');args=parser.parse_args()
cmd=(['docker','exec','-i',args.docker] if args.docker else [])+['psql','-X','-U','postgres','-d','catalogue_batch04_test','-At','-v','ON_ERROR_STOP=1']
def sql(text,error=None):
 r=subprocess.run(cmd,input=text,text=True,capture_output=True)
 if error:assert r.returncode and error in r.stderr,r.stderr
 else:assert not r.returncode,r.stderr
 return r.stdout.strip()
records=json.loads((folder/'records.json').read_text());trails={r['body']['peak_slug']:r['body'] for r in records if r['kind']=='trail'}
assert len(records)==6 and set(trails)=={'rysy','lackowa','wysoka-kopa'}
anchors={'rysy':([20.103021,49.254662],[20.088035,49.179593]),'lackowa':([21.065979,49.439927],[21.102584,49.426363]),'wysoka-kopa':([15.434953,50.846527],[15.405716,50.857504])}
for row in records:
 b=row['body'];assert set(b['i18n'])=={'pl','en','ua','zh'}
 assert all(t['name'].strip() and t['description'].strip() for t in b['i18n'].values())
 if row['kind']!='trail':continue
 lines=b['route_geometry']['coordinates'];ns={'g':'http://www.topografix.com/GPX/1/1'};xml=E.parse(folder/'routes'/f"{b['slug']}.gpx")
 assert [e.tag.split('}')[-1] for e in xml.find('g:metadata',ns)]==['name','desc','link']
 assert lines==[[[float(p.attrib['lon']),float(p.attrib['lat'])] for p in seg.findall('g:trkpt',ns)] for seg in xml.findall('g:trk/g:trkseg',ns)]
 for actual,expected in zip([lines[0][0],lines[-1][-1]],anchors[b['peak_slug']]):assert math.hypot((actual[0]-expected[0])*72000,(actual[1]-expected[1])*111000)<100
 assert all(len(p)==2 and 14<p[0]<25 and 48<p[1]<52 for l in lines for p in l)
 assert all(a[-1]==b[0] for a,b in zip(lines,lines[1:])),'No invented connector or missing segment'
# No summit spur: this is a cropped portion of the red trail, not a route to the protected summit.
kopa=trails['wysoka-kopa'];assert len(kopa['route_geometry']['coordinates'])==1
assert all(math.hypot((p[0]-15.42)*72000,(p[1]-50.850278)*111000)>350 for p in kopa['route_geometry']['coordinates'][0])
assert all(kopa[f] is None for f in ['distance_km','elevation_gain_m','time_min'])
assert (trails['rysy']['elevation_gain_m'],trails['rysy']['time_min'])==(1837,405)
assert (trails['lackowa']['elevation_gain_m'],trails['lackowa']['time_min'])==(410,115)

def reset():
 sql('drop schema if exists peakguide_private cascade;drop schema public cascade;create schema public;')
 sql((root/'supabase/tests/catalogue_management_fixture.sql').read_text());sql((root/'supabase/migrations/202611150014_catalogue_management.sql').read_text())
 peaks={r['body']['peak_slug']:None for batch in ['01','02','03','04'] for r in json.loads((base/f'batch-{batch}/records.json').read_text())}
 # Existing production identities, including all 28 KGP peaks.
 ids={'sniezka':1,'snieznik':2,'wysoka-kopa':3,'rudawiec':4,'orlica':5,'wielka-sowa':6,'jagodna':7,'skalnik':8,'kowadlo':9,'waligora':10,'szczeliniec-wielki':11,'chelmiec':12,'klodzka-gora':13,'skopiec':14,'biskupia-kopa':15,'rysy':16,'babia-gora':17,'tarnica':18,'turbacz':19,'radziejowa':20,'lubomir':21,'mogielica':22,'lackowa':23,'czupel':24,'skrzyczne':25,'wysoka-pieniny':26,'sleza':27,'lysica':28};assert set(peaks)==set(ids)
 sql('delete from peaks;alter table peaks add column is_korona boolean default true;insert into peaks(id,slug,active)values'+','.join(f"({id},'{slug}',true)" for slug,id in ids.items())+";insert into poi_types(id,slug)values(2,'viewpoint'),(3,'trailhead'),(4,'shelter'),(5,'attraction');")
apply=(folder/'apply.sql').read_text();rollback=(folder/'rollback.sql').read_text()
reset();sql("insert into trails(peak_id,slug)values(3,'wysoka-kopa-sine-skalki-czerwony-odcinek');")
sql(apply,'Trail slug already exists');assert sql('select count(*) from trails')=='1';assert sql('select count(*) from pois')=='0'
sql("delete from trails where peak_id=3;");sql(apply);sql(apply)
assert sql('select count(*) from trails')=='3';assert sql('select count(*) from pois')=='3'
assert sql('select count(*) from trails_i18n')=='12';assert sql('select count(*) from pois_i18n')=='12'
assert sql('select count(*) from trails where st_isvalid(st_geomfromgeojson(route_geometry::text))')=='3'
v=json.loads(sql((folder/'verify.sql').read_text()));assert len(v['batch_trails'])==len(v['batch_pois'])==3;assert all(t['languages']==['en','pl','ua','zh'] for t in v['batch_trails']+v['batch_pois'])
sql(rollback);sql(rollback);assert sql('select count(*) from trails')=='0'
sql(apply);sql("update pois_i18n set tips='New editor text' where lang='pl';");sql(rollback,'Imported record changed');sql(apply,'Imported record changed');assert sql('select count(*) from trails')=='3'
# All real batches together; removing 04 must leave each prior receipt fully unchanged.
reset()
for batch in ['01','02','03','04']:sql((base/f'batch-{batch}/apply.sql').read_text())
v=json.loads(sql((folder/'verify.sql').read_text()));assert v['kgp_coverage']=={'active_peaks':28,'with_trails':28,'with_pois':28,'with_mapped_trails':24},v
sql(rollback)
for batch in ['01','02','03']:sql((base/f'batch-{batch}/apply.sql').read_text())
assert sql('select count(*) from trails')=='25';assert sql('select count(*) from pois')=='25'
print('PASS batch04: 3 GPX/map matches, source anchors, direction metrics, 24 translations, no closed-summit spur, atomic conflict/repeat/rollback/edit guards; all batches cover 28 KGP peaks, 24 mapped; prior batches unchanged')
