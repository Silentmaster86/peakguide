"""Seasonal warning correction, in a dedicated local fixture database only."""
import argparse,json,subprocess
from pathlib import Path
R=Path(__file__).resolve().parents[2];F=R/'docs/catalogue/krivan-seasonal-01';p=argparse.ArgumentParser();p.add_argument('--docker');a=p.parse_args()
cmd=(['docker','exec','-i',a.docker] if a.docker else [])+['psql','-X','-U','postgres','-d','krivan_seasonal_01_test','-qAt','-v','ON_ERROR_STOP=1']
def sql(s,error=None):
 r=subprocess.run(cmd,input=s,text=True,capture_output=True)
 if error:assert r.returncode and error in r.stderr,r.stderr
 else:assert r.returncode==0,r.stderr
 return r.stdout.strip()
def lit(v):return '$seed$'+json.dumps(v,ensure_ascii=True)+'$seed$::jsonb'
c=json.loads((F/'change.json').read_text());apply=(F/'apply.sql').read_text(encoding='ascii');rollback=(F/'rollback.sql').read_text(encoding='ascii');target=c['before']['row']['id']
def reset():
 sql('do $$begin create role anon;exception when duplicate_object then null;end$$;do $$begin create role authenticated;exception when duplicate_object then null;end$$;drop schema if exists peakguide_private cascade;drop schema public cascade;create schema public;')
 sql((R/'supabase/tests/kgp_practical_fixture.sql').read_text())
 sql("insert into peaks(id,slug,active,is_korona)values(150,'krivan',true,false),(999,'other',true,false);insert into trails(id,peak_id,slug,active,route_geometry,gpx_url,distance_km)values(10,150,'krivan-tri-studnicky-loop',true,'{\"type\":\"LineString\",\"coordinates\":[[20,49],[20.1,49.1]]}','https://example.org/retain.gpx',15.4),(999,999,'other',true,null,null,null);")
 sql(f"insert into trail_access select (jsonb_populate_record(null::trail_access,{lit(c['before']['row'])})).*;")
 for t in c['before']['i18n']:sql(f"insert into trail_access_i18n select (jsonb_populate_record(null::trail_access_i18n,{lit(t)})).*;")
 sql(f"insert into trail_access(id,trail_id,address)values(999,999,'Retain other card');insert into trail_parking(id,trail_id,slug)values(999,10,'retain-parking');insert into trail_parking_i18n(parking_id,lang,name)values(999,'pl','Retain parking text');create table access_bookmarks(access_id bigint references trail_access on delete cascade,label text);insert into access_bookmarks values({target},'Retain bookmark');insert into peakguide_private.catalogue_batch_receipts(batch_key,snapshot)values('foreign-gpx-01','{{\"retain\":true}}'),('kgp-parking-02','{{\"retain\":true}}');")
def snap():
 return {t:json.loads(sql(f"select coalesce(jsonb_agg(v order by v::text),'[]') from(select to_jsonb(t) v from {t} t) q;")) for t in ['trails','trail_access','trail_access_i18n','trail_parking','trail_parking_i18n','access_bookmarks','peakguide_private.catalogue_batch_receipts']}
reset();before=snap();sql(rollback);assert snap()==before;sql(apply);after=snap()
for k in ['trails','trail_parking','trail_parking_i18n','access_bookmarks']:assert before[k]==after[k]
for r in before['peakguide_private.catalogue_batch_receipts']:assert r in after['peakguide_private.catalogue_batch_receipts']
for r in after['trail_access_i18n']:
 assert r['warnings']==c['after']['warnings'][r['lang']]
 previous=next(v for v in before['trail_access_i18n'] if v['lang']==r['lang']);assert {k:v for k,v in r.items() if k!='warnings'}=={k:v for k,v in previous.items() if k!='warnings'}
rows=[json.loads(l) for l in sql('select row_to_json(q) from('+(F/'verify.sql').read_text().strip().removesuffix(';')+')q;').splitlines()]
assert len(rows)==4 and all(r['warning_matches_review'] and r['patch_applied'] for r in rows)
sql("set timezone='Asia/Shanghai';"+apply);assert snap()==after
sql("set timezone='Europe/Warsaw';"+rollback);assert snap()==before;sql(apply)
sql(f"update trail_access_i18n set directions='Owner later edit' where access_id={target} and lang='zh';");changed=snap();sql(apply,'Seasonal card changed');sql(rollback,'Seasonal card changed');assert snap()==changed
reset();sql(f"update trail_access_i18n set warnings='Owner new text' where access_id={target} and lang='en';");changed=snap();sql(apply,'Reviewed access card changed');assert snap()==changed
reset();sql("create function mutate_card() returns trigger language plpgsql as $$begin new.address='Unexpected';return new;end$$;create trigger mutate_card before update on trail_access for each row execute function mutate_card();");before=snap();sql(apply,'Unexpected seasonal patch side effect');assert snap()==before
reset();sql("alter table trail_access_i18n add constraint force_late_failure check(lang<>'zh' or warnings not like '%2027%');");before=snap();sql(apply,'force_late_failure');assert snap()==before
for role in ['anon','authenticated']:sql(f'set role {role};'+apply,'Owner execution required')
print('PASS: four warning texts/source/date only; GPX/routes/directions/parking/bookmarks/prior receipts preserved; typed before/after guards; late failures atomic; idempotency, timezones, rollback and owner-edit protection')
