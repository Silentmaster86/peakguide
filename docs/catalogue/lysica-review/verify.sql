-- Read-only. Run as project owner in SQL Editor; no private user data.
select jsonb_build_object(
 'peaks',(select jsonb_agg(to_jsonb(x) order by id) from (
  select p.id,p.slug,p.range_id,p.active,p.is_korona,p.elevation_m,p.latitude,p.longitude,
   (select count(*) from public.trails t where t.peak_id=p.id) as trails,
   (select count(*) from public.pois o where o.peak_id=p.id) as pois,
   (select jsonb_agg(jsonb_build_object('lang',i.lang,'name',i.name) order by i.lang) from public.peaks_i18n i where i.peak_id=p.id) as names
  from public.peaks p where p.id in(28,83)
 ) x),
 'public_matches',(select jsonb_agg(jsonb_build_object('id',p.id,'slug',p.slug) order by p.id) from public.peaks p where p.active and p.id in(28,83))
) as lysica_review_verification;
