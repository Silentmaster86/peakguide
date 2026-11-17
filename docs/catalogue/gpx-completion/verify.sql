-- Read-only. Run as project owner before and after this upgrade.
select jsonb_build_object(
 'trails',(select jsonb_agg(to_jsonb(x) order by slug) from (
  select t.id,t.peak_id,t.slug,t.distance_km,t.elevation_gain_m,t.time_min,t.updated_at,
   t.route_geometry is not null as has_geometry,t.gpx_url,t.geometry_source_url,
   (select array_agg(i.lang order by lang) from public.trails_i18n i where i.trail_id=t.id) as languages
  from public.trails t where t.slug in('waligora-andrzejowka-zolty','sleza-tapadla-dom-turysty','skopiec-rozdroze-komarnicka','chelmiec-boguszow-rosochatka')
 ) x),
 'batch01_receipt_exists',exists(select from peakguide_private.catalogue_batch_receipts where batch_key='kgp-01'),
 'gpx_upgrade_applied',exists(select from peakguide_private.catalogue_batch_receipts where batch_key='kgp-01-gpx')
) as catalogue_gpx_completion_verification;
