"""Generate guarded data import/rollback. No database connection."""
import argparse,json
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');parser.add_argument('--batch',choices=['01','02','03','04'],default='01');args=parser.parse_args()
ROOT=Path(__file__).resolve().parents[1];DIR=ROOT/f'docs/catalogue/batch-{args.batch}'
peaks_by_batch={'01':{'waligora':10,'sleza':27,'lysica':28,'skopiec':14,'chelmiec':12},'02':{'sniezka':1,'snieznik':2,'wielka-sowa':6,'szczeliniec-wielki':11,'skalnik':8},'03':{'rudawiec':4,'orlica':5,'jagodna':7,'kowadlo':9,'klodzka-gora':13,'biskupia-kopa':15,'babia-gora':17,'tarnica':18,'turbacz':19,'radziejowa':20,'lubomir':21,'mogielica':22,'czupel':24,'skrzyczne':25,'wysoka-pieniny':26},'04':{'rysy':16,'lackowa':23,'wysoka-kopa':3}}
peak_case="case body->>'peak_slug' "+' '.join(f"when '{slug}' then {id}" for slug,id in peaks_by_batch[args.batch].items())+' end'
records=json.loads((DIR/'records.json').read_text())
expected=len(peaks_by_batch[args.batch])
if len(records)!=2*expected or {r['kind'] for r in records}!={'trail','poi'}: raise SystemExit(f'Expected {expected} trails and {expected} POIs')
for kind in ['trail','poi']:
 if sorted(r['body']['peak_slug'] for r in records if r['kind']==kind)!=sorted(peaks_by_batch[args.batch]): raise SystemExit('Unexpected peak set')
for row in records:
 assert set(row['body']['i18n'])=={'pl','en','ua','zh'}
 assert all(t['name'].strip() for t in row['body']['i18n'].values())
 assert row['body']['source_url'].startswith('https://')
fields={
 'trail':['peak_id','slug','start_point_name','end_point_name','distance_km','elevation_gain_m','time_min','difficulty','route_type','active','source_url','last_verified_at','map_url','gpx_url','distance_source_url','distance_verified_at','elevation_gain_source_url','elevation_gain_verified_at','time_source_url','time_verified_at','route_geometry','geometry_source_url','geometry_verified_at'],
 'poi':['peak_id','trail_id','type_id','latitude','longitude','active','source_url','last_verified_at','website_url','google_maps_url']}
