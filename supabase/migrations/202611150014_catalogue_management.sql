-- Requires the existing catalogue tables and PostGIS in public.
-- Apply and verify on staging before releasing the matching frontend.
begin;
alter table public.trails add column if not exists updated_at timestamptz not null default now(),
 add column if not exists route_geometry jsonb,
 add column if not exists geometry_source_url text,
 add column if not exists geometry_verified_at timestamptz;
alter table public.pois add column if not exists updated_at timestamptz not null default now(),
 add column if not exists source_url text,
 add column if not exists last_verified_at timestamptz;
create or replace function public.catalogue_touch_updated_at() returns trigger
language plpgsql set search_path='' as $$ begin new.updated_at=clock_timestamp(); return new; end $$;
revoke all on function public.catalogue_touch_updated_at() from public,anon,authenticated;
create or replace function public.catalogue_validate_url(value text) returns boolean
language sql immutable set search_path='' as $$ select value is null or value ~ '^https?://[^[:space:]/]+(/[^[:space:]]*)?$' $$;
revoke all on function public.catalogue_validate_url(text) from public,anon;
grant execute on function public.catalogue_validate_url(text) to authenticated;

drop trigger if exists catalogue_touch on public.trails;
create trigger catalogue_touch before update on public.trails for each row execute function public.catalogue_touch_updated_at();
alter table public.trails enable row level security;
alter table public.trails_i18n enable row level security;
drop policy if exists "Catalogue admins manage trails" on public.trails;
create policy "Catalogue admins manage trails" on public.trails for all to authenticated using ((select public.is_peakguide_admin())) with check ((select public.is_peakguide_admin()));
drop policy if exists "Catalogue admins manage trails_i18n" on public.trails_i18n;
create policy "Catalogue admins manage trails_i18n" on public.trails_i18n for all to authenticated using ((select public.is_peakguide_admin())) with check ((select public.is_peakguide_admin()));
grant select,insert,update,delete on public.trails,public.trails_i18n to authenticated;
do $$ declare seq text; begin
 seq=pg_get_serial_sequence('public.trails','id');
 if seq is not null then execute format('grant usage on sequence %s to authenticated',seq); end if;
