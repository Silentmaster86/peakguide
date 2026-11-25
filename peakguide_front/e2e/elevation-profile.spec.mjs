import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFileSync} from 'node:fs';
import {profileText} from '../src/features/elevation/text.js';
const profile=JSON.parse(readFileSync(new URL('../src/features/elevation/data/lysina-pcim-kudlacze-wejscie.json',import.meta.url),'utf8'));
const langs=['pl','en','ua','zh'];
const peak={id:70,slug:'lysina',active:true,is_korona:false,elevation_m:891,latitude:null,longitude:null,peaks_i18n:langs.map(lang=>({lang,name:'Łysina',description:'Elevation fixture'})),mountain_ranges:{slug:'beskid-makowski',mountain_ranges_i18n:langs.map(lang=>({lang,name:'Beskid Makowski'}))}};
const trail={id:101,slug:profile.trail_slug,peak_id:70,gpx_url:profile.gpx_url,geometry_source_url:profile.geometry_source_url,route_geometry:{type:'MultiLineString',coordinates:profile.segments.map(s=>s.map(p=>p.slice(0,2)))},active:true,distance_km:8.5,elevation_gain_m:718,time_min:210,trails_i18n:langs.map(lang=>({lang,name:'Łysina: Pcim → Kudłacze',description:'Source-reviewed ascent'}))};
async function fixture(page,edit={}){
 await page.route('https://test.supabase.co/**',route=>{const u=new URL(route.request().url()),table=u.pathname.split('/').at(-1);return route.fulfill({json:table==='peaks'&&u.searchParams.has('slug')?peak:table==='trails'?[{...trail,...edit}]:[]});});
}
for(const lang of langs)for(const theme of ['light','dark'])test(`${lang} ${theme}: real reviewed samples, keyboard, table and readable layout`,async({page})=>{
 const t=profileText[lang];await fixture(page);
 await page.addInitScript(({lang,theme})=>{localStorage.setItem('peakguide_lang',lang);localStorage.setItem('ui_theme_mode',theme);},{lang,theme});
 let profileLoads=0,providerRequests=0;
 page.on('request',request=>{const url=request.url();if(url.includes('/src/features/elevation/data/'+profile.trail_slug+'.json'))profileLoads++;if(/https:\/\/(?:mapa-turystyczna\.pl|malopolska\.szlaki\.pttk\.pl|raw\.githubusercontent\.com)/.test(url))providerRequests++;});
 await page.goto('/peaks/lysina?tab=trails&trail='+profile.trail_slug);
 const widget=page.locator('.elevation-profile');await expect(widget.locator('summary').first()).toHaveText(t.title);expect(profileLoads).toBe(0);
 await widget.locator('summary').first().click();await expect(widget.getByRole('img')).toBeVisible();expect(profileLoads).toBe(1);
 const slider=widget.getByRole('slider',{name:t.point});await slider.focus();await page.keyboard.press('End');await expect(slider).toHaveValue(String(profile.point_count-1));await page.keyboard.press('Home');await expect(slider).toHaveValue('0');await page.keyboard.press('ArrowRight');await expect(slider).toHaveValue('1');
 await expect(slider).toHaveAttribute('aria-valuetext',/km.*m/);
 const chart=widget.getByRole('img');await chart.click({position:{x:(await chart.boundingBox()).width*.75,y:70}});expect(Number(await slider.inputValue())).toBeGreaterThan(1);
 await widget.getByText(t.table,{selector:'summary'}).focus();await page.keyboard.press('Enter');await expect(widget.getByRole('table')).toBeVisible();await expect(widget.getByRole('row')).toHaveCount(profile.point_count+1);
 expect(providerRequests).toBe(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 const axe=await new AxeBuilder({page}).include('.elevation-profile').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(axe.violations).toEqual([]);
});
test('320px and changed geometry never produce a substitute profile',async({page})=>{
 await page.setViewportSize({width:320,height:800});await page.addInitScript(()=>{localStorage.setItem('peakguide_lang','en');localStorage.setItem('ui_theme_mode','light');});
 const changed=structuredClone(trail.route_geometry);changed.coordinates[0][0][0]+=.001;await fixture(page,{route_geometry:changed});
 await page.goto('/peaks/lysina?tab=trails');await page.locator('.elevation-profile > summary').click();await expect(page.getByText(profileText.en.changed)).toBeVisible();await expect(page.locator('.elevation-profile svg')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
