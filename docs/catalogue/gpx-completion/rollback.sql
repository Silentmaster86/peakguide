-- Geometry-only upgrade; read README.md and take a fresh backup first.
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
 if receipt is null then raise notice 'GPX completion not applied'; return; end if;
 -- Verify every trail before changing any of them.
 for entry in select value from jsonb_array_elements(receipt) loop
 saved_id=(entry->>'id')::bigint;

 select jsonb_build_object('row',to_jsonb(t),'i18n',coalesce((select jsonb_agg(to_jsonb(i) order by i.lang) from public.trails_i18n i where i.trail_id=t.id),'[]')) into actual from public.trails t where t.id=saved_id for update of t;
 if actual is distinct from entry->'snapshot' then raise exception 'Upgraded trail changed: %',saved_id; end if;
 select e into old_entry from jsonb_array_elements(original_receipt) e where e->>'kind'='trail' and (e->>'id')::bigint=saved_id;
 if old_entry->'snapshot' is distinct from actual then raise exception 'Batch01 trail receipt changed: %',saved_id; end if;
 end loop;
 for entry in select value from jsonb_array_elements(receipt) loop
 saved_id=(entry->>'id')::bigint;
 update public.trails set route_geometry=nullif(entry->'before'->'row'->'route_geometry','null'::jsonb),gpx_url=entry->'before'->'row'->>'gpx_url',geometry_source_url=entry->'before'->'row'->>'geometry_source_url',geometry_verified_at=(entry->'before'->'row'->>'geometry_verified_at')::timestamptz where id=saved_id;

 select jsonb_build_object('row',to_jsonb(t),'i18n',coalesce((select jsonb_agg(to_jsonb(i) order by i.lang) from public.trails_i18n i where i.trail_id=t.id),'[]')) into actual from public.trails t where t.id=saved_id for update of t;

 select jsonb_agg(case when e->>'kind'='trail' and (e->>'id')::bigint=saved_id then jsonb_set(e,'{snapshot}',actual) else e end order by n) into original_receipt from jsonb_array_elements(original_receipt) with ordinality a(e,n);
 end loop;
 -- Keep current revision/updated_at from the database trigger, not an old version.
 update peakguide_private.catalogue_batch_receipts set snapshot=original_receipt where batch_key='kgp-01';
 delete from peakguide_private.catalogue_batch_receipts where batch_key='kgp-01-gpx';
 raise notice 'Removed only this GPX upgrade; batch01 receipt refreshed';
end $upgrade$;
commit;
