-- Read-only; no private data. Report actual stored position and geometry.
select jsonb_agg(jsonb_build_object('id',p.id,'slug',p.slug,'active',p.active,
 'latitude',p.latitude,'longitude',p.longitude,'elevation_m',p.elevation_m,
 'geometry_matches_coordinates',public.st_x(p.geom::public.geometry)=p.longitude::double precision and public.st_y(p.geom::public.geometry)=p.latitude::double precision,
 'trails',(select count(*) from public.trails t where t.peak_id=p.id),
 'pois',(select count(*) from public.pois o where o.peak_id=p.id)) order by p.id)
 as peak_coordinate_verification from public.peaks p where p.id in(2,4,23);
