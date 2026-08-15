-- Add the summits included in the UK Three Peaks Challenge.

begin;

insert into public.peaks (
	slug,
	range_id,
	elevation_m,
	latitude,
	longitude,
	is_korona,
	active,
	geom
)
select
	peak_data.slug,
	mr.id,
	peak_data.elevation_m,
	peak_data.latitude,
	peak_data.longitude,
	false,
	false,
	st_setsrid(
		st_makepoint(peak_data.longitude, peak_data.latitude),
		4326
	)::geography
from public.mountain_ranges mr
join public.countries c
	on c.id = mr.country_id
join (
	values
		('ben-nevis', 'grampian-mountains', 1345, 56.796850::numeric, -5.003508::numeric),
		('yr-wyddfa', 'eryri-snowdonia', 1085, 53.068490::numeric, -4.076280::numeric),
		('scafell-pike', 'lake-district', 978, 54.454263::numeric, -3.211603::numeric)
) as peak_data(slug, range_slug, elevation_m, latitude, longitude)
	on peak_data.range_slug = mr.slug
where c.code = 'GB'
on conflict (slug) do update
set
	range_id = excluded.range_id,
	elevation_m = excluded.elevation_m,
	latitude = excluded.latitude,
	longitude = excluded.longitude,
	is_korona = excluded.is_korona,
	geom = excluded.geom;

insert into public.peaks_i18n (
	peak_id,
	lang,
	name,
	short_description,
	description,
	tips
)
select
	p.id,
	translations.lang,
	translations.name,
	translations.short_description,
	translations.description,
	translations.tips
