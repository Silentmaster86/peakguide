-- Complete the production RLS configuration without replacing policies that
-- already protect public reads, profiles, messages, peaks and translations.
--
-- The production database already uses public.is_peakguide_admin(). This
-- migration deliberately reuses that function instead of introducing a
-- second administrator check with different semantics.

begin;

do $$
begin
	if to_regprocedure('public.is_peakguide_admin()') is null then
		raise exception 'Required function public.is_peakguide_admin() is missing';
	end if;
end
$$;

alter table public.languages enable row level security;
alter table public.mountain_ranges enable row level security;
alter table public.mountain_ranges_i18n enable row level security;
alter table public.subranges enable row level security;
alter table public.subranges_i18n enable row level security;
alter table public.poi_types enable row level security;
alter table public.poi_types_i18n enable row level security;
alter table public.pois enable row level security;
alter table public.pois_i18n enable row level security;
alter table public.trails enable row level security;
alter table public.trails_i18n enable row level security;
alter table public.peak_nearby enable row level security;

-- Existing production policies already allow the appropriate public reads.
-- Add only the missing catalogue-management policies for administrators.

drop policy if exists "Admins can manage languages" on public.languages;
create policy "Admins can manage languages"
on public.languages for all
to authenticated
using ((select public.is_peakguide_admin()))
with check ((select public.is_peakguide_admin()));

drop policy if exists "Admins can manage mountain ranges" on public.mountain_ranges;
create policy "Admins can manage mountain ranges"
on public.mountain_ranges for all
to authenticated
using ((select public.is_peakguide_admin()))
with check ((select public.is_peakguide_admin()));

drop policy if exists "Admins can manage mountain range translations" on public.mountain_ranges_i18n;
create policy "Admins can manage mountain range translations"
on public.mountain_ranges_i18n for all
to authenticated
using ((select public.is_peakguide_admin()))
with check ((select public.is_peakguide_admin()));

drop policy if exists "Admins can manage subranges" on public.subranges;
create policy "Admins can manage subranges"
on public.subranges for all
to authenticated
using ((select public.is_peakguide_admin()))
with check ((select public.is_peakguide_admin()));

drop policy if exists "Admins can manage subrange translations" on public.subranges_i18n;
create policy "Admins can manage subrange translations"
on public.subranges_i18n for all
to authenticated
using ((select public.is_peakguide_admin()))
with check ((select public.is_peakguide_admin()));

drop policy if exists "Admins can manage POI types" on public.poi_types;
create policy "Admins can manage POI types"
on public.poi_types for all
to authenticated
using ((select public.is_peakguide_admin()))
with check ((select public.is_peakguide_admin()));

drop policy if exists "Admins can manage POI type translations" on public.poi_types_i18n;
create policy "Admins can manage POI type translations"
on public.poi_types_i18n for all
to authenticated
using ((select public.is_peakguide_admin()))
with check ((select public.is_peakguide_admin()));

drop policy if exists "Admins can manage POIs" on public.pois;
create policy "Admins can manage POIs"
on public.pois for all
to authenticated
using ((select public.is_peakguide_admin()))
with check ((select public.is_peakguide_admin()));

drop policy if exists "Admins can manage POI translations" on public.pois_i18n;
create policy "Admins can manage POI translations"
on public.pois_i18n for all
to authenticated
using ((select public.is_peakguide_admin()))
with check ((select public.is_peakguide_admin()));

drop policy if exists "Admins can manage trails" on public.trails;
create policy "Admins can manage trails"
on public.trails for all
to authenticated
using ((select public.is_peakguide_admin()))
with check ((select public.is_peakguide_admin()));

drop policy if exists "Admins can manage trail translations" on public.trails_i18n;
create policy "Admins can manage trail translations"
on public.trails_i18n for all
to authenticated
using ((select public.is_peakguide_admin()))
with check ((select public.is_peakguide_admin()));

drop policy if exists "Admins can manage nearby peaks" on public.peak_nearby;
create policy "Admins can manage nearby peaks"
on public.peak_nearby for all
to authenticated
using ((select public.is_peakguide_admin()))
with check ((select public.is_peakguide_admin()));

grant select on public.languages, public.mountain_ranges,
	public.mountain_ranges_i18n, public.subranges, public.subranges_i18n,
	public.poi_types, public.poi_types_i18n, public.pois, public.pois_i18n,
	public.trails, public.trails_i18n, public.peak_nearby
to anon, authenticated;

grant insert, update, delete on public.languages, public.mountain_ranges,
	public.mountain_ranges_i18n, public.subranges, public.subranges_i18n,
	public.poi_types, public.poi_types_i18n, public.pois, public.pois_i18n,
	public.trails, public.trails_i18n, public.peak_nearby
to authenticated;

commit;
