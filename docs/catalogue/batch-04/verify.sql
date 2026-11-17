-- Read-only, one result. Counts include all active KGP peaks, not only batch 04.
select jsonb_build_object(
 'kgp_coverage',(select jsonb_build_object(
  'active_peaks',count(*),
  'with_trails',count(*) filter(where exists(select from public.trails t where t.peak_id=p.id and t.active)),
  'with_pois',count(*) filter(where exists(select from public.pois o where o.peak_id=p.id and o.active)),
  'with_mapped_trails',count(*) filter(where exists(select from public.trails t where t.peak_id=p.id and t.active and t.route_geometry is not null))
 ) from public.peaks p where p.active and p.is_korona),
 'peaks',(select jsonb_agg(to_jsonb(x) order by id) from (
  select p.id,p.slug,p.active,
   (select count(*) from public.trails t where t.peak_id=p.id and t.active) as trails,
   (select count(*) from public.trails t where t.peak_id=p.id and t.active and t.route_geometry is not null) as mapped_trails,
   (select count(*) from public.pois o where o.peak_id=p.id and o.active) as pois
  from public.peaks p where p.id in(3,16,23)
 ) x),
 'batch_trails',(select jsonb_agg(to_jsonb(x) order by slug) from (
  select t.slug,t.active,t.distance_km,t.elevation_gain_m,t.time_min,t.gpx_url,
   t.route_geometry is not null as has_geometry,
   (select array_agg(i.lang order by i.lang) from public.trails_i18n i where i.trail_id=t.id) as languages
  from public.trails t where t.slug in('rysy-palenica-czerwony-wejscie','lackowa-izby-zolty-wejscie','wysoka-kopa-sine-skalki-czerwony-odcinek')
 ) x),
 'batch_pois',(select jsonb_agg(to_jsonb(x) order by peak_id) from (
  select o.peak_id,o.active,o.source_url,
   (select array_agg(i.lang order by i.lang) from public.pois_i18n i where i.poi_id=o.id) as languages
  from public.pois o where (o.peak_id=16 and o.source_url='https://malopolska.szlaki.pttk.pl/2725-pttk-malopolska-schronisko-gorskie-pttk-nad-morskim-okiem')
   or(o.peak_id=23 and o.source_url='https://malopolska.szlaki.pttk.pl/2254-pttk-malopolska-lackowa')
   or(o.peak_id=3 and o.source_url='https://dolnoslaskie.szlaki.pttk.pl/2035-dolnoslaskie-wysoka-kopa-sine-skalki')
 ) x)
) as catalogue_batch04_verification;
