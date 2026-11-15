-- Read-only. Run before importing and after importing. No secret values.
select jsonb_build_object(
 'peaks',(select jsonb_agg(to_jsonb(x)) from (
  select p.id,p.slug,p.active,count(distinct t.id) as trails,
   count(distinct t.id) filter(where t.route_geometry is not null) as mapped_trails,
   count(distinct o.id) as pois
  from public.peaks p left join public.trails t on t.peak_id=p.id left join public.pois o on o.peak_id=p.id
  where p.slug in ('rudawiec','orlica','jagodna','kowadlo','klodzka-gora','biskupia-kopa','babia-gora','tarnica','turbacz','radziejowa','lubomir','mogielica','czupel','skrzyczne','wysoka-pieniny') group by p.id,p.slug,p.active order by p.id
 ) x),
 'package_trails',(select jsonb_agg(to_jsonb(x)) from (
  select t.slug,t.active,t.distance_km,t.elevation_gain_m,t.time_min,
   t.route_geometry is not null as has_geometry,t.gpx_url,
   array_agg(i.lang order by i.lang) as languages
  from public.trails t join public.trails_i18n i on i.trail_id=t.id
  where t.slug in ('rudawiec-katalog-03','orlica-katalog-03','jagodna-katalog-03','kowadlo-katalog-03','klodzka-gora-katalog-03','biskupia-kopa-katalog-03','babia-gora-katalog-03','tarnica-katalog-03','turbacz-katalog-03','radziejowa-katalog-03','lubomir-katalog-03','mogielica-katalog-03','czupel-katalog-03','skrzyczne-katalog-03','wysoka-pieniny-katalog-03') group by t.id order by t.slug
 ) x),
 'package_pois',(select jsonb_agg(to_jsonb(x)) from (
  select o.peak_id,o.source_url,o.active,array_agg(i.lang order by i.lang) as languages
  from public.pois o join public.pois_i18n i on i.poi_id=o.id
  join public.peaks p on p.id=o.peak_id
  where p.slug in ('rudawiec','orlica','jagodna','kowadlo','klodzka-gora','biskupia-kopa','babia-gora','tarnica','turbacz','radziejowa','lubomir','mogielica','czupel','skrzyczne','wysoka-pieniny') and o.source_url in ('https://dolnoslaskie.szlaki.pttk.pl/1931-dolnoslaskie-przelecz-ploszczyna','https://dolnoslaskie.szlaki.pttk.pl/2219-dolnoslaskie-orlica-wieza-widokowa','https://dolnoslaskie.szlaki.pttk.pl/2110-dolnoslaskie-jagodna-wieza-widokowa','https://dolnoslaskie.szlaki.pttk.pl/1928-dolnoslaskie-kowadlo','https://dolnoslaskie.szlaki.pttk.pl/2080-dolnoslaskie-klodzka-gora-wieza-widokowa','https://slaskie-opolskie.szlaki.pttk.pl/794-slaskie-opolskie-schronisko-pod-kopa-biskupia','https://malopolska.szlaki.pttk.pl/1580-pttk-malopolska-babia-gora-diablak','https://bdpn.gov.pl/szlaki-turystyczne/sciezka-przyrodniczo-historyczna-wolosate-tarnica','https://malopolska.szlaki.pttk.pl/1689-pttk-malopolska-schronisko-pttk-im-wladyslawa-orkana-na-turbaczu','https://malopolska.szlaki.pttk.pl/1680-pttk-malopolska-radziejowa','https://malopolska.szlaki.pttk.pl/2214-pttk-malopolska-obserwatorium-astronomiczne-im-tadedusza-banachiewicza-na-lubomirze','https://malopolska.szlaki.pttk.pl/1682-pttk-malopolska-mogielica','https://www.beskidy.slaskie.travel/route/1019739','https://slaskie.travel/route/1020144','https://malopolska.szlaki.pttk.pl/1000-pttk-malopolska-wawoz-homole')
  group by o.id order by o.peak_id
 ) x)
) as catalogue_batch03_verification;