end $$;
create or replace function public.admin_save_trail(p_id bigint,p_body jsonb,p_expected_updated_at timestamptz default null)
returns bigint language plpgsql security invoker set search_path='' as $$
declare v public.trails%rowtype; saved_id bigint; translations jsonb; k text; tr jsonb; geometry public.geometry;
begin
 if public.is_peakguide_admin() is not true then raise exception 'Admin access required'; end if;
 if jsonb_typeof(p_body) is distinct from 'object' then raise exception 'Invalid payload'; end if;
 if p_id is not null then
  select * into v from public.trails where id=p_id for update;
  if not found then raise exception 'Record not found'; end if;
  if p_expected_updated_at is null or v.updated_at is distinct from p_expected_updated_at then raise exception 'Record changed; reload before saving'; end if;
 end if;
 v=jsonb_populate_record(v,p_body);
 if v.peak_id is null or not exists(select from public.peaks where id=v.peak_id) then raise exception 'Invalid peak'; end if;
 if v.active is null then raise exception 'Active required'; end if;
 if not public.catalogue_validate_url(v.gpx_url) or not public.catalogue_validate_url(v.map_url) or not public.catalogue_validate_url(v.source_url) or not public.catalogue_validate_url(v.distance_source_url) or not public.catalogue_validate_url(v.elevation_gain_source_url) or not public.catalogue_validate_url(v.time_source_url) or not public.catalogue_validate_url(v.geometry_source_url) then raise exception 'Invalid URL'; end if;
 
 if v.slug is null or v.slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then raise exception 'Invalid slug'; end if;
 if p_id is not null and exists(select from public.pois where trail_id=p_id and peak_id<>v.peak_id) then raise exception 'Linked POIs belong to another peak'; end if;
 if v.route_type is null or v.route_type not in ('loop','out-and-back','point-to-point') then raise exception 'Invalid route type'; end if;
 if v.difficulty is not null and v.difficulty not in ('easy','moderate','hard') then raise exception 'Invalid difficulty'; end if;
 if v.distance_km is not null and (v.distance_km<=0 or v.distance_km>1000) then raise exception 'Invalid distance'; end if;
 if v.elevation_gain_m is not null and (v.elevation_gain_m<0 or v.elevation_gain_m>100000) then raise exception 'Invalid ascent'; end if;
 if v.time_min is not null and (v.time_min<=0 or v.time_min>100000) then raise exception 'Invalid time'; end if;
 if v.route_geometry is not null then
  if v.geometry_source_url is null or v.geometry_verified_at is null then raise exception 'Geometry needs source and date'; end if;
  geometry=public.st_geomfromgeojson(v.route_geometry::text);
  if public.st_geometrytype(geometry) not in ('ST_LineString','ST_MultiLineString')
   or public.st_srid(geometry)<>4326 or public.st_isempty(geometry)
   or public.st_npoints(geometry)>20000 or not public.st_isvalid(geometry)
   or public.st_xmin(geometry::public.box3d)<-180 or public.st_xmax(geometry::public.box3d)>180
   or public.st_ymin(geometry::public.box3d)<-90 or public.st_ymax(geometry::public.box3d)>90 then raise exception 'Invalid route geometry'; end if;
 end if;

 translations=p_body->'i18n';
 if jsonb_typeof(translations) is distinct from 'object' or translations='{}'::jsonb then raise exception 'Add a named translation'; end if;
 for k,tr in select key,value from jsonb_each(translations) loop
  if k not in ('pl','en','ua','zh') or jsonb_typeof(tr) is distinct from 'object' or nullif(btrim(tr->>'name'),'') is null then raise exception 'Invalid translation'; end if;
 end loop;
 if p_id is null then
  insert into public.trails (peak_id, slug, start_point_name, end_point_name, distance_km, elevation_gain_m, time_min, difficulty, route_type, gpx_url, map_url, active, source_url, last_verified_at, distance_source_url, distance_verified_at, elevation_gain_source_url, elevation_gain_verified_at, time_source_url, time_verified_at, route_geometry, geometry_source_url, geometry_verified_at) values (v.peak_id, v.slug, v.start_point_name, v.end_point_name, v.distance_km, v.elevation_gain_m, v.time_min, v.difficulty, v.route_type, v.gpx_url, v.map_url, v.active, v.source_url, v.last_verified_at, v.distance_source_url, v.distance_verified_at, v.elevation_gain_source_url, v.elevation_gain_verified_at, v.time_source_url, v.time_verified_at, v.route_geometry, v.geometry_source_url, v.geometry_verified_at) returning id into saved_id;
 else
  update public.trails set peak_id=v.peak_id, slug=v.slug, start_point_name=v.start_point_name, end_point_name=v.end_point_name, distance_km=v.distance_km, elevation_gain_m=v.elevation_gain_m, time_min=v.time_min, difficulty=v.difficulty, route_type=v.route_type, gpx_url=v.gpx_url, map_url=v.map_url, active=v.active, source_url=v.source_url, last_verified_at=v.last_verified_at, distance_source_url=v.distance_source_url, distance_verified_at=v.distance_verified_at, elevation_gain_source_url=v.elevation_gain_source_url, elevation_gain_verified_at=v.elevation_gain_verified_at, time_source_url=v.time_source_url, time_verified_at=v.time_verified_at, route_geometry=v.route_geometry, geometry_source_url=v.geometry_source_url, geometry_verified_at=v.geometry_verified_at where id=p_id returning id into saved_id;
 end if;
 delete from public.trails_i18n where trail_id=saved_id and lang in ('pl','en','ua','zh') and not(translations?lang);
 for k,tr in select key,value from jsonb_each(translations) loop
  insert into public.trails_i18n (trail_id,lang,name, description, notes) values(saved_id,k,nullif(btrim(tr->>'name'),''), nullif(btrim(tr->>'description'),''), nullif(btrim(tr->>'notes'),''))
  on conflict(trail_id,lang) do update set name=excluded.name, description=excluded.description, notes=excluded.notes;
 end loop;
 return saved_id;
