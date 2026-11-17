"""Geometry-only upgrade against dedicated catalogue_gpx_completion_test DB."""
import argparse,json,subprocess,math,xml.etree.ElementTree as E
from pathlib import Path
root=Path(__file__).resolve().parents[2];base=root/'docs/catalogue';folder=base/'gpx-completion'
parser=argparse.ArgumentParser();parser.add_argument('--docker');args=parser.parse_args()
cmd=(['docker','exec','-i',args.docker] if args.docker else [])+['psql','-X','-U','postgres','-d','catalogue_gpx_completion_test','-At','-v','ON_ERROR_STOP=1']
def sql(text,error=None):
 p=subprocess.run(cmd,input=text,text=True,capture_output=True)
 if error:assert p.returncode and error in p.stderr,p.stderr
 else:assert not p.returncode,p.stderr
 return p.stdout.strip()
changes=json.loads((folder/'changes.json').read_text())
anchors={'waligora-andrzejowka-zolty':([16.27823,50.68488],[16.278106,50.680983]),'sleza-tapadla-dom-turysty':([16.6986,50.8463],[16.7089,50.8654]),'skopiec-rozdroze-komarnicka':([15.877644,50.939311],[15.884667,50.943972]),'chelmiec-boguszow-rosochatka':([16.20415,50.76141],[16.21077,50.77936])}
for r in changes:
 ns={'g':'http://www.topografix.com/GPX/1/1'};x=E.parse(folder/'routes'/(r['slug']+'.gpx'));lines=r['after']['route_geometry']['coordinates']
 assert [e.tag.split('}')[-1] for e in x.find('g:metadata',ns)]==['name','desc','link']
 assert lines==[[[float(p.attrib['lon']),float(p.attrib['lat'])] for p in s.findall('g:trkpt',ns)] for s in x.findall('g:trk/g:trkseg',ns)]
 assert all(a[-1]==b[0] for a,b in zip(lines,lines[1:]))
 for actual,expected in zip([lines[0][0],lines[-1][-1]],anchors[r['slug']]):assert math.hypot((actual[0]-expected[0])*71000,(actual[1]-expected[1])*111000)<100
# Chełmiec's splice must use the real common Rosochatka coordinate.
c=next(r for r in changes if r['peak_slug']=='chelmiec')['after']['route_geometry']['coordinates'];assert c[0][-1]==c[1][0]==[16.21193482,50.77261188]
first=(base/'batch-01/apply.sql').read_text();first_rollback=(base/'batch-01/rollback.sql').read_text();apply=(folder/'apply.sql').read_text();rollback=(folder/'rollback.sql').read_text()
def reset():
 sql('drop schema if exists peakguide_private cascade;drop schema public cascade;create schema public;')
 sql((root/'supabase/tests/catalogue_management_fixture.sql').read_text());sql((root/'supabase/migrations/202611150014_catalogue_management.sql').read_text())
 sql("insert into peaks(id,slug,active)values(10,'waligora',true),(12,'chelmiec',true),(14,'skopiec',true),(27,'sleza',true),(28,'lysica',true);insert into poi_types(id,slug)values(2,'viewpoint'),(3,'trailhead'),(4,'shelter');")
 sql(first)
def snap():
 return json.loads(sql("select jsonb_build_object('trails',(select jsonb_agg(to_jsonb(t) order by id) from trails t),'i18n',(select jsonb_agg(to_jsonb(i) order by trail_id,lang) from trails_i18n i),'pois',(select jsonb_agg(to_jsonb(p) order by id) from pois p),'pois_i18n',(select jsonb_agg(to_jsonb(i) order by poi_id,lang) from pois_i18n i));"))
reset();before=snap();sql(rollback);assert snap()==before
sql(apply);after=snap();expected=json.loads(json.dumps(before))
for t in expected['trails']:
 change=next((r for r in changes if r['slug']==t['slug']),None)
 if change:
  t.update(change['after']);t['geometry_verified_at']=t['geometry_verified_at'].replace('Z','+00:00')
# Native revision/time values remain database-controlled; every other field must match.
def logical(v):
 for t in v['trails']:
  t.pop('revision',None);t.pop('updated_at',None)
 return v
assert logical(json.loads(json.dumps(after)))==logical(expected)
assert sql('select count(*) from trails where route_geometry is not null')=='5'
assert all(a['updated_at']>b['updated_at'] for a,b in zip(after['trails'],before['trails']) if a['slug'] in [r['slug'] for r in changes])
sql(apply);assert snap()==after;sql(first);assert snap()==after
sql(first_rollback,'Rollback GPX completion first');assert snap()==after
v=json.loads(sql((folder/'verify.sql').read_text()));assert v['gpx_upgrade_applied'] and all(t['has_geometry'] for t in v['trails'])
sql(rollback);restored=snap();assert logical(json.loads(json.dumps(restored)))==logical(json.loads(json.dumps(before)))
sql(rollback);assert snap()==restored;sql(first);assert snap()==restored
sql(apply);sql(first);sql(rollback);sql(first_rollback);assert sql('select count(*) from trails')=='0'
print('PASS 4 GPX matches/anchors, real Rosochatka join, geometry-only changes, 5 mapped routes, idempotence, revision-aware rollback, refreshed batch01 receipts and rollback dependency')
reset();sql("update trails_i18n set notes='Owner edit' where trail_id=(select id from trails where slug='chelmiec-boguszow-rosochatka') and lang='pl';");stale=snap();sql(apply,'Batch01 trail edited');assert snap()==stale
reset();sql(apply);sql("update trails_i18n set notes='Later edit' where trail_id=(select id from trails where slug='skopiec-rozdroze-komarnicka') and lang='en';");stale=snap();sql(rollback,'Upgraded trail changed');sql(apply,'Upgraded trail changed');assert snap()==stale
reset();sql("delete from peakguide_private.catalogue_batch_receipts where batch_key='kgp-01';");sql(apply,'Batch01 receipt missing')
print('PASS atomic stale-row rejection, later-edit protection and missing-receipt rejection')
