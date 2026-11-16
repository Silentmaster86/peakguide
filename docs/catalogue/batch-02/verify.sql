-- Read-only, single result. Run before and after batch-02 import.
select jsonb_build_object(
 'peaks',(select jsonb_agg(to_jsonb(x)) from (
  select p.id,p.slug,p.active,count(distinct t.id) as trails,
   count(distinct t.id) filter(where t.route_geometry is not null) as mapped_trails,
   count(distinct i.id) as pois
  from public.peaks p left join public.trails t on t.peak_id=p.id left join public.pois i on i.peak_id=p.id
  where p.slug in ('sniezka','snieznik','wielka-sowa','szczeliniec-wielki','skalnik') group by p.id,p.slug,p.active order by p.id
 ) x),
 'batch_trails',(select jsonb_agg(to_jsonb(x)) from (
  select t.slug,t.active,t.distance_km,t.elevation_gain_m,t.time_min,
   t.route_geometry is not null as has_geometry,
   array_agg(i.lang order by i.lang) as languages
  from public.trails t join public.trails_i18n i on i.trail_id=t.id
  where t.slug in ('sniezka-bialy-jar-czarny-wejscie','wielka-sowa-sokola-czarny-walimska','szczeliniec-letnia-trasa-edukacyjna','snieznik-schronisko-zielony-szczyt','skalnik-czarnow-czartak-niebieski') group by t.id order by t.slug
 ) x),
 'batch_pois',(select jsonb_agg(to_jsonb(x)) from (
  select p.peak_id,p.source_url,p.active,array_agg(i.lang order by i.lang) as languages
  from public.pois p join public.pois_i18n i on i.poi_id=p.id
  where p.peak_id in (1,2,6,11,8) and p.source_url in ('https://dolnoslaskie.szlaki.pttk.pl/1034-dolnoslaskie-sniezka','https://dolnoslaskie.szlaki.pttk.pl/1932-dolnoslaskie-snieznik-rezerwat-wieza-widokowa','https://dolnoslaskie.szlaki.pttk.pl/1998-dolnoslaskie-wielka-sowa-wieza-widokowa','https://dolnoslaskie.szlaki.pttk.pl/515-dolnoslaskie-przelecz-pod-szczelincem-szczeliniec-poczatek-schodow','https://dolnoslaskie.szlaki.pttk.pl/2056-dolnoslaskie-czarnow-dawne-schronisko-czartak')
  group by p.id order by p.peak_id
 ) x)
) as catalogue_batch02_verification;
