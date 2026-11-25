import { test, expect } from '@playwright/test';

const languages = ['pl', 'en', 'ua', 'zh'];
const i18n = name => languages.map(lang => ({ lang, name, description: 'Mountain description. '.repeat(250) }));
const peak = { id: 1, slug: 'test-peak', active: true, elevation_m: 1000, latitude: null, longitude: null, peaks_i18n: i18n('Test peak'), mountain_ranges: { slug: 'test-range', mountain_ranges_i18n: i18n('Test range'), countries: { code: 'PL', countries_i18n: i18n('Poland') } } };
const trails = [{ id: 1, slug: 'test-route', peak_id: 1, active: true, trails_i18n: i18n('Test route'), peaks: peak }];
const trailLabels = { pl: 'Szlaki', en: 'Trails', ua: 'Маршрути', zh: '路线' };

test.beforeEach(async ({ page }) => {
  await page.route('https://test.supabase.co/**', route => {
    const url = new URL(route.request().url());
    const table = url.pathname.split('/').at(-1);
    return route.fulfill({ json: table === 'peaks' && url.searchParams.has('slug') ? peak : table === 'trails' ? trails : [] });
  });
});

for (const lang of languages) test(`detail tabs remain below the navbar and clickable: ${lang}`, async ({ page }, info) => {
  await page.addInitScript(lang => localStorage.setItem('peakguide_lang', lang), lang);
  await page.goto('/peaks/test-peak');
  const nav = page.locator('#main-nav');
  const tabs = page.locator('.peak-detail-tabs');
  await expect(tabs).toBeVisible();
  const scrollPastTabs = await page.locator('.peak-detail-tabs').evaluate(el => el.getBoundingClientRect().top + scrollY + 200);
  await page.mouse.move(100,400);
  await page.mouse.wheel(0,scrollPastTabs);
  await expect.poll(async () => {
    const n = await nav.boundingBox(), t = await tabs.boundingBox();
    return Math.abs(t.y - (n.y + n.height + 10));
  }).toBeLessThan(2);
  if (info.project.name === 'desktop') {
    const side = await page.locator('main aside').boundingBox();
    const t = await tabs.boundingBox();
    expect(side.y).toBeGreaterThanOrEqual(t.y + t.height);
  }
  await tabs.getByRole('button', { name: new RegExp(`^${trailLabels[lang]}`) }).click();
  await expect(page).toHaveURL(/tab=trails/);
  await expect(page.locator('#trail-test-route')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('320px header resizing keeps a linked trail below both sticky bars', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.addInitScript(() => localStorage.setItem('peakguide_lang', 'en'));
  await page.goto('/peaks/test-peak?tab=trails&trail=test-route');
  const trail = page.locator('#trail-test-route');
  await expect(trail).toBeFocused();
  await expect.poll(async () => {
    const t = await page.locator('.peak-detail-tabs').boundingBox();
    return Math.abs((await trail.boundingBox()).y - (t.y + t.height + 18));
  }).toBeLessThan(3);
  await page.setViewportSize({ width: 700, height: 800 });
  const scrollPastTabs = await page.locator('.peak-detail-tabs').evaluate(el => el.getBoundingClientRect().top + scrollY + 200);
  await page.mouse.move(100,400);
  await page.mouse.wheel(0,scrollPastTabs);
  await expect.poll(async () => {
    const n = await page.locator('#main-nav').boundingBox(), t = await page.locator('.peak-detail-tabs').boundingBox();
    return Math.abs(t.y - (n.y + n.height + 10));
  }).toBeLessThan(2);
});
