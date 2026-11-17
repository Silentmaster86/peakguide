-- Reviewed unverified record; read README.md and take a fresh backup first.
-- Only toggles peaks.active for id 83. No deletion or reassignment.
begin;
set local lock_timeout='5s';
do $review$
declare
 payload jsonb=$payload${"before": {"id": 83, "slug": "lysica-skarpowa", "range_id": 28, "subrange_id": null, "elevation_m": 612, "latitude": 50.9, "longitude": 20.9, "difficulty": null, "best_season": null, "cover_image_url": null, "is_korona": false, "active": false, "created_at": "2026-02-04T16:24:01.735432+00:00", "geom": "0101000020E61000006666666666E634403333333333734940", "cover_image_author": null, "cover_image_source_url": null, "cover_image_license": null, "cover_image_license_url": null}, "after": {"id": 83, "slug": "lysica-skarpowa", "range_id": 28, "subrange_id": null, "elevation_m": 612, "latitude": 50.9, "longitude": 20.9, "difficulty": null, "best_season": null, "cover_image_url": null, "is_korona": false, "active": true, "created_at": "2026-02-04T16:24:01.735432+00:00", "geom": "0101000020E61000006666666666E634403333333333734940", "cover_image_author": null, "cover_image_source_url": null, "cover_image_license": null, "cover_image_license_url": null}, "translations": [{"lang": "en", "name": "Łysica", "tips": null, "peak_id": 83, "description": "Łysica Skarpowa is a modest goal in the Świętokrzyskie Mountains area, great for a short, easy hike. The route is technically simple, through forest and gentle climbs. Choose a dry day and comfortable shoes, as sections can be stony or muddy.", "short_description": null}, {"lang": "pl", "name": "Łysica", "tips": null, "peak_id": 83, "description": "Łysica Skarpowa to niewysoki cel w rejonie Gór Świętokrzyskich, dobry na krótką, łatwą wędrówkę. Trasa jest technicznie prosta i prowadzi przez lasy oraz łagodne podejścia. Najlepiej wybrać suchy dzień i wygodne buty, bo miejscami ścieżka bywa kamienista lub błotnista.", "short_description": null}, {"lang": "ua", "name": "Łysica", "tips": null, "peak_id": 83, "description": "Лисиця Скарпова — невисока ціль у районі Свєнтокшиських гір, добра для короткого легкого походу. Маршрут технічно простий і проходить лісом та пологими підйомами. Оберіть сухий день і зручне взуття, бо місцями стежка кам’яниста або багниста.", "short_description": null}, {"lang": "zh", "name": "Łysica", "tips": null, "peak_id": 83, "description": "斯卡尔波瓦利西察（Łysica Skarpowa）位于圣十字山地区，是一个适合短途轻松徒步的低海拔目标。路线技术难度低，穿越森林并缓坡上行。建议选择干燥天气并穿舒适的鞋，部分路段可能碎石或泥泞。", "short_description": null}]}$payload$::jsonb;
 actual jsonb; comparable jsonb; texts jsonb;
begin
 perform pg_advisory_xact_lock(251117,83);
 -- Anchor both identities and prevent concurrent changes during this patch.
 perform 1 from public.mountain_ranges where id=28 and slug='gory-swietokrzyskie' for update;
 if not found then raise exception 'Range identity changed; review required'; end if;
 perform 1 from public.peaks where id=28 and slug='lysica' and range_id=28 and active=true and is_korona=true for update;
 if not found then raise exception 'Main Lysica identity changed; review required'; end if;
 select to_jsonb(p) into actual from public.peaks p where id=83 for update;
 if actual is null then raise exception 'Missing reviewed peak 83'; end if;
 select jsonb_object_agg(k,actual->k) into comparable from jsonb_object_keys(payload->'before') as keys(k);
 if comparable is distinct from payload->'before' and comparable is distinct from payload->'after' then
  raise exception 'Reviewed peak changed; review required';
 end if;
 perform 1 from public.peaks_i18n where peak_id=83 order by lang for update;
 select coalesce(jsonb_agg(to_jsonb(t) order by t.lang),'[]'::jsonb) into texts from public.peaks_i18n t where peak_id=83;
 if texts is distinct from payload->'translations' then raise exception 'Reviewed translations changed; review required'; end if;
 -- No existing trail/POI should silently become hidden with this record.
 if exists(select from public.trails where peak_id=83) or exists(select from public.pois where peak_id=83) then
  raise exception 'Reviewed peak now has linked trails or POIs; review required';
 end if;
 if comparable=payload->'after' then raise notice 'Already in the requested state; nothing changed'; return; end if;
 update public.peaks set active=(payload->'after'->>'active')::boolean where id=83;
 raise notice 'Reviewed peak 83 active=%; all records retained',payload->'after'->>'active';
end $review$;
commit;
