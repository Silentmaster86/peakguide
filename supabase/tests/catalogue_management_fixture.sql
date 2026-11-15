create extension if not exists postgis;
do $$ begin create role anon; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
create function public.is_peakguide_admin() returns boolean language sql stable as $$ select coalesce(current_setting('test.admin',true),'')='yes' $$;
create table peaks(id bigserial primary key,slug text,active boolean default true);
create table poi_types(id bigserial primary key,slug text);
create table trails(id bigserial primary key,peak_id bigint references peaks,slug text unique not null,
 start_point_name text,end_point_name text,distance_km numeric,elevation_gain_m integer,time_min integer,
 difficulty text,route_type text,gpx_url text,map_url text,active boolean default true,
 source_url text,last_verified_at timestamptz,distance_source_url text,distance_verified_at timestamptz,
 elevation_gain_source_url text,elevation_gain_verified_at timestamptz,time_source_url text,time_verified_at timestamptz);
create table trails_i18n(trail_id bigint references trails on delete cascade,lang text,name text not null check(name<>'FORCE_FAIL'),description text,notes text,primary key(trail_id,lang));
create table pois(id bigserial primary key,peak_id bigint references peaks,trail_id bigint references trails,type_id bigint references poi_types,
 latitude numeric(9,6),longitude numeric(9,6),website_url text,google_maps_url text,active boolean default true,parking_id bigint);
create table pois_i18n(poi_id bigint references pois on delete cascade,lang text,name text not null check(name<>'FORCE_FAIL'),description text,tips text,primary key(poi_id,lang));
insert into peaks values(1,'first',true),(2,'other',true);
insert into poi_types values(1,'parking');
grant usage on schema public to authenticated,anon;
grant select on peaks,poi_types to authenticated,anon;
