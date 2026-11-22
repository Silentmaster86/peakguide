-- Deliberately isolated integration fixture, NOT a production schema migration.
-- Mirrors columns observed via public SELECT, with explicit test RLS policies.
create schema peakguide_private;
create table peakguide_private.catalogue_batch_receipts(batch_key text primary key,snapshot jsonb not null,created_at timestamptz default now());
alter table peakguide_private.catalogue_batch_receipts enable row level security;
revoke all on schema peakguide_private from public,anon,authenticated;
create table peaks(id bigint primary key,slug text unique not null,active boolean not null default true,is_korona boolean not null default true);
create table trails(id bigint primary key,peak_id bigint references peaks,slug text unique,start_point_name text,end_point_name text,active boolean default true,route_geometry jsonb,distance_km numeric,gpx_url text);
create table trail_access(id bigserial primary key,trail_id bigint not null references trails,
 address text,postcode text,latitude numeric,longitude numeric,google_maps_url text,public_transport_url text,
 source_url text,last_verified_at timestamptz,active boolean default true,created_at timestamptz default now());
create table trail_access_i18n(access_id bigint references trail_access on delete cascade,lang varchar(8),directions text,public_transport text,warnings text,primary key(access_id,lang));
create table trail_parking(id bigserial primary key,trail_id bigint not null references trails,slug text unique not null,
 address text,postcode text,latitude numeric,longitude numeric,map_url text,source_url text,is_primary boolean default false,paid boolean,toilets boolean,overnight_allowed boolean,capacity integer,last_verified_at timestamptz,active boolean default true,created_at timestamptz default now());
create table trail_parking_i18n(parking_id bigint references trail_parking on delete cascade,lang varchar(8),name text not null,description text,notes text,fee_info text,opening_info text,primary key(parking_id,lang));
alter table trail_access enable row level security;
alter table trail_access_i18n enable row level security;
alter table trail_parking enable row level security;
alter table trail_parking_i18n enable row level security;
grant usage on schema public to anon,authenticated;
grant select on all tables in schema public to anon,authenticated;
create policy read_access on trail_access for select to anon,authenticated using(active);
create policy read_parking on trail_parking for select to anon,authenticated using(active);
create policy read_access_text on trail_access_i18n for select to anon,authenticated using(exists(select from trail_access a where a.id=access_id and a.active));
create policy read_parking_text on trail_parking_i18n for select to anon,authenticated using(exists(select from trail_parking p where p.id=parking_id and p.active));
