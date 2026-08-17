begin;

-- UK Three Peaks: one standard out-and-back route for each summit.
-- Route data checked against Mountaineering Scotland, Eryri National Park,
-- the National Trust and the National Three Peaks route references.

create temporary table _uk_trail_seed (
  peak_slug text not null,
  slug text not null,
  start_point_name text,
  end_point_name text,
  distance_km numeric,
  elevation_gain_m integer,
  time_min integer,
  difficulty text,
  route_type text,
  gpx_url text,
  map_url text,
  active boolean not null
) on commit drop;

insert into _uk_trail_seed (
  peak_slug,
  slug,
  start_point_name,
  end_point_name,
  distance_km,
  elevation_gain_m,
  time_min,
  difficulty,
  route_type,
  gpx_url,
  map_url,
  active
)
values
  (
    'ben-nevis',
    'ben-nevis-mountain-track',
    'Glen Nevis Visitor Centre',
    'Ben Nevis summit',
    17.0,
    1352,
    480,
    'hard',
    'out-and-back',
    null,
    'https://www.mountaineering.scot/activities/hillwalking/ben-nevis',
    true
  ),
  (
    'yr-wyddfa',
    'yr-wyddfa-llanberis-path',
    'Far end of Victoria Terrace, Llanberis',
    'Yr Wyddfa summit',
    14.5,
    975,
    420,
    'hard',
    'out-and-back',
    null,
    'https://eryri.gov.wales/walk/llanberis-path/',
    true
  ),
  (
    'scafell-pike',
    'scafell-pike-hollow-stones',
    'Lake Head National Trust car park, Wasdale',
    'Scafell Pike summit',
    10.0,
    989,
    300,
    'hard',
    'out-and-back',
    null,
    'https://www.nationaltrust.org.uk/visit/lake-district/wasdale/scafell-pike-via-hollow-stones-route',
    true
  );

do $$
declare
  matched_peaks integer;
begin
  select count(*)
  into matched_peaks
  from _uk_trail_seed seed
  join public.peaks peak
    on peak.slug = seed.peak_slug;

  if matched_peaks <> 3 then
    raise exception
      'Expected all 3 UK Three Peaks before adding trails, found %',
      matched_peaks;
  end if;
end
$$;

insert into public.trails (
  peak_id,
  slug,
  start_point_name,
  end_point_name,
  distance_km,
  elevation_gain_m,
  time_min,
  difficulty,
  route_type,
  gpx_url,
  map_url,
  active
)
select
  peak.id,
  seed.slug,
  seed.start_point_name,
  seed.end_point_name,
  seed.distance_km,
  seed.elevation_gain_m,
  seed.time_min,
  seed.difficulty,
  seed.route_type,
  seed.gpx_url,
  seed.map_url,
  seed.active
from _uk_trail_seed seed
join public.peaks peak
  on peak.slug = seed.peak_slug
where not exists (
  select 1
  from public.trails trail
  where trail.peak_id = peak.id
    and trail.slug = seed.slug
);

-- Keep verified route facts current when this migration is run again, while
-- preserving any GPX link that may be added later in the admin panel.
update public.trails trail
set
  start_point_name = seed.start_point_name,
  end_point_name = seed.end_point_name,
  distance_km = seed.distance_km,
  elevation_gain_m = seed.elevation_gain_m,
  time_min = seed.time_min,
  difficulty = seed.difficulty,
  route_type = seed.route_type,
  map_url = seed.map_url,
  active = seed.active
from _uk_trail_seed seed
join public.peaks peak
  on peak.slug = seed.peak_slug
where trail.peak_id = peak.id
  and trail.slug = seed.slug;

create temporary table _uk_trail_i18n_seed (
  trail_slug text not null,
  lang varchar not null,
  name text not null,
  description text,
  notes text
) on commit drop;

