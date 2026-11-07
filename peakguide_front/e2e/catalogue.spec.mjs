import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const country = { id: 1, code: 'GB', slug: 'united-kingdom', active: true, countries_i18n: [{ lang: 'en', name: 'United Kingdom' }], regions: [] };
const range = { id: 1, slug: 'grampian-mountains', mountain_ranges_i18n: [{ lang: 'en', name: 'Grampian Mountains' }], countries: country };
const peaks = ['ben-nevis', 'scafell-pike', 'yr-wyddfa'].map((slug, i) => ({ id: i+1, slug, elevation_m: 1345-i*100, active: true, is_korona: false, latitude: null, longitude: null, peaks_i18n: [{ lang: 'en', name: ['Ben Nevis', 'Scafell Pike', 'Yr Wyddfa'][i], description: 'Test catalogue description' }], mountain_ranges: range }));
const trails = ['mountain-track', 'second-trail'].map((slug, i) => ({ id: i+1, slug, peak_id: 1, peaks: peaks[0], active: true, distance_km: 16, time_min: 480, difficulty: 'hard', route_type: 'out-and-back', start_point_name: 'Visitor centre', end_point_name: 'Ben Nevis summit', trails_i18n: [{ lang: 'en', name: ['Mountain Track', 'Second trail'][i] }] }));

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('peakguide_lang', 'en'));
  await page.route('https://test.supabase.co/**', async (route) => {
    const url = new URL(route.request().url());
    const table = url.pathname.split('/').at(-1);
    let data = ({ peaks, countries: [country], mountain_ranges: [{ ...range, peaks }], trails, pois: [], peak_nearby: [], trail_access: null, trail_parking: [] })[table] ?? [];
    const slug = url.searchParams.get('slug');
    if (slug) data = data.find((row) => row.slug === slug.slice(3)) || null;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
  });
});

test('home, catalogue, range, trail, about and account routes render without runtime errors or horizontal overflow', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const path of ['/', '/peaks', '/ranges', '/ranges/grampian-mountains', '/trails', '/peaks/ben-nevis', '/about', '/login', '/register', '/forgot-password', '/reset-password']) {
    await page.goto(path);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  }
  expect(errors).toEqual([]);
});

test('collection is visible, can be reset, and a space survives the search debounce', async ({ page }) => {
  await page.goto('/peaks?collection=three-peaks');
  await expect(page.getByRole('combobox', { name: 'Collection', exact: true })).toHaveValue('three-peaks');
  await page.getByRole('textbox', { name: 'Search', exact: true }).fill('Ben ');
  await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe('Ben ');
  await page.getByRole('textbox', { name: 'Search', exact: true }).pressSequentially('Nevis');
  await expect(page.locator('main').getByRole('link', { name: /Ben Nevis/ })).toHaveCount(1);
  await page.getByRole('button', { name: 'Clear all filters' }).click();
  await expect(page.getByRole('combobox', { name: 'Collection', exact: true })).toHaveValue('all');
  await expect(page).toHaveURL('/peaks');
});

test('a trail link selects and focuses that specific trail', async ({ page }) => {
  await page.goto('/trails');
  await page.getByRole('link', { name: /Second trail/ }).click();
  await expect(page).toHaveURL(/trail=second-trail/);
  await expect(page.locator('#trail-second-trail')).toBeFocused();
  await expect(page.locator('#trail-second-trail')).toContainText('Start and return');
  await expect(page.locator('#trail-second-trail')).toContainText('Destination');
});

test('a missing peak uses the not-found state', async ({ page }) => {
  await page.goto('/peaks/does-not-exist');
  await expect(page.locator('main')).toContainText(/not found/i);
});

test('catalogue error can be retried', async ({ page }) => {
  let failed = true;
  await page.route('**/rest/v1/peaks?**', async (route) => {
    if (failed) await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Test failure' }) });
    else await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(peaks) });
  });
  await page.goto('/peaks');
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
  failed = false;
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.locator('main').getByRole('link', { name: /Ben Nevis/ })).toBeVisible();
});

test('four languages set the correct document language', async ({ page }) => {
  for (const [lang, htmlLang] of [['pl','pl'], ['en','en'], ['ua','uk'], ['zh','zh']]) {
    await page.addInitScript((value) => localStorage.setItem('peakguide_lang', value), lang);
    await page.goto('/peaks');
    await expect(page.locator('html')).toHaveAttribute('lang', htmlLang);
    await expect(page.locator('h1')).toBeVisible();
  }
});

test('language menu supports arrows and Escape with focus restoration', async ({ page }) => {
  await page.goto('/');
  const trigger = page.locator('#desktop-lang-switcher > button');
  if (!await trigger.isVisible()) return; // Tiny layouts use the visible language buttons.
  await trigger.click();
  await page.keyboard.press('End');
  await expect(page.getByRole('option', { name: /中文/ })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(page.getByRole('listbox')).toHaveCount(0);
});

test('catalogue and recovery form have no serious accessibility violations', async ({ page }) => {
  for (const path of ['/peaks', '/forgot-password']) {
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => ['serious','critical'].includes(violation.impact))).toEqual([]);
  }
});

test('theme menu supports keyboard selection and restores focus', async ({ page }) => {
  await page.goto('/peaks');
  const trigger = page.locator('#desktop-theme-switcher > button');
  await trigger.click();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(trigger).toBeFocused();
  await expect(page.locator('h1')).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious','critical'].includes(violation.impact))).toEqual([]);
});

test('main navigation menu supports keyboard focus and Escape', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'More', exact: true });
  await trigger.click();
  await expect(page.getByRole('menu', { name: 'More' })).toBeVisible();
  await page.keyboard.press('End');
  await expect(page.getByRole('menuitem', { name: /FAQ/ })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(page.getByRole('menu')).toHaveCount(0);
});
