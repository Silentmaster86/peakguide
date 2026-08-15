-- Publish the verified UK Three Peaks records after country-aware frontend support.

begin;

update public.peaks p
set active = true
from public.mountain_ranges mr
join public.countries c
	on c.id = mr.country_id
where p.range_id = mr.id
	and c.code = 'GB'
	and (p.slug, mr.slug) in (
		('ben-nevis', 'grampian-mountains'),
		('yr-wyddfa', 'eryri-snowdonia'),
		('scafell-pike', 'lake-district')
	)
	and p.is_korona = false
	and p.geom is not null;

do $$
begin
	if (
		select count(*)
		from public.peaks p
		join public.mountain_ranges mr on mr.id = p.range_id
		join public.countries c on c.id = mr.country_id
		join public.regions r on r.id = mr.region_id
		where c.code = 'GB'
			and p.active = true
			and p.is_korona = false
			and p.geom is not null
			and (p.slug, mr.slug, r.slug) in (
				('ben-nevis', 'grampian-mountains', 'scotland'),
				('yr-wyddfa', 'eryri-snowdonia', 'wales'),
				('scafell-pike', 'lake-district', 'england')
			)
	) <> 3 then
		raise exception 'UK Three Peaks could not be activated safely';
	end if;

	if (
		select count(*)
		from public.peaks_i18n pi
		join public.peaks p on p.id = pi.peak_id
		where p.slug in ('ben-nevis', 'yr-wyddfa', 'scafell-pike')
			and p.active = true
			and pi.lang in ('pl', 'en', 'ua', 'zh')
	) <> 12 then
		raise exception 'UK Three Peaks translations are incomplete';
	end if;
end
$$;

commit;