end $$;
revoke all on function public.admin_save_trail(bigint,jsonb,timestamptz) from public,anon;
grant execute on function public.admin_save_trail(bigint,jsonb,timestamptz) to authenticated;

drop trigger if exists catalogue_touch on public.pois;
create trigger catalogue_touch before update on public.pois for each row execute function public.catalogue_touch_updated_at();
alter table public.pois enable row level security;
alter table public.pois_i18n enable row level security;
drop policy if exists "Catalogue admins manage pois" on public.pois;
create policy "Catalogue admins manage pois" on public.pois for all to authenticated using ((select public.is_peakguide_admin())) with check ((select public.is_peakguide_admin()));
drop policy if exists "Catalogue admins manage pois_i18n" on public.pois_i18n;
create policy "Catalogue admins manage pois_i18n" on public.pois_i18n for all to authenticated using ((select public.is_peakguide_admin())) with check ((select public.is_peakguide_admin()));
grant select,insert,update,delete on public.pois,public.pois_i18n to authenticated;
do $$ declare seq text; begin
 seq=pg_get_serial_sequence('public.pois','id');
 if seq is not null then execute format('grant usage on sequence %s to authenticated',seq); end if;
end $$;
create or replace function public.admin_save_poi(p_id bigint,p_body jsonb,p_expected_updated_at timestamptz default null)
returns bigint language plpgsql security invoker set search_path='' as $$
declare v public.pois%rowtype; saved_id bigint; translations jsonb; k text; tr jsonb; geometry public.geometry;
begin
 if public.is_peakguide_admin() is not true then raise exception 'Admin access required'; end if;
 if jsonb_typeof(p_body) is distinct from 'object' then raise exception 'Invalid payload'; end if;
 if p_id is not null then
  select * into v from public.pois where id=p_id for update;
  if not found then raise exception 'Record not found'; end if;
  if p_expected_updated_at is null or v.updated_at is distinct from p_expected_updated_at then raise exception 'Record changed; reload before saving'; end if;
 end if;
 v=jsonb_populate_record(v,p_body);
 if v.peak_id is null or not exists(select from public.peaks where id=v.peak_id) then raise exception 'Invalid peak'; end if;
 if v.active is null then raise exception 'Active required'; end if;
 if not public.catalogue_validate_url(v.website_url) or not public.catalogue_validate_url(v.google_maps_url) or not public.catalogue_validate_url(v.source_url) then raise exception 'Invalid URL'; end if;
 
 if v.type_id is null or not exists(select from public.poi_types where id=v.type_id) then raise exception 'Invalid POI type'; end if;
 if (v.latitude is null)<>(v.longitude is null) or (v.latitude is not null and (v.latitude not between -90 and 90 or v.longitude not between -180 and 180)) then raise exception 'Invalid coordinates'; end if;
 if v.trail_id is not null and not exists(select from public.trails where id=v.trail_id and peak_id=v.peak_id) then raise exception 'Trail belongs to another peak'; end if;

 translations=p_body->'i18n';
 if jsonb_typeof(translations) is distinct from 'object' or translations='{}'::jsonb then raise exception 'Add a named translation'; end if;
 for k,tr in select key,value from jsonb_each(translations) loop
  if k not in ('pl','en','ua','zh') or jsonb_typeof(tr) is distinct from 'object' or nullif(btrim(tr->>'name'),'') is null then raise exception 'Invalid translation'; end if;
 end loop;
 if p_id is null then
  insert into public.pois (peak_id, trail_id, type_id, latitude, longitude, website_url, google_maps_url, active, source_url, last_verified_at) values (v.peak_id, v.trail_id, v.type_id, v.latitude, v.longitude, v.website_url, v.google_maps_url, v.active, v.source_url, v.last_verified_at) returning id into saved_id;
 else
  update public.pois set peak_id=v.peak_id, trail_id=v.trail_id, type_id=v.type_id, latitude=v.latitude, longitude=v.longitude, website_url=v.website_url, google_maps_url=v.google_maps_url, active=v.active, source_url=v.source_url, last_verified_at=v.last_verified_at where id=p_id returning id into saved_id;
 end if;
 delete from public.pois_i18n where poi_id=saved_id and lang in ('pl','en','ua','zh') and not(translations?lang);
 for k,tr in select key,value from jsonb_each(translations) loop
  insert into public.pois_i18n (poi_id,lang,name, description, tips) values(saved_id,k,nullif(btrim(tr->>'name'),''), nullif(btrim(tr->>'description'),''), nullif(btrim(tr->>'tips'),''))
  on conflict(poi_id,lang) do update set name=excluded.name, description=excluded.description, tips=excluded.tips;
 end loop;
 return saved_id;
