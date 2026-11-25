import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {weatherPageText} from '../src/features/weather/pageText.js';
const langs=['pl','en','ua','zh'];
const peak={id:1,slug:'rysy',active:true,is_korona:true,elevation_m:2499,latitude:49.1795,longitude:20.0881,peaks_i18n:langs.map(lang=>({lang,name:'Rysy'})),mountain_ranges:{slug:'tatry',mountain_ranges_i18n:langs.map(lang=>({lang,name:'Tatry'}))}};
const city=(id=2950159)=>({kind:'city',id,name:id===2950159?'Berlin':'北京',admin1:id===2950159?'Berlin':'Beijing',country:id===2950159?'Germany':'China',country_code:id===2950159?'DE':'CN',latitude:id===2950159?52.52:39.9,longitude:id===2950159?13.4:116.4,elevation_m:38,time_zone:id===2950159?'Europe/Berlin':'Asia/Shanghai'});
function forecast(location={kind:'peak',slug:'rysy',latitude:49.1795,longitude:20.0881,elevation_m:2499},count=15){
 return {location,time_zone:location.time_zone||'Europe/Warsaw',retrieved_at:'2026-11-25T09:00:00Z',available_days:count,model_location:{latitude:location.latitude,longitude:location.longitude,elevation_m:location.elevation_m},days:Array.from({length:count},(_,i)=>({date:new Date(Date.UTC(2026,10,25+i)).toISOString().slice(0,10),temperature_min_c:-5,temperature_max_c:2,wind_max_kmh:18,gust_max_kmh:null,precipitation_sum_mm:0,precipitation_probability_max_percent:0,weather_code:i?71:null,daylight_seconds:30000,sunrise:new Date(Date.UTC(2026,10,25+i,6)).toISOString(),sunset:new Date(Date.UTC(2026,10,25+i,15)).toISOString()}))};
}
test.beforeEach(async({page})=>{
 await page.route('https://test.supabase.co/**',route=>route.fulfill({json:new URL(route.request().url()).pathname.endsWith('/peaks')?[peak]:[]}));
 await page.route('**.tile.openstreetmap.org/**',route=>route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')}));
});
for(const lang of langs)for(const theme of ['light','dark'])test(`${lang} ${theme}: daily cards, ranges and accessible responsive layout`,async({page})=>{
 const t=weatherPageText[lang];let calls=0;
 await page.addInitScript(({lang,theme})=>{localStorage.setItem('peakguide_lang',lang);localStorage.setItem('ui_theme_mode',theme);},{lang,theme});
 await page.route('**/.netlify/functions/weather-forecast?**',route=>{calls++;return route.fulfill({json:forecast()});});
 await page.goto('/weather');await expect(page.getByRole('heading',{name:t.title,exact:true})).toBeVisible();expect(calls).toBe(0);
 await page.getByRole('button',{name:/Rysy/}).click();
 await expect(page.locator('.weather-day')).toHaveCount(5);
 await expect(page.locator('.weather-selected')).toContainText('Europe/Warsaw');
 const first=page.locator('.weather-day').first();await expect(first).toContainText('0 mm');await expect(first.locator('.weather-day-condition svg')).toHaveCount(0);await expect(first).toContainText(t.noData);
 for(const count of [3,10,15]){await page.getByRole('button',{name:`${count} ${t.dayUnit}`,exact:true}).click();await expect(page.locator('.weather-day')).toHaveCount(count);}
 expect(calls).toBe(1);
 await page.locator('.weather-point-details summary').focus();await page.keyboard.press('Enter');await expect(page.locator('.weather-point-details')).toHaveAttribute('open','');
 await expect(page.locator('.weather-point-details')).toContainText('49.1795, 20.0881');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 const axe=await new AxeBuilder({page}).include('.weather-page').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(axe.violations).toEqual([]);
});
test('city search is explicit, accepts two Chinese characters and resolves the selected ID',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('peakguide_lang','en'));
 let searches=0;const requests=[];
 await page.route('**/.netlify/functions/weather-search?**',route=>{searches++;expect(new URL(route.request().url()).searchParams.get('q')).toBe('北京');return route.fulfill({json:{results:[city(1816670),{...city(123),name:'北京',admin1:'Another region'}]}});});
 await page.route('**/.netlify/functions/weather-forecast?**',route=>{const p=new URL(route.request().url()).searchParams;requests.push(p.get('city'));expect(p.has('latitude')).toBe(false);return route.fulfill({json:forecast(city(1816670),7)});});
 await page.goto('/weather?type=city');await page.getByRole('searchbox',{name:'City or town name'}).fill('北京');expect(searches).toBe(0);
 await page.getByRole('button',{name:'Search',exact:true}).click();await expect(page.getByRole('button',{name:/Another region/})).toBeVisible();
 await page.getByRole('button',{name:/北京\s*Beijing/}).click();await expect(page.locator('.weather-selected h2')).toHaveText('北京');
 await expect(page.locator('.weather-day')).toHaveCount(5);await expect(page.getByRole('button',{name:'10 days',exact:true})).toBeDisabled();await expect(page.getByRole('button',{name:'15 days',exact:true})).toBeDisabled();
 expect(requests).toEqual(['1816670']);await expect(page).toHaveURL(/city=1816670/);
});
test('new selection hides stale data, cancels old response and preserves URL day history',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('peakguide_lang','en'));
 let finishOld,oldStarted;const started=new Promise(resolve=>{oldStarted=resolve;});const pending=new Promise(resolve=>{finishOld=resolve;});
 await page.route('**/.netlify/functions/weather-forecast?**',async route=>{
  const p=new URL(route.request().url()).searchParams;
  if(p.has('city')){oldStarted();await pending;await route.fulfill({json:forecast(city())}).catch(()=>{});}else await route.fulfill({json:forecast()});
 });
 await page.goto('/weather?city=2950159&days=10');await started;
 await page.getByRole('button',{name:'Peaks',exact:true}).click();await page.getByRole('button',{name:/Rysy/}).click();
 await expect(page.locator('.weather-selected h2')).toHaveText('Rysy');finishOld();await expect(page.locator('.weather-day')).toHaveCount(10);
 await page.getByRole('button',{name:'3 days',exact:true}).click();await expect(page.locator('.weather-day')).toHaveCount(3);
 await page.goBack();await expect(page.locator('.weather-day')).toHaveCount(10);await expect(page.locator('.weather-selected h2')).toHaveText('Rysy');
});
test('recoverable outage and malformed identity never display invented values',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('peakguide_lang','en'));let calls=0,failed=true;
 await page.route('**/.netlify/functions/weather-forecast?**',route=>{calls++;return route.fulfill(failed?{status:503,json:{error:'not_configured'}}:{json:forecast()});});
 await page.goto('/weather?peak=rysy&city=2950159');await expect(page.getByRole('alert')).toContainText('valid place');expect(calls).toBe(0);
 await page.goto('/weather?peak=rysy');await expect(page.getByRole('alert')).toContainText('unavailable');await expect(page.locator('.weather-day')).toHaveCount(0);
 failed=false;await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.locator('.weather-day')).toHaveCount(5);
});
test('320px homepage teaser and navbar enter weather at the top without eager forecast requests',async({page})=>{
 await page.setViewportSize({width:320,height:800});await page.addInitScript(()=>{localStorage.setItem('peakguide_lang','en');localStorage.setItem('ui_theme_mode','light');});let calls=0;
 await page.route('**/.netlify/functions/weather-forecast?**',route=>{calls++;return route.fulfill({json:forecast()});});
 await page.goto('/');const teaser=page.locator('.home-weather-teaser');await teaser.scrollIntoViewIfNeeded();await expect(teaser).toBeVisible();expect(calls).toBe(0);
 expect(await teaser.evaluate(el=>getComputedStyle(el).flexDirection)).toBe('column');await teaser.getByRole('link').click();await expect(page).toHaveURL('/weather');await expect.poll(()=>page.evaluate(()=>scrollY)).toBeLessThan(3);
 await page.getByRole('button',{name:/Rysy/}).click();await expect(page.locator('.weather-day')).toHaveCount(5);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await expect.poll(async()=>{const nav=await page.locator('#main-nav').boundingBox(),panel=await page.locator('.weather-forecast-panel').boundingBox();return panel.y-(nav.y+nav.height);}).toBeGreaterThanOrEqual(12);
 await page.locator('#main-nav').getByRole('button',{name:'More',exact:true}).click();await expect(page.getByRole('menuitem',{name:'Weather',exact:true})).toBeVisible();
});
