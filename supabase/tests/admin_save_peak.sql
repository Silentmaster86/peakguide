-- Disposable integration fixture, NOT a production baseline or migration.
\set ON_ERROR_STOP on
create extension if not exists postgis;
do $$ begin if not exists(select from pg_roles where rolname='anon') then create role anon; end if; end $$;
do $$ begin if not exists(select from pg_roles where rolname='authenticated') then create role authenticated; end if; end $$;
-- Core tables/types/policies/grants match the owner's access snapshot.
-- Auth, countries, regions and languages are minimal referenced-table stubs.
create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
create table auth.users(id uuid primary key);
create table profiles(id uuid primary key references auth.users on delete cascade, email text, display_name text,
 role text default 'user', is_admin boolean default false, created_at timestamptz default now());
create function public.is_peakguide_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin' and is_admin=true)
$$;
revoke all on function public.is_peakguide_admin() from public,anon;
grant execute on function public.is_peakguide_admin() to authenticated;
create table countries(id bigint primary key);
create table regions(id bigint primary key);
create table languages(code varchar(8) primary key);
create table mountain_ranges(id bigserial primary key, slug text unique not null, created_at timestamptz not null default now(),
 country_id bigint not null references countries, region_id bigint references regions on delete set null);
create table subranges(id bigserial primary key, range_id bigint not null references mountain_ranges on delete cascade,
 slug text not null, created_at timestamptz not null default now(),unique(range_id,slug));
create table peaks (
 id bigserial primary key, slug text unique not null,
 range_id bigint not null references mountain_ranges, subrange_id bigint references subranges,
 elevation_m integer not null check (elevation_m > 0), latitude numeric(9,6), longitude numeric(9,6),
 difficulty text, best_season text, cover_image_url text, cover_image_author text,
 cover_image_source_url text, cover_image_license text, cover_image_license_url text,
 is_korona boolean not null default true, active boolean not null default true,
 created_at timestamptz not null default now(), geom geography(Point,4326)
);
-- Trigger body supplied by the owner, 2026-11-09. Remaining fixture is minimal.
create function public.set_peak_geom() returns trigger language plpgsql as $$
begin
 if new.latitude is not null and new.longitude is not null then
  new.geom := st_setsrid(st_makepoint(new.longitude::double precision, new.latitude::double precision),4326)::geography;
 else new.geom := null; end if;
 return new;
end $$;
create trigger trg_set_peak_geom before insert or update of latitude, longitude on peaks
for each row execute function public.set_peak_geom();
create table peaks_i18n(peak_id bigint references peaks on delete cascade, lang varchar(8) references languages(code),
 name text not null check (name <> 'FORCE_FAILURE'), short_description text, description text, tips text,
 primary key(peak_id,lang));
insert into countries values(1);
insert into languages values('pl'),('en'),('ua'),('zh');
insert into mountain_ranges(id,slug,country_id) values(1,'test-range',1),(2,'other-range',1);
insert into subranges(id,range_id,slug) values(10,1,'test-subrange'),(20,2,'other-subrange');
insert into auth.users values('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');
insert into profiles(id,role,is_admin) values('00000000-0000-0000-0000-000000000001','admin',true);
insert into profiles(id) values('00000000-0000-0000-0000-000000000002');
grant usage on schema public to authenticated, anon;
grant usage on schema auth to authenticated;
grant select, insert, update, delete on peaks, peaks_i18n, mountain_ranges, subranges to authenticated;
grant select on peaks,peaks_i18n,mountain_ranges,subranges to anon;
grant select,update,delete on profiles to authenticated;
revoke all on profiles from anon;
grant usage on all sequences in schema public to authenticated;
grant usage on sequence peaks_id_seq to anon;
alter table peaks enable row level security;
alter table peaks_i18n enable row level security;
alter table profiles enable row level security;
alter table mountain_ranges enable row level security;
alter table subranges enable row level security;
create policy test_admin on peaks to authenticated using((select public.is_peakguide_admin())) with check((select public.is_peakguide_admin()));
create policy test_admin on peaks_i18n to authenticated using((select public.is_peakguide_admin())) with check((select public.is_peakguide_admin()));
create policy public_read on peaks for select to anon,authenticated using(active=true);
create policy public_read on peaks_i18n for select to anon,authenticated using(exists(select 1 from peaks where peaks.id=peak_id and peaks.active=true));
create policy public_read on mountain_ranges for select to anon,authenticated using(true);
create policy public_read on subranges for select to anon,authenticated using(true);
create policy test_admin on mountain_ranges to authenticated using((select public.is_peakguide_admin())) with check((select public.is_peakguide_admin()));
create policy test_admin on subranges to authenticated using((select public.is_peakguide_admin())) with check((select public.is_peakguide_admin()));
create policy own_profile on profiles for select to authenticated using(id=(select auth.uid()));
create policy admin_read on profiles for select to authenticated using((select public.is_peakguide_admin()));
create policy admin_update on profiles for update to authenticated using((select public.is_peakguide_admin())) with check((select public.is_peakguide_admin()));
create policy admin_delete on profiles for delete to authenticated using((select public.is_peakguide_admin()) and id<>(select auth.uid()));
\i /tmp/admin_save_peak.sql
set role authenticated;
set test.uid = '00000000-0000-0000-0000-000000000001';
do $$
declare
 payload jsonb := '{"slug":"test-peak","range_id":1,"subrange_id":10,"elevation_m":1000,"latitude":50,"longitude":20,"active":true,"is_korona":false,"i18n":{"pl":{"name":"Test"}}}';
 test_peak_id bigint;
 invalid_elevation jsonb;
