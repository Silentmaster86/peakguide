-- Disposable integration fixture, NOT a production baseline or migration.
\set ON_ERROR_STOP on
create extension if not exists postgis;
do $$ begin if not exists(select from pg_roles where rolname='anon') then create role anon; end if; end $$;
do $$ begin if not exists(select from pg_roles where rolname='authenticated') then create role authenticated; end if; end $$;
create function public.is_peakguide_admin() returns boolean language sql stable as $$ select current_setting('test.admin', true) = 'yes' $$;
create table mountain_ranges(id bigint primary key);
create table subranges(id bigint primary key, range_id bigint references mountain_ranges);
create table peaks (
 id bigint generated always as identity primary key, slug text unique not null,
 range_id bigint references mountain_ranges, subrange_id bigint references subranges,
 elevation_m integer not null, latitude double precision, longitude double precision,
 difficulty text, best_season text, cover_image_url text, cover_image_author text,
 cover_image_source_url text, cover_image_license text, cover_image_license_url text,
 is_korona boolean not null, active boolean not null, geom geometry(Point,4326)
);
create table peaks_i18n(peak_id bigint references peaks on delete cascade, lang text,
 name text not null check (name <> 'FORCE_FAILURE'), short_description text, description text, tips text,
 primary key(peak_id,lang));
insert into mountain_ranges values(1),(2);
insert into subranges values(10,1),(20,2);
grant usage on schema public to authenticated, anon;
grant select on mountain_ranges, subranges to authenticated;
grant select, insert, update, delete on peaks, peaks_i18n to authenticated;
grant usage on all sequences in schema public to authenticated;
alter table peaks enable row level security;
alter table peaks_i18n enable row level security;
create policy test_admin on peaks to authenticated using(public.is_peakguide_admin()) with check(public.is_peakguide_admin());
create policy test_admin on peaks_i18n to authenticated using(public.is_peakguide_admin()) with check(public.is_peakguide_admin());
\i /tmp/admin_save_peak.sql
set role authenticated;
set test.admin = 'yes';
do $$
declare
 payload jsonb := '{"slug":"test-peak","range_id":1,"subrange_id":10,"elevation_m":1000,"latitude":50,"longitude":20,"active":true,"is_korona":false,"i18n":{"pl":{"name":"Test"}}}';
 test_peak_id bigint;
begin
 test_peak_id := public.admin_save_peak(null,payload);
 if not exists(select 1 from peaks where peaks.id=test_peak_id and st_x(geom)=20 and st_y(geom)=50) then raise exception 'FAIL geom'; end if;
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
 perform set_config('test.admin','no',true);
 begin
   perform public.admin_save_peak(null,payload);
   raise exception 'FAIL non-admin accepted';
 exception when raise_exception then if sqlerrm <> 'Admin access required' then raise; end if; end;
 raise notice 'PASS: create, geom, create rollback, update rollback, subrange, coordinates, clearing geom, non-admin';
end $$;
reset role;
do $$ begin
 if has_function_privilege('anon','public.admin_save_peak(bigint,jsonb)','execute') then raise exception 'FAIL anon execute'; end if;
 raise notice 'PASS: anonymous cannot execute';
end $$;