insert into _uk_trail_i18n_seed (trail_slug, lang, name, description, notes)
values
  (
    'ben-nevis-mountain-track',
    'en',
    'Ben Nevis via the Mountain Track',
    'The standard route from Glen Nevis climbs steadily to the summit plateau and returns by the same path. It is the most straightforward ascent of Ben Nevis, but remains a long and demanding mountain day.',
    'Times are approximate. Check the mountain forecast and current ground conditions before setting out. Carry suitable clothing, a map and compass, and the skills to navigate in poor visibility. Winter conditions may require specialist equipment and experience.'
  ),
  (
    'ben-nevis-mountain-track',
    'pl',
    'Ben Nevis szlakiem Mountain Track',
    'Standardowa trasa z Glen Nevis prowadzi długim podejściem na płaskowyż szczytowy i wraca tą samą drogą. Jest to najprostsze popularne wejście na Ben Nevis, ale nadal stanowi wymagającą całodzienną wycieczkę górską.',
    'Czas jest orientacyjny. Przed wyjściem sprawdź prognozę górską i aktualne warunki. Zabierz odpowiednią odzież, mapę i kompas oraz przygotuj się do nawigacji przy słabej widoczności. Zimą mogą być potrzebne specjalistyczne umiejętności i wyposażenie.'
  ),
  (
    'ben-nevis-mountain-track',
    'ua',
    'Бен-Невіс маршрутом Mountain Track',
    'Стандартний маршрут із Глен-Невіс поступово піднімається на вершинне плато й повертається тією самою стежкою. Це найпростіший популярний підйом на Бен-Невіс, але він усе одно є довгим і складним гірським походом.',
    'Час орієнтовний. Перед виходом перевірте гірський прогноз і стан маршруту. Візьміть відповідний одяг, карту й компас та будьте готові орієнтуватися за поганої видимості. Узимку потрібні спеціальні навички й спорядження.'
  ),
  (
    'ben-nevis-mountain-track',
    'zh',
    '经 Mountain Track 登本尼维斯山',
    '这条标准路线从格伦尼维斯出发，持续爬升至山顶高原，并沿原路返回。它是登顶本尼维斯山最直接的常用路线，但仍是漫长且高强度的高山徒步。',
    '时间仅供参考。出发前请查看山区天气和地面状况，携带合适衣物、地图和指南针，并具备低能见度下的导航能力。冬季可能需要专业技能和装备。'
  ),
  (
    'yr-wyddfa-llanberis-path',
    'en',
    'Yr Wyddfa via the Llanberis Path',
    'The longest and most gradual of the six main routes to Yr Wyddfa follows the mountain railway for much of the ascent before reaching the summit and returning the same way.',
    'The National Park grades this route Hard/Strenuous. Do not walk on the railway tracks. Check the weather and ground conditions, carry full hill-walking equipment, and be ready to navigate in poor visibility.'
  ),
  (
    'yr-wyddfa-llanberis-path',
    'pl',
    'Yr Wyddfa szlakiem Llanberis Path',
    'Najdłuższa i najbardziej stopniowa z sześciu głównych tras na Yr Wyddfa przez dużą część podejścia biegnie w pobliżu kolejki górskiej, następnie dociera na szczyt i wraca tą samą drogą.',
    'Park Narodowy klasyfikuje trasę jako trudną i wymagającą. Nie wchodź na tory kolejki. Sprawdź pogodę i warunki, zabierz pełne wyposażenie górskie i przygotuj się do nawigacji przy słabej widoczności.'
  ),
  (
    'yr-wyddfa-llanberis-path',
    'ua',
    'Yr Wyddfa маршрутом Llanberis Path',
    'Найдовший і найпоступовіший із шести основних маршрутів на Yr Wyddfa значну частину підйому проходить біля гірської залізниці, веде на вершину та повертається тією самою стежкою.',
    'Національний парк оцінює маршрут як складний і виснажливий. Не виходьте на залізничні колії. Перевірте погоду й стан маршруту, візьміть повне гірське спорядження та будьте готові до навігації за поганої видимості.'
  ),
  (
    'yr-wyddfa-llanberis-path',
    'zh',
    '经 Llanberis Path 登 Yr Wyddfa',
    '这是通往 Yr Wyddfa 山顶的六条主要路线中最长、坡度最缓的一条。大部分上升路段靠近登山铁路，到达山顶后沿原路返回。',
    '国家公园将此路线评为困难且高强度。请勿进入铁路轨道。出发前查看天气和地面状况，携带完整徒步装备，并做好低能见度下导航的准备。'
  ),
  (
    'scafell-pike-hollow-stones',
    'en',
    'Scafell Pike via Hollow Stones',
    'The direct route from Lake Head car park in Wasdale climbs beside Lingmell Gill, crosses rough and rocky ground at Hollow Stones, and reaches the summit before returning by the same line.',
    'This is a tough, steep route over rugged terrain. Paths are not reliably waymarked and the summit plateau can be confusing in mist. Bring a detailed map and compass, check the mountain forecast, and turn back if conditions exceed your experience.'
  ),
  (
    'scafell-pike-hollow-stones',
    'pl',
    'Scafell Pike przez Hollow Stones',
    'Bezpośrednia trasa z parkingu Lake Head w Wasdale prowadzi obok Lingmell Gill, przez kamienisty teren Hollow Stones, następnie na szczyt i wraca tą samą drogą.',
    'To stroma i wymagająca trasa po nierównym, skalistym terenie. Szlaki nie zawsze są oznakowane, a płaskowyż szczytowy łatwo pomylić we mgle. Zabierz dokładną mapę i kompas, sprawdź prognozę górską i zawróć, jeśli warunki przekraczają Twoje doświadczenie.'
  ),
  (
    'scafell-pike-hollow-stones',
    'ua',
    'Скафелл-Пайк через Hollow Stones',
    'Прямий маршрут від автостоянки Lake Head у Wasdale піднімається вздовж Lingmell Gill, перетинає кам’янисту місцевість Hollow Stones, виходить на вершину й повертається тим самим шляхом.',
    'Це крутий і складний маршрут нерівною скелястою місцевістю. Стежки не всюди позначені, а на вершинному плато легко втратити напрямок у тумані. Візьміть детальну карту й компас, перевірте прогноз і поверніться, якщо умови перевищують ваш досвід.'
  ),
  (
    'scafell-pike-hollow-stones',
    'zh',
    '经 Hollow Stones 登斯科菲峰',
    '这条直接路线从沃斯代尔的 Lake Head 停车场出发，沿 Lingmell Gill 上升，穿过 Hollow Stones 的崎岖岩石地形，到达山顶后沿原路返回。',
    '路线陡峭且地形崎岖。山路并非处处有标记，雾中山顶高原容易迷失方向。请携带详细地图和指南针，查看山区天气；如果状况超出自身经验，应及时折返。'
  );

