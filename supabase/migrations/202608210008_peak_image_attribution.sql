alter table public.peaks
	add column if not exists cover_image_author text,
	add column if not exists cover_image_source_url text,
	add column if not exists cover_image_license text,
	add column if not exists cover_image_license_url text;

comment on column public.peaks.cover_image_author is
	'Photographer or copyright holder displayed beside the peak cover image.';

comment on column public.peaks.cover_image_source_url is
	'Canonical source page for the peak cover image.';

comment on column public.peaks.cover_image_license is
	'Short public license label, for example CC BY-SA 4.0.';

comment on column public.peaks.cover_image_license_url is
	'Canonical URL of the public image license.';

update public.peaks
set
	cover_image_author = 'Doug Sim',
	cover_image_source_url = 'https://commons.wikimedia.org/wiki/File:Scafell_massif.jpg',
	cover_image_license = 'CC BY-SA 4.0',
	cover_image_license_url = 'https://creativecommons.org/licenses/by-sa/4.0/'
where slug = 'scafell-pike';
