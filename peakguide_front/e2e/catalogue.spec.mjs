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

for (const lang of ['pl','en','ua','zh']) {
  test(`home discovery link has readable text in light and dark themes (${lang})`, async ({ page }) => {
    for (const mode of ['light','dark']) {
      await page.addInitScript(({lang,mode}) => {
        localStorage.setItem('peakguide_lang', lang);
        localStorage.setItem('ui_theme_mode', mode);
      }, {lang,mode});
      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('data-theme', mode);
      const link = page.locator('.home-hero-actions > a[href="/peaks"]');
      await expect(link).toBeVisible();
      const contrast = await link.evaluate(element => {
        const style = getComputedStyle(element);
        const luminance = color => color.match(/[\d.]+/g).slice(0,3).map(Number)
          .map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
          .reduce((sum,value,index) => sum + value * [.2126,.7152,.0722][index], 0);
        const a=luminance(style.color),b=luminance(style.backgroundColor);
        return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
      });
      expect(contrast, `${lang}/${mode} discovery link contrast`).toBeGreaterThanOrEqual(4.5);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1)).toBe(true);
    }
  });
}

test('home discovery link supports system theme and keyboard navigation', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('peakguide_lang','en'); localStorage.setItem('ui_theme_mode','system'); });
  for (const colorScheme of ['light','dark']) {
    await page.emulateMedia({colorScheme});
    await page.goto('/');
    await expect(page.locator('.home-hero-actions > a[href="/peaks"]')).toBeVisible();
    const results=await new AxeBuilder({page}).include('.home-hero-actions').withRules(['color-contrast']).analyze();
    expect(results.violations).toEqual([]);
  }
  const link=page.locator('.home-hero-actions > a[href="/peaks"]');
  await link.focus();await expect(link).toBeFocused();await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/peaks');
});

test('range names follow the page heading without skipping a level', async ({ page }) => {
  await page.goto('/ranges');
  await expect(page.getByRole('heading',{level:2,name:'Grampian Mountains',exact:true})).toBeVisible();
  const results=await new AxeBuilder({page}).include('main').withRules(['heading-order']).analyze();
  expect(results.violations).toEqual([]);
});

test('trail cards omit unavailable metadata and retain the trail deep link', async ({ page }) => {
  await page.route('**/rest/v1/trails?**', route => route.fulfill({
    json: [{...trails[0],difficulty:null,route_type:null},trails[1]],
  }));
  await page.goto('/trails');
  const card = page.getByRole('link', {name:/Mountain Track/});
  await expect(card.locator('p').first()).toHaveText('United Kingdom · Grampian Mountains');
  await expect(card).not.toContainText('Route:');
  for (const pill of await card.locator('span').all()) await expect(pill).not.toHaveText('');
  await expect(page.getByRole('link',{name:/Second trail/})).toContainText('hard');
  await card.click();
  await expect(page).toHaveURL(/trail=mountain-track/);
  await expect(page.locator('#trail-mountain-track')).toBeFocused();
});

test('unknown pages, peaks and ranges have localized recovery and noindex metadata', async ({page}) => {
  // Four language navigations, accessibility scans and recovery links share this test budget.
  test.setTimeout(60000);
  for(const [lang,title,home] of [
    ['pl','Nie znaleziono strony','Strona główna'],
    ['en','Page not found','Home'],
    ['ua','Сторінку не знайдено','Головна'],
    ['zh','未找到页面','首页'],
  ]) {
    await page.addInitScript(value=>localStorage.setItem('peakguide_lang',value),lang);
    await page.goto('/missing-page-review');
    await expect(page.getByRole('heading',{level:1,name:title})).toBeVisible();
    await expect(page).toHaveTitle(new RegExp('404'));
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','noindex,follow');
    const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
    expect(audit.violations).toEqual([]);
    await page.getByRole('link',{name:home,exact:true}).click();
    await expect(page).toHaveURL('/');
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    await expect(page).not.toHaveTitle(/404/);
  }
  await page.addInitScript(()=>localStorage.setItem('peakguide_lang','en'));
  for(const [route,title,collection] of [
    ['/peaks/does-not-exist','Peak not found','/peaks'],
    ['/ranges/does-not-exist','Range not found','/ranges'],
  ]) {
    await page.goto(route);
    await expect(page.getByRole('heading',{level:1,name:title})).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','noindex,follow');
    await page.locator('main').getByRole('link',{name:/Browse/}).click();
    await expect(page).toHaveURL(collection);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  }
});


test('Ukrainian and Chinese detail metadata use the selected language',async({page})=>{
 for(const [lang,peakMarker,rangeMarker] of [['ua','вершину','Гірський хребет'],['zh','海拔','山脉']]){
  await page.addInitScript(value=>localStorage.setItem('peakguide_lang',value),lang);
  await page.goto('/peaks/ben-nevis');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content',new RegExp(peakMarker));
  await page.goto('/ranges/grampian-mountains');
  await expect(page).toHaveTitle(new RegExp(rangeMarker));
 }
});