header='''-- Apply migration 014 first. Reviewed sources: README.md.
-- Atomic import; refuses existing conflicting records. Run as project owner.
begin;
set local lock_timeout='5s';
create schema if not exists peakguide_private;
create table if not exists peakguide_private.catalogue_batch_receipts(batch_key text primary key,snapshot jsonb not null,created_at timestamptz not null default now());
alter table peakguide_private.catalogue_batch_receipts enable row level security;
revoke all on peakguide_private.catalogue_batch_receipts from public,anon,authenticated;
do $batch$
declare entry jsonb; body jsonb; peak bigint; saved_id bigint; snapshot jsonb='[]'; receipt jsonb; actual jsonb;
 trail public.trails%rowtype; poi public.pois%rowtype; lang text; tr jsonb;
begin
 if to_regprocedure('public.admin_save_trail(bigint,jsonb,timestamptz)') is null then raise exception 'Apply migration 014 first'; end if;
 perform pg_advisory_xact_lock(251115,1);
 select r.snapshot into receipt from peakguide_private.catalogue_batch_receipts r where batch_key='kgp-01';
'''
verify='''
 for entry in select value from jsonb_array_elements(receipt) loop
  if entry->>'kind'='trail' then
   select jsonb_build_object('row',to_jsonb(t),'i18n',coalesce((select jsonb_agg(to_jsonb(i) order by lang) from public.trails_i18n i where trail_id=t.id),'[]')) into actual from public.trails t where id=(entry->>'id')::bigint for update of t;
  else
   select jsonb_build_object('row',to_jsonb(p),'i18n',coalesce((select jsonb_agg(to_jsonb(i) order by lang) from public.pois_i18n i where poi_id=p.id),'[]')) into actual from public.pois p where id=(entry->>'id')::bigint for update of p;
  end if;
  if actual is distinct from entry->'snapshot' then raise exception 'Imported record changed: % %',entry->>'kind',entry->>'id'; end if;
 end loop;
'''
# Avoid PL/pgSQL lang variable ambiguity in ORDER BY.
verify=verify.replace('order by lang','order by i.lang')
apply=header+' if receipt is not null then\n'+verify+" raise notice 'Batch already applied; records unchanged'; return; end if;\n"
apply+=" for entry in select value from jsonb_array_elements($records$"+json.dumps(records,ensure_ascii=False)+"$records$::jsonb) loop\n body=entry->'body';\n"
apply+=f''' select id into peak from public.peaks where slug=body->>'peak_slug' and id=({peak_case}) and active=true for update;
 if peak is null then raise exception 'Peak missing or changed: %',body->>'peak_slug'; end if;
 body=body||jsonb_build_object('peak_id',peak);
 if entry->>'kind'='trail' then
  if exists(select from public.trails where slug=body->>'slug') then raise exception 'Trail slug already exists: %',body->>'slug'; end if;
  trail=jsonb_populate_record(null::public.trails,body);
'''
for kind in ['trail','poi']:
 if kind=='poi':
  apply+=''' else
  if exists(select from public.pois where peak_id=peak and source_url=body->>'source_url') then raise exception 'POI source already exists'; end if;
  select id into saved_id from public.poi_types where slug=body->>'type_slug';
  if saved_id is null then raise exception 'Missing POI type'; end if;
  body=body||jsonb_build_object('type_id',saved_id);
  poi=jsonb_populate_record(null::public.pois,body);
'''
 table='trails' if kind=='trail' else 'pois';trfields=['name','description','notes' if kind=='trail' else 'tips']
 apply+=f" insert into public.{table} ({', '.join(fields[kind])}) values ({', '.join(kind+'.'+f for f in fields[kind])}) returning id into saved_id;\n"
 apply+=f" for lang,tr in select key,value from jsonb_each(body->'i18n') loop\n insert into public.{table}_i18n ({kind}_id,lang,{', '.join(trfields)}) values (saved_id,lang,{', '.join('tr->>\''+f+'\'' for f in trfields)}); end loop;\n"
 apply+=f" select jsonb_build_object('row',to_jsonb(r),'i18n',(select jsonb_agg(to_jsonb(i) order by i.lang) from public.{table}_i18n i where {kind}_id=r.id)) into actual from public.{table} r where id=saved_id;\n"
 apply+=" snapshot=snapshot||jsonb_build_array(jsonb_build_object('kind',entry->>'kind','id',saved_id,'snapshot',actual));\n"
apply+=''' end if;
 end loop;
 insert into peakguide_private.catalogue_batch_receipts(batch_key,snapshot)values('kgp-01',snapshot);
 raise notice 'Added 5 trails and 5 POIs, each in four languages';
end $batch$;
commit;
'''
rollback=header+" if receipt is null then raise notice 'Batch not applied'; return; end if;\n"+verify+'''
 for entry in select value from jsonb_array_elements(receipt) loop
  if entry->>'kind'='poi' then delete from public.pois_i18n where poi_id=(entry->>'id')::bigint; delete from public.pois where id=(entry->>'id')::bigint; end if;
 end loop;
 for entry in select value from jsonb_array_elements(receipt) loop
  if entry->>'kind'='trail' then delete from public.trails_i18n where trail_id=(entry->>'id')::bigint; delete from public.trails where id=(entry->>'id')::bigint; end if;
 end loop;
 delete from peakguide_private.catalogue_batch_receipts where batch_key='kgp-01';
end $batch$;
commit;
'''
for name,text in [('apply.sql',apply),('rollback.sql',rollback)]:
 text=text.replace("'kgp-01'",f"'kgp-{args.batch}'").replace('perform pg_advisory_xact_lock(251115,1);',f'perform pg_advisory_xact_lock(251115,{int(args.batch)});')
 if args.batch in ['03','04']: text=text.replace('Added 5 trails and 5 POIs',f'Added {expected} trails and {expected} POIs')
 path=DIR/name
 if args.check:
  if not path.exists() or path.read_text()!=text: raise SystemExit(f'Regenerate {path.relative_to(ROOT)}')
 else: path.write_text(text)
print('Checked' if args.check else 'Generated',len(records),'records')
