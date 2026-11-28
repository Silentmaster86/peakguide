import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import {profileText} from '../src/features/elevation/text.js';
const records=JSON.parse(readFileSync(new URL('../../docs/catalogue/nonkgp-08/records.json',import.meta.url),'utf8'));
const identities=JSON.parse(readFileSync(new URL('../../docs/catalogue/nonkgp-08/peaks.json',import.meta.url),'utf8'));
const names={'wolek':'Wołek','trzy-korony':'Trzy Korony','zamkowa-gora':'Zamkowa Góra','srebrna-kopa':'Srebrna Kopa'};
const langs=['pl','en','ua','zh'];
const ranges={8:['rudawy-janowickie','Rudawy Janowickie'],15:['gory-opawskie','Góry Opawskie'],26:['pieniny','Pieniny']};
const peaks=identities.map(p=>({...p,peaks_i18n:langs.map(lang=>({lang,name:names[p.slug],description:'Fixture: peak overview'})),mountain_ranges:{id:p.range_id,slug:ranges[p.range_id][0],mountain_ranges_i18n:langs.map(lang=>({lang,name:ranges[p.range_id][1]})),countries:{code:'PL',slug:'poland',countries_i18n:langs.map(lang=>({lang,name:'Polska'}))}}}));
const rows=kind=>records.filter(r=>r.kind===kind).map((r,index)=>{
 const {i18n,peak_slug,type_slug,...body}=r.body,peak=peaks.find(p=>p.slug===peak_slug);
 const row={...body,id:500+index,peak_id:peak.id,peaks:peak,[kind==='trail'?'trails_i18n':'pois_i18n']:Object.entries(i18n).map(([lang,text])=>({lang,...text}))};
 if(kind==='poi')row.poi_types={slug:type_slug,poi_types_i18n:langs.map(lang=>({lang,name:type_slug}))};
 return row;
});
const trails=rows('trail'),pois=rows('poi');
test.beforeEach(async({page})=>{
 await page.route('**.tile.openstreetmap.org/**',route=>route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')}));
 await page.route('https://test.supabase.co/**',async route=>{
  const url=new URL(route.request().url()),table=url.pathname.split('/').at(-1);
  let data=({peaks,trails,pois,peak_nearby:[],trail_access:[],trail_parking:[]})[table]??[];
  if(url.searchParams.has('peak_id'))data=data.filter(r=>r.peak_id===Number(url.searchParams.get('peak_id').slice(3)));
  if(url.searchParams.has('slug'))data=data.find(r=>r.slug===url.searchParams.get('slug').slice(3))??null;
  await route.fulfill({json:data});
 });
});
for(const lang of langs)test(`reviewed non-KGP batch 08 trails and POIs render with exact translations and GPX links: ${lang}`,async({page})=>{
 test.setTimeout(120000);
 await page.addInitScript(lang=>{localStorage.setItem('peakguide_lang',lang);localStorage.setItem('ui_theme_mode',['pl','ua'].includes(lang)?'light':'dark');},lang);
 for(const peak of peaks){
  const trail=records.find(r=>r.kind==='trail'&&r.body.peak_slug===peak.slug).body;
  const poi=records.find(r=>r.kind==='poi'&&r.body.peak_slug===peak.slug).body;
  await page.goto(`/peaks/${peak.slug}?tab=trails`);
  await expect(page.getByText(trail.i18n[lang].name,{exact:true})).toBeVisible();
  await expect(page.getByText(trail.i18n[lang].description,{exact:true})).toBeVisible();
  await expect(page.getByText(trail.i18n[lang].notes,{exact:true})).toBeVisible();
  await expect(page.locator(`a[href="${trail.gpx_url}"]`)).toBeVisible();
  await expect(page.locator(`a[href="${trail.source_url}"]`).first()).toBeVisible();
  const profile=page.locator('.elevation-profile');await profile.locator('summary').first().click();const slider=profile.getByRole('slider',{name:profileText[lang].point});await expect(slider).toBeVisible();await slider.focus();await page.keyboard.press('End');await expect(slider).toHaveValue(String({'wolek':165,'trzy-korony':187,'zamkowa-gora':170,'srebrna-kopa':316}[peak.slug]));
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.goto(`/peaks/${peak.slug}?tab=pois`);
  await expect(page.getByText(poi.i18n[lang].name,{exact:true})).toBeVisible();
  await expect(page.getByText(poi.i18n[lang].description,{exact:true})).toBeVisible();
  await expect(page.getByText(poi.i18n[lang].tips,{exact:true})).toBeVisible();
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  if(process.env.CATALOGUE_REVIEW_DIR && ['pl','zh'].includes(lang)){
   await page.locator('main').screenshot({path:`${process.env.CATALOGUE_REVIEW_DIR}/${peak.slug}-${lang}-${test.info().project.name}.png`});
  }
 }
});
