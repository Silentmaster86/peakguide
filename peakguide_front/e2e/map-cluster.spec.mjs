import {test,expect} from '@playwright/test';
test('a wide connected group zooms in on every click instead of fitting the same bounds',async({page})=>{
 const peaks=Array.from({length:20},(_,i)=>({id:i+1,slug:`chain-${i}`,latitude:50,longitude:15+i*.5,elevation_m:1000,peaks_i18n:[{lang:'en',name:`Chain peak ${i}`}],mountain_ranges:{slug:'range',mountain_ranges_i18n:[{lang:'en',name:'Range'}]}}));
 await page.addInitScript(()=>localStorage.setItem('peakguide_lang','en'));
 await page.route('https://test.supabase.co/**',r=>r.fulfill({json:new URL(r.request().url()).pathname.endsWith('/peaks')?peaks:[]}));
 await page.route('**.tile.openstreetmap.org/**',r=>r.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')}));
 await page.goto('/map');await expect(page.locator('.pg-map-group')).toHaveCount(1);await expect(page.locator('.pg-map-group')).toHaveText('20');
 const zoom=()=>page.locator('.leaflet-tile').evaluateAll(images=>Math.max(-1,...images.map(image=>Number(new URL(image.src).pathname.split('/')[1]))));
 await expect.poll(zoom).toBeGreaterThan(0);let before=await zoom();
 for(let i=0;i<2&&await page.locator('.pg-map-group').count();i++){
  const close=page.locator('.leaflet-popup-close-button');if(await close.count())await close.click();
  await page.locator('.pg-map-group').first().click();await page.locator('.leaflet-popup').getByRole('button',{name:/Zoom into group/}).click();
  await expect.poll(zoom).toBeGreaterThan(before);before=await zoom();
 }
 await expect(page.locator('.pg-map-marker--peak')).toHaveCount(20);
});

test('initial groups use the fitted zoom even before the first user zoom event',async({page})=>{
 const peaks=[[50,19],[50,19.1],[50.1,19.2]].map(([latitude,longitude],i)=>({id:i+1,slug:`visible-${i}`,latitude,longitude,elevation_m:1000,peaks_i18n:[{lang:'en',name:`Visible peak ${i}`}]}));
 await page.addInitScript(()=>localStorage.setItem('peakguide_lang','en'));
 await page.route('https://test.supabase.co/**',r=>r.fulfill({json:new URL(r.request().url()).pathname.endsWith('/peaks')?peaks:[]}));
 await page.route('**.tile.openstreetmap.org/**',r=>r.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')}));
 await page.goto('/map');await expect(page.locator('.pg-map-marker--peak')).toHaveCount(3);await expect(page.locator('.pg-map-group')).toHaveCount(0);
});
