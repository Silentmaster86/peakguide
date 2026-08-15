-- Add the three mountain areas required for the UK Three Peaks collection.

begin;

insert into public.mountain_ranges (
	slug,
	country_id,
	region_id
)
select
	range_data.slug,
	c.id,
	r.id
from public.countries c
join public.regions r
	on r.country_id = c.id
join (
	values
		('grampian-mountains', 'scotland'),
		('eryri-snowdonia', 'wales'),
		('lake-district', 'england')
) as range_data(slug, region_slug)
	on range_data.region_slug = r.slug
where c.code = 'GB'
on conflict (slug) do update
set
	country_id = excluded.country_id,
	region_id = excluded.region_id;

insert into public.mountain_ranges_i18n (
	range_id,
	lang,
	name,
	description
)
select
	mr.id,
	translations.lang,
	translations.name,
	translations.description
from public.mountain_ranges mr
join public.countries c
	on c.id = mr.country_id
join (
	values
		('grampian-mountains', 'pl', 'Góry Grampian', 'Rozległy system górski w szkockich Highlands, obejmujący Ben Nevis — najwyższy szczyt Wielkiej Brytanii.'),
		('grampian-mountains', 'en', 'Grampian Mountains', 'An extensive mountain system in the Scottish Highlands that includes Ben Nevis, the highest mountain in the United Kingdom.'),
		('grampian-mountains', 'ua', 'Грампіанські гори', 'Велика гірська система в Шотландському нагір’ї, до якої належить Бен-Невіс — найвища вершина Великої Британії.'),
		('grampian-mountains', 'zh', '格兰扁山脉', '苏格兰高地广阔的山系，其中包括英国最高峰本尼维斯山。'),
		('eryri-snowdonia', 'pl', 'Eryri (Snowdonia)', 'Górski obszar w północno-zachodniej Walii, którego najwyższym szczytem jest Yr Wyddfa — najwyższa góra Walii.'),
		('eryri-snowdonia', 'en', 'Eryri (Snowdonia)', 'A mountainous area in north-west Wales whose highest summit is Yr Wyddfa, the highest mountain in Wales.'),
		('eryri-snowdonia', 'ua', 'Ері (Сноудонія)', 'Гірський район на північному заході Уельсу, найвища вершина якого — Yr Wyddfa, найвища гора Уельсу.'),
		('eryri-snowdonia', 'zh', '埃里里（斯诺多尼亚）', '位于威尔士西北部的山区，其最高峰 Yr Wyddfa 也是威尔士最高峰。'),
		('lake-district', 'pl', 'Lake District', 'Górski region w Kumbrii w północno-zachodniej Anglii, obejmujący Scafell Pike — najwyższy szczyt Anglii.'),
		('lake-district', 'en', 'Lake District', 'A mountainous region in Cumbria in north-west England that includes Scafell Pike, the highest mountain in England.'),
		('lake-district', 'ua', 'Озерний край', 'Гірський регіон у Камбрії на північному заході Англії, де розташований Скафелл-Пайк — найвища вершина Англії.'),
		('lake-district', 'zh', '湖区', '英格兰西北部坎布里亚郡的山区，其中包括英格兰最高峰斯科菲峰。')
) as translations(range_slug, lang, name, description)
	on translations.range_slug = mr.slug
where c.code = 'GB'
	and exists (
		select 1
		from public.languages l
		where l.code = translations.lang
	)
on conflict (range_id, lang) do update
set
	name = excluded.name,
	description = excluded.description;

do $$
begin
	if (
		select count(*)
		from public.mountain_ranges mr
		join public.countries c on c.id = mr.country_id
		join public.regions r on r.id = mr.region_id
		where c.code = 'GB'
			and (mr.slug, r.slug) in (
				('grampian-mountains', 'scotland'),
				('eryri-snowdonia', 'wales'),
				('lake-district', 'england')
			)
	) <> 3 then
		raise exception 'UK Three Peaks mountain ranges were not created correctly';
	end if;

	if (
		select count(*)
		from public.mountain_ranges_i18n mri
		join public.mountain_ranges mr on mr.id = mri.range_id
		join public.countries c on c.id = mr.country_id
		where c.code = 'GB'
			and mr.slug in (
				'grampian-mountains',
				'eryri-snowdonia',
				'lake-district'
			)
			and mri.lang in ('pl', 'en', 'ua', 'zh')
	) <> 12 then
		raise exception 'UK Three Peaks mountain range translations were not created correctly';
	end if;
end
$$;

commit;