begin
 test_peak_id := public.admin_save_peak(null,payload);
 if not exists(select 1 from peaks where peaks.id=test_peak_id and st_x(geom::geometry)=20 and st_y(geom::geometry)=50) then raise exception 'FAIL geom'; end if;
 for invalid_elevation in select value from jsonb_array_elements('[-500,-1,0,1.5,9001,null,"bad"]') loop
  begin
   perform public.admin_save_peak(test_peak_id,jsonb_set(payload,'{elevation_m}',invalid_elevation));
   raise exception 'FAIL accepted invalid elevation';
  exception when raise_exception then if sqlerrm <> 'Invalid elevation' then raise; end if; end;
 end loop;
 perform public.admin_save_peak(test_peak_id,jsonb_set(payload,'{elevation_m}','1'));
 perform public.admin_save_peak(test_peak_id,jsonb_set(payload,'{elevation_m}','9000'));
 perform public.admin_save_peak(test_peak_id,payload);
 begin
   perform public.admin_save_peak(null,jsonb_set(jsonb_set(payload,'{slug}','"failed-create"'),'{i18n,pl,name}','"FORCE_FAILURE"'));
   raise exception 'FAIL expected constraint';
 exception when check_violation then null; end;
 if exists(select 1 from peaks where slug='failed-create') then raise exception 'FAIL partial create'; end if;
 begin
   perform public.admin_save_peak(test_peak_id,jsonb_set(jsonb_set(payload,'{elevation_m}','2000'),'{i18n,pl,name}','"FORCE_FAILURE"'));
   raise exception 'FAIL expected constraint';
 exception when check_violation then null; end;
 if (select elevation_m from peaks where peaks.id=test_peak_id)<>1000 then raise exception 'FAIL partial update'; end if;
 begin
   perform public.admin_save_peak(test_peak_id,jsonb_set(payload,'{subrange_id}','20'));
   raise exception 'FAIL accepted wrong subrange';
 exception when raise_exception then if sqlerrm <> 'Subrange does not belong to range' then raise; end if; end;
 begin
   perform public.admin_save_peak(test_peak_id,jsonb_set(payload,'{latitude}','91'));
   raise exception 'FAIL accepted coordinates';
 exception when raise_exception then if sqlerrm <> 'Invalid coordinates' then raise; end if; end;
 perform public.admin_save_peak(test_peak_id,jsonb_set(jsonb_set(payload,'{latitude}','null'),'{longitude}','null'));
 if exists(select 1 from peaks where peaks.id=test_peak_id and geom is not null) then raise exception 'FAIL geom not cleared'; end if;
 perform public.admin_save_peak(null,jsonb_set(jsonb_set(payload,'{slug}','"inactive-peak"'),'{active}','false'));
 perform set_config('test.uid','00000000-0000-0000-0000-000000000002',true);
 if (select count(*) from profiles)<>1 then raise exception 'FAIL profile visibility'; end if;
 if (select count(*) from peaks)<>1 or (select count(*) from peaks_i18n)<>1 then raise exception 'FAIL inactive visibility'; end if;
 update profiles set role='admin',is_admin=true where id=auth.uid();
 if found then raise exception 'FAIL user self promotion'; end if;
 update peaks set elevation_m=2000 where id=test_peak_id;
 if found then raise exception 'FAIL user peak update'; end if;
 begin
  insert into peaks(slug,range_id,elevation_m) values('forbidden',1,1000);
  raise exception 'FAIL user direct insert';
 exception when insufficient_privilege then null; end;
 begin
   perform public.admin_save_peak(null,payload);
   raise exception 'FAIL non-admin accepted';
 exception when raise_exception then if sqlerrm <> 'Admin access required' then raise; end if; end;
 raise notice 'PASS: create, geography with production trigger, integer elevation boundaries, create rollback, update rollback, subrange, coordinates, clearing geom, real admin helper, user isolation and direct-write denial';
end $$;
reset role;
-- Missing language must fail the translation insert and roll back the peak.
delete from languages where code='zh';
set role authenticated;
set test.uid='00000000-0000-0000-0000-000000000001';
do $$ begin
 begin
  perform public.admin_save_peak(null,'{"slug":"missing-language","range_id":1,"elevation_m":1000,"active":true,"is_korona":false,"i18n":{"zh":{"name":"Test"}}}');
  raise exception 'FAIL missing language accepted';
 exception when foreign_key_violation then null; end;
 if exists(select from peaks where slug='missing-language') then raise exception 'FAIL partial FK failure'; end if;
 raise notice 'PASS: missing language FK rolls back peak';
end $$;
reset role;
set role anon;
set test.uid='';
do $$ begin
 if (select count(*) from peaks)<>1 or (select count(*) from peaks_i18n)<>1 then raise exception 'FAIL anonymous catalogue visibility'; end if;
 begin
  perform 1 from profiles;
  raise exception 'FAIL anonymous profiles';
 exception when insufficient_privilege then null; end;
 begin
  insert into peaks(slug,range_id,elevation_m) values('forbidden-anon',1,1000);
  raise exception 'FAIL anonymous insert';
 exception when insufficient_privilege then null; end;
 raise notice 'PASS: anonymous sees only active catalogue, cannot read profiles or write';
end $$;
reset role;
do $$ begin
 if has_function_privilege('anon','public.admin_save_peak(bigint,jsonb)','execute') then raise exception 'FAIL anon execute'; end if;
 raise notice 'PASS: anonymous cannot execute';
end $$;
