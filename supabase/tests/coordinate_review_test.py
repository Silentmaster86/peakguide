"""Coordinates-only patch; resets dedicated coordinate_review_test DB only."""
import argparse,json,subprocess,math
from pathlib import Path
root=Path(__file__).resolve().parents[2];folder=root/'docs/catalogue/coordinate-review'
parser=argparse.ArgumentParser();parser.add_argument('--docker');args=parser.parse_args()
cmd=(['docker','exec','-i',args.docker] if args.docker else [])+['psql','-X','-U','postgres','-d','coordinate_review_test','-At','-v','ON_ERROR_STOP=1']
def sql(text,error=None):
 r=subprocess.run(cmd,input=text,text=True,capture_output=True)
 if error:assert r.returncode and error in r.stderr,r.stderr
 else:assert not r.returncode,r.stderr
 return r.stdout.strip()
changes=json.loads((folder/'changes.json').read_text());apply=(folder/'apply.sql').read_text();rollback=(folder/'rollback.sql').read_text()
def reset():
 sql('''drop schema public cascade;create schema public;create extension postgis;
 create table peaks(id bigint primary key,slug text,range_id bigint,is_korona boolean,active boolean,latitude numeric(9,6),longitude numeric(9,6),geom geography(Point,4326),elevation_m integer);
 create table peaks_i18n(peak_id bigint references peaks,lang text,name text);
 create table trails(id bigint primary key,peak_id bigint references peaks);
 create table pois(id bigint primary key,peak_id bigint references peaks);
 ''')
 rows=[{**r['before'],'elevation_m':1000+r['before']['id']} for r in changes]
 sql('insert into peaks select * from jsonb_populate_recordset(null::peaks,$seed$'+json.dumps(rows)+'$seed$::jsonb);')
 sql("insert into peaks_i18n select id,lang,slug||':'||lang from peaks cross join unnest(array['pl','en','ua','zh']) lang;insert into trails select id,id from peaks;insert into pois select id,id from peaks;")
def snap():return json.loads(sql("select jsonb_build_object('peaks',(select jsonb_agg(to_jsonb(p) order by id) from peaks p),'i18n',(select jsonb_agg(to_jsonb(i) order by peak_id,lang) from peaks_i18n i),'trails',(select jsonb_agg(to_jsonb(t) order by id) from trails t),'pois',(select jsonb_agg(to_jsonb(p) order by id) from pois p));"))
reset();before=snap();sql(rollback);assert snap()==before
sql(apply);after=snap();expected=json.loads(json.dumps(before))
for p in expected['peaks']:p.update(next(r['after'] for r in changes if r['after']['id']==p['id']))
assert after==expected,'Only coordinates and geom may change'
assert sql('select count(*) from peaks where st_x(geom::geometry)=longitude::float8 and st_y(geom::geometry)=latitude::float8')=='3'
sql(apply);assert snap()==after;sql(rollback);sql(rollback);assert snap()==before
# Cross-check new pins against endpoints in the independently reviewed GPX batches.
for slug,batch in [('snieznik','02'),('rudawiec','03'),('lackowa','04')]:
 b=next(r['body'] for r in json.loads((root/f'docs/catalogue/batch-{batch}/records.json').read_text()) if r['kind']=='trail' and r['body']['peak_slug']==slug);g=b['route_geometry'];endpoint=(g['coordinates'][-1] if g['type']=='LineString' else g['coordinates'][-1][-1]);p=next(r['after'] for r in changes if r['after']['slug']==slug)
 assert math.hypot((endpoint[0]-p['longitude'])*71000,(endpoint[1]-p['latitude'])*111000)<100
reset();sql('update peaks set longitude=21.11 where id=23;');stale=snap();sql(apply,'Reviewed coordinates or identity changed');assert snap()==stale
reset();sql(apply);sql('update peaks set latitude=50.20 where id=4;');stale=snap();sql(rollback,'Reviewed coordinates or identity changed');assert snap()==stale
reset();sql(apply);sql("update peaks_i18n set name='New editorial name' where peak_id=2 and lang='en';");sql(rollback);assert sql("select name from peaks_i18n where peak_id=2 and lang='en'")=='New editorial name'
print('PASS three coordinates/geom, unchanged heights/12 translations/relations, independent GPX anchors, repeat/rollback, atomic stale-row rejection and preservation of later text edits')
