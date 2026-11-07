-- Requires the existing production schema and is_peakguide_admin().
-- Apply on staging, then before the matching frontend release. Never falls back
-- to a sequence of client writes: translation failures must roll back the peak.
begin;
create or replace function public.admin_save_peak(p_peak_id bigint, p_body jsonb)
returns bigint language plpgsql security invoker set search_path = public
as $$
declare
  v_peak public.peaks%rowtype;
  v_id bigint;
  v_lang text;
  v_translation jsonb;
  v_i18n jsonb := p_body->'i18n';
begin
  if public.is_peakguide_admin() is not true then raise exception 'Admin access required'; end if;
  if jsonb_typeof(p_body) is distinct from 'object' then raise exception 'Invalid peak payload'; end if;
  v_peak := jsonb_populate_record(null::public.peaks, p_body);
  if v_peak.slug is null or v_peak.slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then raise exception 'Invalid slug'; end if;
  if v_peak.range_id is null or not exists(select 1 from public.mountain_ranges where id = v_peak.range_id) then raise exception 'Invalid range'; end if;
  if v_peak.subrange_id is not null and not exists(select 1 from public.subranges where id = v_peak.subrange_id and range_id = v_peak.range_id) then raise exception 'Subrange does not belong to range'; end if;
  if v_peak.elevation_m is null or v_peak.elevation_m not between -500 and 9000 then raise exception 'Invalid elevation'; end if;
  if (v_peak.latitude is null) <> (v_peak.longitude is null) or
    (v_peak.latitude is not null and (v_peak.latitude not between -90 and 90 or v_peak.longitude not between -180 and 180)) then raise exception 'Invalid coordinates'; end if;
  if jsonb_typeof(v_i18n) is distinct from 'object' or v_i18n = '{}'::jsonb then raise exception 'Add at least one translation'; end if;
  if exists(select 1 from jsonb_each(v_i18n) as x where x.key not in ('pl','en','ua','zh') or jsonb_typeof(x.value) <> 'object' or nullif(btrim(x.value->>'name'), '') is null) then raise exception 'Invalid translation'; end if;
  if p_peak_id is null then
    insert into public.peaks (slug, range_id, subrange_id, elevation_m, latitude, longitude, difficulty, best_season, cover_image_url, cover_image_author, cover_image_source_url, cover_image_license, cover_image_license_url, is_korona, active)
    values (v_peak.slug, v_peak.range_id, v_peak.subrange_id, v_peak.elevation_m, v_peak.latitude, v_peak.longitude, v_peak.difficulty, v_peak.best_season, v_peak.cover_image_url, v_peak.cover_image_author, v_peak.cover_image_source_url, v_peak.cover_image_license, v_peak.cover_image_license_url, v_peak.is_korona, v_peak.active) returning id into v_id;
  else
    update public.peaks set slug = v_peak.slug, range_id = v_peak.range_id, subrange_id = v_peak.subrange_id, elevation_m = v_peak.elevation_m, latitude = v_peak.latitude, longitude = v_peak.longitude, difficulty = v_peak.difficulty, best_season = v_peak.best_season, cover_image_url = v_peak.cover_image_url, cover_image_author = v_peak.cover_image_author, cover_image_source_url = v_peak.cover_image_source_url, cover_image_license = v_peak.cover_image_license, cover_image_license_url = v_peak.cover_image_license_url, is_korona = v_peak.is_korona, active = v_peak.active where id = p_peak_id returning id into v_id;
    if not found then raise exception 'Peak not found or update denied'; end if;
  end if;
  -- Synchronize the point in the same transaction. ST_MakePoint expects longitude first.
  update public.peaks set geom = case when v_peak.latitude is null then null else
    st_setsrid(st_makepoint(v_peak.longitude, v_peak.latitude), 4326) end where id = v_id;
  delete from public.peaks_i18n where peak_id = v_id and lang in ('pl','en','ua','zh') and not (v_i18n ? lang);
  for v_lang, v_translation in select key, value from jsonb_each(v_i18n) loop
    insert into public.peaks_i18n (peak_id, lang, name, short_description, description, tips)
    values (v_id, v_lang, btrim(v_translation->>'name'), nullif(btrim(v_translation->>'short_description'), ''), nullif(btrim(v_translation->>'description'), ''), nullif(btrim(v_translation->>'tips'), ''))
    on conflict (peak_id, lang) do update set name = excluded.name, short_description = excluded.short_description, description = excluded.description, tips = excluded.tips;
  end loop;
  return v_id;
end;
$$;
revoke all on function public.admin_save_peak(bigint,jsonb) from public, anon;
grant execute on function public.admin_save_peak(bigint,jsonb) to authenticated;
commit;
