"""Generate a geometry-only upgrade of the four existing batch01 routes."""
import argparse,json
from pathlib import Path
root=Path(__file__).resolve().parents[1];folder=root/'docs/catalogue/gpx-completion'
rows=json.loads((folder/'changes.json').read_text());assert len(rows)==4
assert {r['peak_slug'] for r in rows}=={'waligora','sleza','skopiec','chelmiec'}
keys=['route_geometry','gpx_url','geometry_source_url','geometry_verified_at']
for r in rows:assert set(r['after'])==set(keys)
header='''-- Geometry-only upgrade; read README.md and take a fresh backup first.
begin;
set local lock_timeout='5s';
do $upgrade$
declare receipt jsonb; original_receipt jsonb; result jsonb='[]'; entry jsonb; old_entry jsonb; actual jsonb; patch jsonb; old_fields jsonb; saved_id bigint;
begin
 perform pg_advisory_xact_lock(251115,1);
 if to_regclass('peakguide_private.catalogue_batch_receipts') is null then raise exception 'Batch01 receipt missing; review required'; end if;
 select snapshot into original_receipt from peakguide_private.catalogue_batch_receipts where batch_key='kgp-01' for update;
 if original_receipt is null then raise exception 'Batch01 receipt missing; review required'; end if;
 select snapshot into receipt from peakguide_private.catalogue_batch_receipts where batch_key='kgp-01-gpx' for update;
'''
read_actual='''
 select jsonb_build_object('row',to_jsonb(t),'i18n',coalesce((select jsonb_agg(to_jsonb(i) order by i.lang) from public.trails_i18n i where i.trail_id=t.id),'[]')) into actual from public.trails t where t.id=saved_id for update of t;
'''
verify=read_actual+''' if actual is distinct from entry->'snapshot' then raise exception 'Upgraded trail changed: %',saved_id; end if;
 select e into old_entry from jsonb_array_elements(original_receipt) e where e->>'kind'='trail' and (e->>'id')::bigint=saved_id;
 if old_entry->'snapshot' is distinct from actual then raise exception 'Batch01 trail receipt changed: %',saved_id; end if;
'''
sync='''
 select jsonb_agg(case when e->>'kind'='trail' and (e->>'id')::bigint=saved_id then jsonb_set(e,'{snapshot}',actual) else e end order by n) into original_receipt from jsonb_array_elements(original_receipt) with ordinality a(e,n);
'''
apply=header+''' if receipt is not null then
 for entry in select value from jsonb_array_elements(receipt) loop
 saved_id=(entry->>'id')::bigint;
'''+verify+''' end loop; raise notice 'GPX completion already applied; unchanged'; return; end if;
 for patch in select value from jsonb_array_elements($changes$'''+json.dumps(rows,ensure_ascii=False)+'''$changes$::jsonb) loop
 select t.id into saved_id from public.trails t join public.peaks p on p.id=t.peak_id where t.slug=patch->>'slug' and p.slug=patch->>'peak_slug' and p.id=(patch->>'peak_id')::bigint and p.active and t.active for update of t;
 if saved_id is null then raise exception 'Reviewed trail missing or inactive: %',patch->>'slug'; end if;
'''+read_actual+'''
 select e into old_entry from jsonb_array_elements(original_receipt) e where e->>'kind'='trail' and (e->>'id')::bigint=saved_id;
 if old_entry is null or old_entry->'snapshot' is distinct from actual then raise exception 'Batch01 trail edited since import: %',saved_id; end if;
 if actual->'row'->'route_geometry' <> 'null'::jsonb or actual->'row'->'gpx_url' <> 'null'::jsonb or actual->'row'->'geometry_source_url' <> 'null'::jsonb or actual->'row'->'geometry_verified_at' <> 'null'::jsonb then raise exception 'Geometry already configured: %',saved_id; end if;
 old_fields=actual;
 update public.trails set route_geometry=patch->'after'->'route_geometry',gpx_url=patch->'after'->>'gpx_url',geometry_source_url=patch->'after'->>'geometry_source_url',geometry_verified_at=(patch->'after'->>'geometry_verified_at')::timestamptz where id=saved_id;
'''+read_actual+sync+'''
 result=result||jsonb_build_array(jsonb_build_object('kind','trail','id',saved_id,'before',old_fields,'snapshot',actual));
 end loop;
 update peakguide_private.catalogue_batch_receipts set snapshot=original_receipt where batch_key='kgp-01';
 insert into peakguide_private.catalogue_batch_receipts(batch_key,snapshot) values('kgp-01-gpx',result);
 raise notice 'Added GPX geometry to four existing trails; batch01 receipt updated';
end $upgrade$;
commit;
'''
rollback=header+''' if receipt is null then raise notice 'GPX completion not applied'; return; end if;
 -- Verify every trail before changing any of them.
 for entry in select value from jsonb_array_elements(receipt) loop
 saved_id=(entry->>'id')::bigint;
'''+verify+''' end loop;
 for entry in select value from jsonb_array_elements(receipt) loop
 saved_id=(entry->>'id')::bigint;
 update public.trails set route_geometry=nullif(entry->'before'->'row'->'route_geometry','null'::jsonb),gpx_url=entry->'before'->'row'->>'gpx_url',geometry_source_url=entry->'before'->'row'->>'geometry_source_url',geometry_verified_at=(entry->'before'->'row'->>'geometry_verified_at')::timestamptz where id=saved_id;
'''+read_actual+sync+''' end loop;
 -- Keep current revision/updated_at from the database trigger, not an old version.
 update peakguide_private.catalogue_batch_receipts set snapshot=original_receipt where batch_key='kgp-01';
 delete from peakguide_private.catalogue_batch_receipts where batch_key='kgp-01-gpx';
 raise notice 'Removed only this GPX upgrade; batch01 receipt refreshed';
end $upgrade$;
commit;
'''
parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
for name,text in [('apply.sql',apply),('rollback.sql',rollback)]:
 path=folder/name
 if args.check:
  if not path.exists() or path.read_text()!=text:raise SystemExit(f'Regenerate {path}')
 else:path.write_text(text)
print('Checked' if args.check else 'Generated','four-trail GPX upgrade')