from public.peaks p
join (
	values
		(
			'ben-nevis',
			'pl',
			'Ben Nevis',
			'Najwyższy szczyt Szkocji i całej Wielkiej Brytanii, wznoszący się na 1345 m n.p.m.',
			'Ben Nevis leży w zachodniej części szkockich Highlands, w pobliżu Fort William. Jest najwyższym z trzech szczytów UK Three Peaks Challenge i słynie z surowego, szybko zmieniającego się górskiego klimatu.',
			'Przed wyjściem sprawdź prognozę górską, zabierz mapę i kompas oraz przygotuj się na znacznie chłodniejsze, mokre i wietrzne warunki na szczycie.'
		),
		(
			'ben-nevis',
			'en',
			'Ben Nevis',
			'The highest mountain in Scotland and the United Kingdom, rising to 1,345 metres.',
			'Ben Nevis stands in the western Scottish Highlands near Fort William. It is the highest of the UK Three Peaks Challenge summits and is known for severe, rapidly changing mountain weather.',
			'Check a mountain forecast, carry a map and compass, and be ready for conditions on the summit to be much colder, wetter and windier than in the valley.'
		),
		(
			'ben-nevis',
			'ua',
			'Бен-Невіс',
			'Найвища гора Шотландії та всієї Великої Британії заввишки 1345 метрів.',
			'Бен-Невіс розташований у західній частині Шотландського нагір’я поблизу Форт-Вільяма. Це найвища з трьох вершин UK Three Peaks Challenge, відома суворою та мінливою гірською погодою.',
			'Перевірте гірський прогноз, візьміть мапу й компас та будьте готові до значно холодніших, вологіших і вітряніших умов на вершині.'
		),
		(
			'ben-nevis',
			'zh',
			'本尼维斯山',
			'苏格兰及全英国最高峰，海拔1345米。',
			'本尼维斯山位于威廉堡附近的苏格兰西部高地，是英国三峰挑战中最高的一座山峰，以严酷且快速变化的山区天气而闻名。',
			'出发前请查看山区天气预报，携带地图和指南针，并为峰顶更寒冷、潮湿和多风的环境做好准备。'
		),
		(
			'yr-wyddfa',
			'pl',
			'Yr Wyddfa',
			'Najwyższy szczyt Walii, znany również jako Snowdon, osiągający 1085 m n.p.m.',
			'Yr Wyddfa znajduje się w sercu Eryri w północno-zachodniej Walii. Jest walijskim szczytem UK Three Peaks Challenge, a na jego wierzchołek prowadzi kilka tras o różnym charakterze.',
			'Wybierz trasę odpowiednią do doświadczenia, sprawdź pogodę i przygotuj się na mgłę, silny wiatr oraz dużą liczbę turystów w popularnych terminach.'
		),
		(
			'yr-wyddfa',
			'en',
			'Yr Wyddfa',
			'The highest mountain in Wales, also known as Snowdon, reaching 1,085 metres.',
			'Yr Wyddfa stands at the heart of Eryri in north-west Wales. It is the Welsh summit of the UK Three Peaks Challenge, with several routes of different character leading to the top.',
			'Choose a route suitable for your experience, check the weather, and prepare for mist, strong winds and busy paths at popular times.'
		),
		(
			'yr-wyddfa',
			'ua',
			'Yr Wyddfa',
			'Найвища гора Уельсу, також відома як Сноудон, заввишки 1085 метрів.',
			'Yr Wyddfa розташована в серці Ері на північному заході Уельсу. Це валлійська вершина UK Three Peaks Challenge, до якої ведуть кілька маршрутів різного характеру.',
			'Оберіть маршрут відповідно до свого досвіду, перевірте погоду та підготуйтеся до туману, сильного вітру й людних стежок у популярний час.'
		),
		(
			'yr-wyddfa',
			'zh',
			'斯诺登山（Yr Wyddfa）',
			'威尔士最高峰，又称斯诺登山，海拔1085米。',
			'Yr Wyddfa 位于威尔士西北部埃里里中心，是英国三峰挑战中的威尔士山峰，有多条各具特色的路线通往峰顶。',
			'请选择符合自身经验的路线，查看天气，并为雾、强风以及热门时段拥挤的山路做好准备。'
		),
		(
			'scafell-pike',
			'pl',
			'Scafell Pike',
			'Najwyższy szczyt Anglii, położony w Lake District i osiągający 978 m n.p.m.',
			'Scafell Pike wznosi się w surowej, skalistej części Lake District. Jest angielskim szczytem UK Three Peaks Challenge, a kamienisty teren i słaba widoczność mogą utrudniać nawigację.',
			'Zabierz mapę i kompas, nie polegaj wyłącznie na telefonie i przygotuj się na kamieniste podłoże, deszcz, wiatr oraz nagłe pogorszenie widoczności.'
		),
		(
			'scafell-pike',
			'en',
			'Scafell Pike',
			'England’s highest mountain, standing at 978 metres in the Lake District.',
			'Scafell Pike rises in a rugged, rocky part of the Lake District. It is the English summit of the UK Three Peaks Challenge, where rough ground and poor visibility can make navigation difficult.',
			'Carry a map and compass, do not rely only on a phone, and prepare for rocky terrain, rain, wind and rapidly reduced visibility.'
		),
		(
			'scafell-pike',
			'ua',
			'Скафелл-Пайк',
			'Найвища гора Англії, розташована в Озерному краї, заввишки 978 метрів.',
			'Скафелл-Пайк височіє в суворій скелястій частині Озерного краю. Це англійська вершина UK Three Peaks Challenge, де нерівний рельєф і погана видимість можуть ускладнювати навігацію.',
			'Візьміть мапу й компас, не покладайтеся лише на телефон та підготуйтеся до кам’янистої місцевості, дощу, вітру й раптового погіршення видимості.'
		),
		(
			'scafell-pike',
			'zh',
			'斯科菲峰',
			'英格兰最高峰，位于湖区，海拔978米。',
			'斯科菲峰坐落于湖区崎岖多岩的山区，是英国三峰挑战中的英格兰山峰；崎岖地形和低能见度可能增加导航难度。',
			'请携带地图和指南针，不要只依赖手机，并为多岩地形、降雨、强风和能见度突然下降做好准备。'
		)
) as translations(
	peak_slug,
	lang,
	name,
	short_description,
	description,
	tips
)
	on translations.peak_slug = p.slug
where exists (
	select 1
	from public.languages l
	where l.code = translations.lang
)
on conflict (peak_id, lang) do update
set
	name = excluded.name,
	short_description = excluded.short_description,
	description = excluded.description,
	tips = excluded.tips;

do $$
begin
	if (
		select count(*)
		from public.peaks p
		join public.mountain_ranges mr on mr.id = p.range_id
		join public.countries c on c.id = mr.country_id
		where c.code = 'GB'
			and (p.slug, mr.slug) in (
				('ben-nevis', 'grampian-mountains'),
				('yr-wyddfa', 'eryri-snowdonia'),
				('scafell-pike', 'lake-district')
			)
			and p.is_korona = false
			and p.geom is not null
	) <> 3 then
		raise exception 'UK Three Peaks summits were not created correctly';
	end if;

	if (
		select count(*)
		from public.peaks_i18n pi
		join public.peaks p on p.id = pi.peak_id
		join public.mountain_ranges mr on mr.id = p.range_id
		join public.countries c on c.id = mr.country_id
		where c.code = 'GB'
			and p.slug in ('ben-nevis', 'yr-wyddfa', 'scafell-pike')
			and pi.lang in ('pl', 'en', 'ua', 'zh')
	) <> 12 then
		raise exception 'UK Three Peaks translations were not created correctly';
	end if;
end
$$;

commit;
