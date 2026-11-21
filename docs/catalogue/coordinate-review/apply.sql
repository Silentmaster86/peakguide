-- Reviewed coordinates only; read README.md and take a fresh backup.
begin;
set local lock_timeout='5s';
do $coordinates$
declare change jsonb; actual jsonb; comparable jsonb; changed integer=0;
begin
 perform pg_advisory_xact_lock(251117,100);
 for change in select value from jsonb_array_elements($changes$[{"before": {"id": 2, "slug": "snieznik", "range_id": 2, "is_korona": true, "active": true, "latitude": 50.206667, "longitude": 16.844167, "geom": "0101000020E6100000C85C19541BD83040CB147310741A4940"}, "after": {"id": 2, "slug": "snieznik", "range_id": 2, "is_korona": true, "active": true, "latitude": 50.207423, "longitude": 16.847394, "geom": "0101000020E61000009ED32CD0EED8304017B83CD68C1A4940"}}, {"before": {"id": 4, "slug": "rudawiec", "range_id": 4, "is_korona": true, "active": true, "latitude": 50.243056, "longitude": 16.979722, "geom": "0101000020E6100000F52B9D0FCFFA30405D8C81751C1F4940"}, "after": {"id": 4, "slug": "rudawiec", "range_id": 4, "is_korona": true, "active": true, "latitude": 50.24477, "longitude": 16.976879, "geom": "0101000020E61000003126FDBD14FA30405E85949F541F4940"}}, {"before": {"id": 23, "slug": "lackowa", "range_id": 23, "is_korona": true, "active": true, "latitude": 49.428333, "longitude": 21.096111, "geom": "0101000020E61000002EC901BB9A1835401766A19DD3B64840"}, "after": {"id": 23, "slug": "lackowa", "range_id": 23, "is_korona": true, "active": true, "latitude": 49.426496, "longitude": 21.102539, "geom": "0101000020E61000008690F3FE3F1A3540FAEFC16B97B64840"}}]$changes$::jsonb) loop
  select to_jsonb(p) into actual from public.peaks p where p.id=(change->'before'->>'id')::bigint for update;
  if actual is null then raise exception 'Reviewed peak missing: %',change->'before'->>'id'; end if;
  select jsonb_object_agg(k,actual->k) into comparable from jsonb_object_keys(change->'before') as keys(k);
  if comparable=change->'after' then continue; end if;
  if comparable is distinct from change->'before' then raise exception 'Reviewed coordinates or identity changed: %',change->'before'->>'slug'; end if;
  update public.peaks set latitude=(change->'after'->>'latitude')::numeric,longitude=(change->'after'->>'longitude')::numeric,
   geom=public.st_setsrid(public.st_makepoint((change->'after'->>'longitude')::double precision,(change->'after'->>'latitude')::double precision),4326)::public.geography
  where id=(change->'before'->>'id')::bigint;
  changed=changed+1;
 end loop;
 raise notice 'Peak coordinate records changed: %',changed;
end $coordinates$;
commit;
