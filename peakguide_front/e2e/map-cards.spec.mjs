import { test, expect } from '@playwright/test';
import { catalogueLabels } from '../src/features/adminCatalogue/labels.js';

const languages = ['pl', 'en', 'ua', 'zh'];
const i18n = name => languages.map(lang => ({ lang, name, short_description: 'A mountain in the catalogue.' }));
const range = { slug: 'test-range', mountain_ranges_i18n: i18n('Test range'), countries: { code: 'PL', slug: 'poland', countries_i18n: i18n('Poland') } };
const peaks = [
  { id: 1, slug: 'test-peak', active: true, elevation_m: 1200, latitude: 50, longitude: 19, mountain_ranges: range, peaks_i18n: i18n('Test peak') },
  { id: 2, slug: 'other-peak', active: true, elevation_m: 900, latitude: 52, longitude: 21, mountain_ranges: range, peaks_i18n: i18n('Other peak') },
  { id: 3, slug: 'unlocated', active: true, elevation_m: null, latitude: null, longitude: null, mountain_ranges: range, peaks_i18n: i18n('Unlocated peak') },
];
const pois = ['parking', 'shelter', 'trailhead', 'viewpoint', 'spring'].map((slug, index) => ({
  id: index + 1, slug, peak_id: 1, active: true, latitude: 50 + index * .001, longitude: 19 + index * .001,
  poi_types: { slug }, pois_i18n: i18n(`${slug} point`), peaks: peaks[0],
}));
const trails = [{ id: 1, slug: 'test-route', peak_id: 1, active: true, distance_km: 4.5, time_min: 95, elevation_gain_m: 300, trails_i18n: i18n('Test route'), peaks: peaks[0] }];
const layers = { pl: 'Warstwy mapy', en: 'Map layers', ua: 'Шари мапи', zh: '地图图层' };
const missing = { pl: 'Brak lokalizacji na mapie', en: 'Map location unavailable', ua: 'Розташування на мапі недоступне', zh: '暂无地图位置' };

test.beforeEach(async ({ page }) => {
  await page.route('https://test.supabase.co/**', async route => {
    const url = new URL(route.request().url());
    const table = url.pathname.split('/').at(-1);
    let data = ({ peaks, pois, trails, peak_nearby: [], trail_parking: [], trail_access: null })[table] ?? [];
    if (url.searchParams.has('slug')) data = data.find(row => row.slug === url.searchParams.get('slug').slice(3)) || null;
    await route.fulfill({ json: data });
  });
  await page.route('**.tile.openstreetmap.org/**', route => route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64') }));
});

for (const lang of languages) test(`map cards and shared detail pictograms: ${lang}`, async ({ page }) => {
  const t = catalogueLabels(lang);
  await page.addInitScript(lang => {
    localStorage.setItem('peakguide_lang', lang);
    localStorage.setItem('ui_theme_mode', ['pl', 'ua'].includes(lang) ? 'light' : 'dark');
  }, lang);
  await page.goto('/map');
  await expect(page.locator('.pg-map-result')).toHaveCount(3);
  const unlocated = page.locator('.pg-map-result').filter({ has: page.getByRole('link', { name: 'Unlocated peak', exact: true }) });
  await expect(unlocated).toContainText(missing[lang]);
  await expect(unlocated.locator('.pg-map-result-altitude')).toHaveCount(0);
  await page.getByRole('button', { name: layers[lang], exact: true }).click();
  await page.getByRole('checkbox', { name: t.pois, exact: true }).check();
  await expect(page.getByRole('list', { name: t.pois, exact: true }).locator('.pg-map-result')).toHaveCount(5);
  await page.getByRole('checkbox', { name: t.routeLayer, exact: true }).check();
  const route = page.getByRole('list', { name: t.trails, exact: true });
  await expect(route).toContainText('300 m');
  await expect(route.getByRole('link', { name: 'Test route', exact: true })).toHaveAttribute('href', '/peaks/test-peak?tab=trails&trail=test-route');
  await page.locator('.pg-map-result').getByRole('link', { name: 'Test peak', exact: true }).click();
  await expect(page).toHaveURL('/peaks/test-peak');
  for (const kind of ['peak', 'parking', 'shelter', 'trailhead', 'viewpoint', 'poi']) {
    await expect(page.locator(`.leaflet-marker-icon.pg-map-marker--${kind}`)).toHaveCount(1);
  }
  const parking = page.locator('.pg-map-marker--parking');
  await parking.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.leaflet-popup')).toContainText('parking point');
  await expect(page.locator('.leaflet-popup').getByRole('link')).toHaveAttribute('href', /google\.com\/maps/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('320px cards keep links and unavailable locations readable', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.addInitScript(() => localStorage.setItem('peakguide_lang', 'en'));
  await page.goto('/map');
  const link = page.locator('.pg-map-result').getByRole('link', { name: 'Unlocated peak', exact: true });
  await link.scrollIntoViewIfNeeded();
  await expect(link).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await link.click();
  await expect(page).toHaveURL('/peaks/unlocated');
});