end $$;
revoke all on function public.admin_save_poi(bigint,jsonb,timestamptz) from public,anon;
grant execute on function public.admin_save_poi(bigint,jsonb,timestamptz) to authenticated;
-- Translation-only edits also invalidate an editor's revision token.
create or replace function public.catalogue_translation_revision() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if tg_table_name='trails_i18n' then
  if tg_op<>'INSERT' then update public.trails set updated_at=clock_timestamp() where id=old.trail_id; end if;
  if tg_op<>'DELETE' then update public.trails set updated_at=clock_timestamp() where id=new.trail_id; end if;
 else
  if tg_op<>'INSERT' then update public.pois set updated_at=clock_timestamp() where id=old.poi_id; end if;
  if tg_op<>'DELETE' then update public.pois set updated_at=clock_timestamp() where id=new.poi_id; end if;
 end if;
 return null;
end $$;
revoke all on function public.catalogue_translation_revision() from public,anon,authenticated;
drop trigger if exists catalogue_translation_revision on public.trails_i18n;
create trigger catalogue_translation_revision after insert or update or delete on public.trails_i18n for each row execute function public.catalogue_translation_revision();
drop trigger if exists catalogue_translation_revision on public.pois_i18n;
create trigger catalogue_translation_revision after insert or update or delete on public.pois_i18n for each row execute function public.catalogue_translation_revision();

