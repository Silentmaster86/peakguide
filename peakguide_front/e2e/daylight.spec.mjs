import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const texts={pl:['Wschód i zachód słońca','Data wycieczki','Dzisiaj'],en:['Sunrise and sunset','Trip date','Today'],ua:['Схід і захід сонця','Дата походу','Сьогодні'],zh:['日出与日落','出行日期','今天']};
const peak={id:1,slug:'rysy',active:true,is_korona:true,elevation_m:2499,latitude:49.1795,longitude:20.0881,peaks_i18n:Object.keys(texts).map(lang=>({lang,name:'Rysy',description:'Test description'})),mountain_ranges:{slug:'tatry',mountain_ranges_i18n:[{lang:'en',name:'Tatry'}],countries:{code:'PL',countries_i18n:[{lang:'en',name:'Poland'}]}}};
test.beforeEach(async({page})=>{
 await page.route('**.tile.openstreetmap.org/**',route=>route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')}));
 await page.route('https://test.supabase.co/**',async route=>{
  const url=new URL(route.request().url());
  await route.fulfill({json:url.pathname.endsWith('/peaks')&&url.searchParams.has('slug')?peak:[]});
 });
});
for(const lang of Object.keys(texts))for(const theme of ['light','dark'])test(`${lang} ${theme}: destination daylight updates for trip date without network requests`,async({page})=>{
 await page.addInitScript(({lang,theme})=>{localStorage.setItem('peakguide_lang',lang);localStorage.setItem('ui_theme_mode',theme);},{lang,theme});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/peaks/rysy');
 const card=page.getByRole('region',{name:texts[lang][0],exact:true});
 await expect(card).toBeVisible();
 await card.getByLabel(texts[lang][1]).fill('2026-06-21');
 await expect(card).toContainText('Europe/Warsaw');
 const rise=await card.locator('time').first().getAttribute('datetime');
 await card.getByLabel(texts[lang][1]).fill('2026-12-21');
 await expect(card.locator('time').first()).not.toHaveAttribute('datetime',rise);
 await card.getByRole('button',{name:texts[lang][2]}).focus();await page.keyboard.press('Enter');
 await expect(card.locator('time')).toHaveCount(4);
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 const axe=await new AxeBuilder({page}).include('.peak-daylight').withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
 expect(axe.violations).toEqual([]);expect(errors).toEqual([]);
});
