-- Read-only single result after migration 014 / optional batch-01 import.
begin read only;
select jsonb_build_object(
 'functions',(select jsonb_agg(to_jsonb(x)) from (
  select p.proname as function_name,p.prosecdef as security_definer,
   has_function_privilege('anon',p.oid,'execute') as anon_execute,
   has_function_privilege('authenticated',p.oid,'execute') as authenticated_execute
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname in ('admin_save_trail','admin_save_poi') order by p.proname
 ) x),
 'tables',(select jsonb_agg(to_jsonb(x)) from (
  select c.relname,c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relname in ('trails','trails_i18n','pois','pois_i18n') order by c.relname
 ) x),
 'peaks',(select jsonb_agg(to_jsonb(x)) from (
  select p.slug,count(distinct t.id) as trails,
   count(distinct t.id) filter(where t.route_geometry is not null) as mapped_trails,
   count(distinct i.id) as pois
  from public.peaks p left join public.trails t on t.peak_id=p.id
  left join public.pois i on i.peak_id=p.id
  where p.slug in ('waligora','sleza','lysica','skopiec','chelmiec') group by p.slug order by p.slug
 ) x),
 'batch_trail_translations',(select jsonb_agg(to_jsonb(x)) from (
  select t.slug,array_agg(i.lang order by i.lang) as languages
  from public.trails t join public.trails_i18n i on i.trail_id=t.id
  where t.slug in ('waligora-andrzejowka-zolty','sleza-tapadla-dom-turysty','lysica-czas-w-las-petla','skopiec-rozdroze-komarnicka','chelmiec-boguszow-rosochatka') group by t.slug order by t.slug
 ) x)
) as catalogue_verification;
commit;
