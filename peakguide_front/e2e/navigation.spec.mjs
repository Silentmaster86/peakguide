import {test,expect} from '@playwright/test';
const langs=['pl','en','ua','zh'];
const more={pl:'Więcej',en:'More',ua:'Більше',zh:'更多'};
const peaks=Array.from({length:12},(_,i)=>({id:i+1,slug:`peak-${i+1}`,active:true,is_korona:true,elevation_m:1000+i,latitude:50+i*.01,longitude:19+i*.01,peaks_i18n:langs.map(lang=>({lang,name:`Peak ${i+1}`,description:'Navigation fixture'})),mountain_ranges:{slug:'test-range',mountain_ranges_i18n:langs.map(lang=>({lang,name:'Test range'})),countries:{slug:'poland',code:'PL',countries_i18n:langs.map(lang=>({lang,name:'Poland'}))}}}));
test.beforeEach(async({page})=>{
 await page.route('https://test.supabase.co/**',async route=>{
  const u=new URL(route.request().url());let data=u.pathname.endsWith('/peaks')?peaks:[];
  if(u.searchParams.has('slug'))data=data.find(p=>p.slug===u.searchParams.get('slug').slice(3))??null;
  await route.fulfill({json:data});
 });
 await page.route('**.tile.openstreetmap.org/**',r=>r.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')}));
});
for(const lang of langs)test(`sticky header, map starts at top and Back restores homepage: ${lang}`,async({page},info)=>{
 await page.addInitScript(lang=>{localStorage.setItem('peakguide_lang',lang);localStorage.setItem('ui_theme_mode',['pl','ua'].includes(lang)?'light':'dark');},lang);
 await page.goto('/');
 await expect(page.locator('.featured-peak-card:not(.featured-peak-skeleton)').first()).toBeVisible();
 const link=page.locator('.map-teaser-button');await link.scrollIntoViewIfNeeded();
 await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(500);
 const nav=page.locator('#main-nav');await expect.poll(async()=>Math.abs((await nav.boundingBox()).y)).toBeLessThan(2);
 if(info.project.name==='mobile')expect((await nav.boundingBox()).height).toBeLessThan(140);
 const before=await page.evaluate(()=>scrollY);
 await link.click();await expect(page).toHaveURL('/map');
 await expect(page.locator('.explore-map-canvas')).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>scrollY)).toBeLessThan(3);
 await page.goBack();await expect(page).toHaveURL('/');
 await expect(page.locator('.featured-peak-card:not(.featured-peak-skeleton)').first()).toBeVisible();
 await expect.poll(async()=>Math.abs((await page.evaluate(()=>scrollY))-before)).toBeLessThan(5);
 await page.goForward();await expect(page).toHaveURL('/map');
 await expect.poll(()=>page.evaluate(()=>scrollY)).toBeLessThan(3);
 await expect(nav.getByRole('button',{name:more[lang],exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('direct anchor respects sticky header and dropdown uses same-document routing',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('peakguide_lang','en'));
 await page.goto('/#featured');await expect(page.locator('#featured')).toBeVisible();
 await expect.poll(async()=>{const target=await page.locator('#featured').boundingBox();const nav=await page.locator('#main-nav').boundingBox();return Math.abs(target.y-(nav.y+nav.height+12));}).toBeLessThan(4);
 // This marker survives SPA navigation, distinguishing it from a full reload.
 await page.evaluate(()=>window.navigationFixture='same-document');
 await page.locator('#main-nav').getByRole('button',{name:'More',exact:true}).click();
 await page.getByRole('menuitem',{name:'Map',exact:true}).click();
 await expect(page).toHaveURL('/map');await expect(page.locator('.explore-map-canvas')).toBeVisible();
 expect(await page.evaluate(()=>window.navigationFixture)).toBe('same-document');
 await expect.poll(()=>page.evaluate(()=>scrollY)).toBeLessThan(3);
});
test('compact 320px header keeps language and menu accessible',async({page})=>{
 await page.setViewportSize({width:320,height:740});await page.addInitScript(()=>localStorage.setItem('peakguide_lang','en'));
 await page.goto('/');await page.locator('.map-teaser-button').scrollIntoViewIfNeeded();
 const nav=page.locator('#main-nav');expect((await nav.boundingBox()).height).toBeLessThan(140);
 await nav.getByRole('button',{name:'More',exact:true}).click();await expect(page.getByRole('menuitem',{name:'Map',exact:true})).toBeVisible();
 await page.keyboard.press('Escape');
 await nav.getByRole('button',{name:'Language: EN English',exact:true}).click();
 await page.getByRole('option',{name:/中文/}).click();
 await expect(nav.getByRole('button',{name:'更多',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

// Back must restore the reader's position even when that entry has an anchor.
test('Back restores a scrolled anchor page after catalogue loading', async ({ page }) => {
 await page.addInitScript(() => localStorage.setItem('peakguide_lang', 'en'));
 await page.goto('/#featured');
 await expect(page.locator('.featured-peak-card:not(.featured-peak-skeleton)').first()).toBeVisible();
 const anchorTop = await page.evaluate(() => scrollY);
 await page.mouse.wheel(0, 400);
 await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(anchorTop + 200);
 const before = await page.evaluate(() => scrollY);
 await page.locator('#main-nav').getByRole('button', { name: 'More', exact: true }).click();
 await page.getByRole('menuitem', { name: 'Map', exact: true }).click();
 await expect(page).toHaveURL('/map');
 await page.goBack();
 await expect(page).toHaveURL('/#featured');
 await expect(page.locator('.featured-peak-card:not(.featured-peak-skeleton)').first()).toBeVisible();
 await expect.poll(async () => Math.abs((await page.evaluate(() => scrollY)) - before)).toBeLessThan(5);
});