-- Public reads require published records and an active parent peak.
create policy "Catalogue public read anon trails" on public.trails for select to anon using ((active=true and exists(select 1 from public.peaks p where p.id=trails.peak_id and p.active=true)));
create policy "Catalogue read guard anon trails" on public.trails as restrictive for select to anon using ((active=true and exists(select 1 from public.peaks p where p.id=trails.peak_id and p.active=true)));
create policy "Catalogue public read authenticated trails" on public.trails for select to authenticated using (((select public.is_peakguide_admin()) or (active=true and exists(select 1 from public.peaks p where p.id=trails.peak_id and p.active=true))));
create policy "Catalogue read guard authenticated trails" on public.trails as restrictive for select to authenticated using (((select public.is_peakguide_admin()) or (active=true and exists(select 1 from public.peaks p where p.id=trails.peak_id and p.active=true))));
create policy "Catalogue write guard insert trails" on public.trails as restrictive for insert to authenticated  with check ((select public.is_peakguide_admin()));
create policy "Catalogue write guard update trails" on public.trails as restrictive for update to authenticated using ((select public.is_peakguide_admin())) with check ((select public.is_peakguide_admin()));
create policy "Catalogue write guard delete trails" on public.trails as restrictive for delete to authenticated using ((select public.is_peakguide_admin())) ;
revoke insert,update,delete on public.trails from public,anon;
grant select on public.trails to anon,authenticated;
create policy "Catalogue public read anon pois" on public.pois for select to anon using ((active=true and exists(select 1 from public.peaks p where p.id=pois.peak_id and p.active=true)));
create policy "Catalogue read guard anon pois" on public.pois as restrictive for select to anon using ((active=true and exists(select 1 from public.peaks p where p.id=pois.peak_id and p.active=true)));
create policy "Catalogue public read authenticated pois" on public.pois for select to authenticated using (((select public.is_peakguide_admin()) or (active=true and exists(select 1 from public.peaks p where p.id=pois.peak_id and p.active=true))));
create policy "Catalogue read guard authenticated pois" on public.pois as restrictive for select to authenticated using (((select public.is_peakguide_admin()) or (active=true and exists(select 1 from public.peaks p where p.id=pois.peak_id and p.active=true))));
create policy "Catalogue write guard insert pois" on public.pois as restrictive for insert to authenticated  with check ((select public.is_peakguide_admin()));
create policy "Catalogue write guard update pois" on public.pois as restrictive for update to authenticated using ((select public.is_peakguide_admin())) with check ((select public.is_peakguide_admin()));
create policy "Catalogue write guard delete pois" on public.pois as restrictive for delete to authenticated using ((select public.is_peakguide_admin())) ;
revoke insert,update,delete on public.pois from public,anon;
grant select on public.pois to anon,authenticated;
create policy "Catalogue public read anon trails_i18n" on public.trails_i18n for select to anon using ((exists(select 1 from public.trails b join public.peaks p on p.id=b.peak_id where b.id=trails_i18n.trail_id and b.active=true and p.active=true)));
create policy "Catalogue read guard anon trails_i18n" on public.trails_i18n as restrictive for select to anon using ((exists(select 1 from public.trails b join public.peaks p on p.id=b.peak_id where b.id=trails_i18n.trail_id and b.active=true and p.active=true)));
create policy "Catalogue public read authenticated trails_i18n" on public.trails_i18n for select to authenticated using (((select public.is_peakguide_admin()) or (exists(select 1 from public.trails b join public.peaks p on p.id=b.peak_id where b.id=trails_i18n.trail_id and b.active=true and p.active=true))));
create policy "Catalogue read guard authenticated trails_i18n" on public.trails_i18n as restrictive for select to authenticated using (((select public.is_peakguide_admin()) or (exists(select 1 from public.trails b join public.peaks p on p.id=b.peak_id where b.id=trails_i18n.trail_id and b.active=true and p.active=true))));
create policy "Catalogue write guard insert trails_i18n" on public.trails_i18n as restrictive for insert to authenticated  with check ((select public.is_peakguide_admin()));
create policy "Catalogue write guard update trails_i18n" on public.trails_i18n as restrictive for update to authenticated using ((select public.is_peakguide_admin())) with check ((select public.is_peakguide_admin()));
create policy "Catalogue write guard delete trails_i18n" on public.trails_i18n as restrictive for delete to authenticated using ((select public.is_peakguide_admin())) ;
revoke insert,update,delete on public.trails_i18n from public,anon;
grant select on public.trails_i18n to anon,authenticated;
create policy "Catalogue public read anon pois_i18n" on public.pois_i18n for select to anon using ((exists(select 1 from public.pois b join public.peaks p on p.id=b.peak_id where b.id=pois_i18n.poi_id and b.active=true and p.active=true)));
create policy "Catalogue read guard anon pois_i18n" on public.pois_i18n as restrictive for select to anon using ((exists(select 1 from public.pois b join public.peaks p on p.id=b.peak_id where b.id=pois_i18n.poi_id and b.active=true and p.active=true)));
create policy "Catalogue public read authenticated pois_i18n" on public.pois_i18n for select to authenticated using (((select public.is_peakguide_admin()) or (exists(select 1 from public.pois b join public.peaks p on p.id=b.peak_id where b.id=pois_i18n.poi_id and b.active=true and p.active=true))));
create policy "Catalogue read guard authenticated pois_i18n" on public.pois_i18n as restrictive for select to authenticated using (((select public.is_peakguide_admin()) or (exists(select 1 from public.pois b join public.peaks p on p.id=b.peak_id where b.id=pois_i18n.poi_id and b.active=true and p.active=true))));
create policy "Catalogue write guard insert pois_i18n" on public.pois_i18n as restrictive for insert to authenticated  with check ((select public.is_peakguide_admin()));
create policy "Catalogue write guard update pois_i18n" on public.pois_i18n as restrictive for update to authenticated using ((select public.is_peakguide_admin())) with check ((select public.is_peakguide_admin()));
create policy "Catalogue write guard delete pois_i18n" on public.pois_i18n as restrictive for delete to authenticated using ((select public.is_peakguide_admin())) ;
revoke insert,update,delete on public.pois_i18n from public,anon;
grant select on public.pois_i18n to anon,authenticated;
notify pgrst, 'reload schema';
commit;