insert into public.trails_i18n (trail_id, lang, name, description, notes)
select
  trail.id,
  seed.lang,
  seed.name,
  seed.description,
  seed.notes
from _uk_trail_i18n_seed seed
join public.trails trail
  on trail.slug = seed.trail_slug
where not exists (
  select 1
  from public.trails_i18n translation
  where translation.trail_id = trail.id
    and translation.lang = seed.lang
);

do $$
declare
  trail_count integer;
  translation_count integer;
begin
  select count(*)
  into trail_count
  from public.trails trail
  join public.peaks peak
    on peak.id = trail.peak_id
  join _uk_trail_seed seed
    on seed.peak_slug = peak.slug
   and seed.slug = trail.slug
  where trail.active = true
    and trail.map_url is not null;

  select count(*)
  into translation_count
  from public.trails_i18n translation
  join public.trails trail
    on trail.id = translation.trail_id
  join _uk_trail_i18n_seed seed
    on seed.trail_slug = trail.slug
   and seed.lang = translation.lang;

  if trail_count <> 3 then
    raise exception 'Expected 3 active UK Three Peaks trails, found %', trail_count;
  end if;

  if translation_count <> 12 then
    raise exception 'Expected 12 UK trail translations, found %', translation_count;
  end if;
end
$$;

commit;
