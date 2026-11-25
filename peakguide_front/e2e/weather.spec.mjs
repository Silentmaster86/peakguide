import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { weatherText } from '../src/features/weather/text.js';
import { daylightText } from '../src/features/daylight/text.js';
const titles = {pl:'Pogoda w rejonie szczytu',en:'Weather near the summit',ua:'Погода поблизу вершини',zh:'山顶附近天气'};
const buttons = {pl:'Pokaż prognozę',en:'Show forecast',ua:'Показати прогноз',zh:'查看预报'};
const languages=['pl','en','ua','zh'];
const peak={id:1,slug:'rysy',active:true,is_korona:true,elevation_m:2499,latitude:49.1795,longitude:20.0881,peaks_i18n:languages.map(lang=>({lang,name:'Rysy',description:'Test description'})),mountain_ranges:{slug:'tatry',mountain_ranges_i18n:languages.map(lang=>({lang,name:'Tatry'})),countries:{code:'PL',countries_i18n:languages.map(lang=>({lang,name:'Polska'}))}}};
const data=()=>({peak:'rysy',location:{latitude:49.1795,longitude:20.0881,elevation_m:2499,time_zone:'Europe/Warsaw'},updated_at:new Date().toISOString(),retrieved_at:new Date().toISOString(),forecast:Array.from({length:25},(_,i)=>({time:new Date(Date.now()+(i+1)*3600_000).toISOString(),temperature_c:-5,wind_kmh:36,gust_kmh:null,precipitation_mm_next_hour:i?null:0}))});
test.beforeEach(async({page})=>{
 await page.route('**.tile.openstreetmap.org/**',route=>route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')}));
 await page.route('https://test.supabase.co/**',async route=>{
  const url=new URL(route.request().url()),table=url.pathname.split('/').at(-1);
  await route.fulfill({json:table==='peaks'&&url.searchParams.has('slug')?peak:[]});
 });
});
for(const lang of languages)for(const theme of ['light','dark'])test(`${lang} ${theme}: on-demand forecast, readable table and no horizontal page overflow`,async({page})=>{
 let requests=0;
 await page.addInitScript(({lang,theme})=>{localStorage.setItem('peakguide_lang',lang);localStorage.setItem('ui_theme_mode',theme);},{lang,theme});
 await page.route('**/.netlify/functions/peak-weather?**',async route=>{requests++;await route.fulfill({json:data()});});
 await page.goto('/peaks/rysy');
 const card=page.getByRole('region',{name:titles[lang],exact:true});
 await expect(card).toBeVisible();expect(requests).toBe(0);
 await card.getByRole('button',{name:buttons[lang]}).click();
 await expect(card.locator('dl')).toBeVisible();
 await expect(card).toContainText('Europe/Warsaw');
 await card.locator('summary').filter({hasText:weatherText[lang].hourly}).focus();await page.keyboard.press('Enter');
 await expect(card.getByRole('table')).toBeVisible();
 await expect(card.getByRole('link',{name:/CC BY 4.0/})).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 const axe=await new AxeBuilder({page}).include('.peak-weather').withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
 expect(axe.violations).toEqual([]);expect(requests).toBe(1);
});
test('disabled forecast has a recoverable error and never shows invented weather',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('peakguide_lang','en'));
 let failed=true;
 await page.route('**/.netlify/functions/peak-weather?**',async route=>{await route.fulfill(failed?{status:503,json:{error:'not_configured'}}:{json:data()});});
 await page.goto('/peaks/rysy');
 const card=page.getByRole('region',{name:titles.en,exact:true});
 await card.getByRole('button',{name:buttons.en}).click();
 await expect(card.getByRole('status')).toContainText('unavailable');
 await expect(card.locator('dl')).toHaveCount(0);
 failed=false;await card.getByRole('button',{name:'Retry'}).click();
 await expect(card.locator('dl')).toBeVisible();
 await expect(card).toContainText('Europe/Warsaw');
});

for (const lang of ['pl', 'zh']) test(`320px widgets: readable values, dates and keyboard details in ${lang}`, async ({page}) => {
 await page.setViewportSize({width:320,height:800});
 await page.addInitScript(lang => {
  localStorage.setItem('peakguide_lang',lang);
  localStorage.setItem('ui_theme_mode',lang==='pl'?'light':'dark');
 },lang);
 await page.route('**/.netlify/functions/peak-weather?**',route=>route.fulfill({json:data()}));
 await page.goto('/peaks/rysy');
 const card=page.getByRole('region',{name:titles[lang],exact:true});
 await card.getByRole('button',{name:buttons[lang]}).click();
 await expect(card.locator('dl')).toContainText('0 mm');
 await card.locator('summary').filter({hasText:weatherText[lang].modelDetails}).focus();
 await page.keyboard.press('Enter');
 await expect(card.getByText(/49\.1795, 20\.0881/)).toBeVisible();
 const sun=page.getByRole('region',{name:daylightText[lang].title,exact:true});
 await sun.getByLabel(daylightText[lang].date).fill('2026-06-21');
 await expect(sun.getByRole('meter',{name:daylightText[lang].duration,exact:true})).toBeVisible();
 const bounds=await sun.boundingBox();
 for(const time of await sun.locator('time').all()){
  const box=await time.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(bounds.x);
  expect(box.x+box.width).toBeLessThanOrEqual(bounds.x+bounds.width);
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
