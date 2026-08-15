-- Add the United Kingdom and its three Great Britain regions used by PeakGuide.

begin;

insert into public.countries (
	code,
	slug,
	flag_emoji,
	active,
	sort_order
)
values ('GB', 'united-kingdom', '🇬🇧', true, 20)
on conflict (code) do update
set
	slug = excluded.slug,
	flag_emoji = excluded.flag_emoji,
	active = excluded.active,
	sort_order = excluded.sort_order;

insert into public.countries_i18n (
	country_id,
	lang,
	name,
	short_description,
	description,
	seo_title,
	seo_description
)
select
	c.id,
	translations.lang,
	translations.name,
	translations.short_description,
	translations.description,
	translations.seo_title,
	translations.seo_description
from public.countries c
cross join (
	values
		('pl', 'Wielka Brytania', 'Odkrywaj najwyższe szczyty Anglii, Walii i Szkocji.', 'Przewodnik po szczytach, pasmach i górskich wyzwaniach w Anglii, Walii i Szkocji.', 'Góry Wielkiej Brytanii — szczyty i trasy | PeakGuide', 'Odkrywaj góry Anglii, Walii i Szkocji: szczyty, mapy, trasy i praktyczne informacje.'),
		('en', 'United Kingdom', 'Discover the highest peaks of England, Wales and Scotland.', 'A guide to peaks, mountain ranges and hiking challenges across England, Wales and Scotland.', 'UK mountains — peaks and routes | PeakGuide', 'Discover mountains across England, Wales and Scotland, with peaks, maps, routes and practical information.'),
		('ua', 'Велика Британія', 'Відкривайте найвищі вершини Англії, Уельсу та Шотландії.', 'Путівник вершинами, гірськими хребтами та пішохідними викликами Англії, Уельсу й Шотландії.', 'Гори Великої Британії — вершини та маршрути | PeakGuide', 'Відкривайте гори Англії, Уельсу та Шотландії: вершини, карти, маршрути й практична інформація.'),
		('zh', '英国', '探索英格兰、威尔士和苏格兰的最高峰。', '英格兰、威尔士和苏格兰山峰、山脉及徒步挑战指南。', '英国山脉、山峰与路线 | PeakGuide', '探索英格兰、威尔士和苏格兰的山峰、地图、路线及实用信息。')
) as translations(lang, name, short_description, description, seo_title, seo_description)
where c.code = 'GB'
	and exists (
		select 1
		from public.languages l
		where l.code = translations.lang
	)
on conflict (country_id, lang) do update
set
	name = excluded.name,
	short_description = excluded.short_description,
	description = excluded.description,
	seo_title = excluded.seo_title,
	seo_description = excluded.seo_description;

insert into public.regions (
	country_id,
	slug,
	active,
	sort_order
)
select
	c.id,
	region.slug,
	true,
	region.sort_order
from public.countries c
cross join (
	values
		('england', 10),
		('wales', 20),
		('scotland', 30)
) as region(slug, sort_order)
where c.code = 'GB'
on conflict (country_id, slug) do update
set
	active = excluded.active,
	sort_order = excluded.sort_order;

insert into public.regions_i18n (
	region_id,
	lang,
	name,
	description,
	seo_title,
	seo_description
)
select
	r.id,
	translations.lang,
	translations.name,
	translations.description,
	translations.seo_title,
	translations.seo_description
from public.regions r
join public.countries c on c.id = r.country_id
join (
	values
		('england', 'pl', 'Anglia', 'Odkrywaj szczyty i pasma górskie Anglii, od Lake District po pozostałe górskie regiony kraju.', 'Góry Anglii — szczyty i trasy | PeakGuide', 'Poznaj góry Anglii: najwyższe szczyty, mapy, trasy i praktyczne informacje.'),
		('england', 'en', 'England', 'Discover England''s peaks and mountain ranges, from the Lake District to the country''s other upland regions.', 'Mountains in England — peaks and routes | PeakGuide', 'Explore England''s mountains, highest peaks, maps, routes and practical information.'),
		('england', 'ua', 'Англія', 'Відкривайте вершини та гірські хребти Англії — від Озерного краю до інших гірських регіонів країни.', 'Гори Англії — вершини та маршрути | PeakGuide', 'Досліджуйте гори Англії: найвищі вершини, карти, маршрути й практична інформація.'),
		('england', 'zh', '英格兰', '探索英格兰的山峰和山脉，从湖区到该国其他高地。', '英格兰山脉、山峰与路线 | PeakGuide', '探索英格兰山脉、最高峰、地图、路线及实用信息。'),
		('wales', 'pl', 'Walia', 'Odkrywaj walijskie góry, w tym pasma Eryri i najwyższy szczyt Walii — Yr Wyddfa.', 'Góry Walii — szczyty i trasy | PeakGuide', 'Poznaj góry Walii: najwyższe szczyty, mapy, trasy i praktyczne informacje.'),
		('wales', 'en', 'Wales', 'Discover the mountains of Wales, including Eryri and the country''s highest peak, Yr Wyddfa.', 'Mountains in Wales — peaks and routes | PeakGuide', 'Explore the mountains of Wales, with its highest peaks, maps, routes and practical information.'),
		('wales', 'ua', 'Уельс', 'Відкривайте гори Уельсу, зокрема Ері та найвищу вершину країни — Yr Wyddfa.', 'Гори Уельсу — вершини та маршрути | PeakGuide', 'Досліджуйте гори Уельсу: найвищі вершини, карти, маршрути й практична інформація.'),
		('wales', 'zh', '威尔士', '探索威尔士山脉，包括埃里里和威尔士最高峰 Yr Wyddfa。', '威尔士山脉、山峰与路线 | PeakGuide', '探索威尔士山脉、最高峰、地图、路线及实用信息。'),
		('scotland', 'pl', 'Szkocja', 'Odkrywaj góry Szkocji, Highlands i najwyższy szczyt Wielkiej Brytanii — Ben Nevis.', 'Góry Szkocji — szczyty i trasy | PeakGuide', 'Poznaj góry Szkocji: najwyższe szczyty, mapy, trasy i praktyczne informacje.'),
		('scotland', 'en', 'Scotland', 'Discover Scotland''s mountains, the Highlands and the UK''s highest peak, Ben Nevis.', 'Mountains in Scotland — peaks and routes | PeakGuide', 'Explore Scotland''s mountains, highest peaks, maps, routes and practical information.'),
		('scotland', 'ua', 'Шотландія', 'Відкривайте гори Шотландії, Гайлендс і найвищу вершину Великої Британії — Бен-Невіс.', 'Гори Шотландії — вершини та маршрути | PeakGuide', 'Досліджуйте гори Шотландії: найвищі вершини, карти, маршрути й практична інформація.'),
		('scotland', 'zh', '苏格兰', '探索苏格兰山脉、高地以及英国最高峰本尼维斯山。', '苏格兰山脉、山峰与路线 | PeakGuide', '探索苏格兰山脉、最高峰、地图、路线及实用信息。')
) as translations(region_slug, lang, name, description, seo_title, seo_description)
	on translations.region_slug = r.slug
where c.code = 'GB'
	and exists (
		select 1
		from public.languages l
		where l.code = translations.lang
	)
on conflict (region_id, lang) do update
set
	name = excluded.name,
	description = excluded.description,
	seo_title = excluded.seo_title,
	seo_description = excluded.seo_description;

commit;
