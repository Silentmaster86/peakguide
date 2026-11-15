import {test,expect} from '@playwright/test';
test('admin can create a trail, preserve failed drafts and edit a POI',async({page},testInfo)=>{
 const user={id:'11111111-1111-4111-8111-111111111111',email:'admin@example.test',user_metadata:{}};
 const profile={...user,role:'admin',is_admin:true};
 await page.addInitScript(user=>{localStorage.setItem('peakguide_lang','en');localStorage.setItem('ui_theme_mode','light');localStorage.setItem('sb-test-auth-token',JSON.stringify({access_token:'test-token',refresh_token:'test-refresh',expires_at:Math.floor(Date.now()/1000)+3600,user}));},user);
 let failed=true;const writes=[];
 await page.route('https://test.supabase.co/**',async route=>{
  const url=new URL(route.request().url());const name=url.pathname.split('/').at(-1);let data=[];
  if(name==='user')data=user;
  if(name==='profiles')data=url.searchParams.has('id')?profile:[profile];
  if(name==='peaks')data=[{id:1,slug:'peak',peaks_i18n:[{lang:'en',name:'Peak'}]}];
  if(name==='poi_types')data=[{id:1,slug:'parking',poi_types_i18n:[{lang:'en',name:'Parking'}]}];
  if(name==='pois')data=[{id:4,peak_id:1,type_id:1,active:true,updated_at:'2026-11-15T00:00:00Z',pois_i18n:[{lang:'en',name:'Car park'}]}];
  if(name==='admin_save_trail'||name==='admin_save_poi'){
   writes.push(route.request().postDataJSON());
   if(failed){failed=false;return route.fulfill({status:500,contentType:'application/json',body:JSON.stringify({message:'offline'})});}data=12;
  }
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.goto('/panel');await page.getByRole('button',{name:'Tools',exact:true}).click();
 await page.getByRole('button',{name:'Add',exact:true}).click();
 await page.getByRole('combobox',{name:'Peak *',exact:true}).selectOption('1');
 await page.getByRole('textbox',{name:'URL slug *'}).fill('test-route');
 await page.getByRole('textbox',{name:'Name (EN)'}).fill('Test route');
 await page.getByLabel('Import route from GPX file (up to 2 MB)').setInputFiles({name:'track.gpx',mimeType:'application/gpx+xml',buffer:Buffer.from('<gpx><trk><trkseg><trkpt lat="50" lon="20"/><trkpt lat="50.1" lon="20.1"/></trkseg></trk></gpx>')});
 await expect(page.getByRole('textbox',{name:'GeoJSON route (LineString/MultiLineString)'})).toHaveValue(/LineString/);
 await page.getByRole('textbox',{name:'Geometry source',exact:true}).fill('https://example.test/track.gpx');
 await page.getByLabel('Geometry verified (UTC)').fill('2026-11-15T00:00');
 await page.getByRole('textbox',{name:'Name (EN)'}).scrollIntoViewIfNeeded();
 await page.screenshot({path:testInfo.outputPath('catalogue-editor-light.png'),fullPage:true});
 await page.getByRole('button',{name:'Save',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('operation failed');
 await expect(page.getByRole('textbox',{name:'Name (EN)'})).toHaveValue('Test route');
 await page.getByRole('button',{name:'Save',exact:true}).click();
 await expect(page.getByRole('textbox',{name:'URL slug *'})).toHaveCount(0);
 expect(writes[0].p_body.i18n.en.name).toBe('Test route');expect(writes[0].p_body.active).toBe(false);expect(writes[0].p_body.route_geometry.coordinates).toEqual([[20,50],[20.1,50.1]]);
 await page.getByRole('button',{name:'Points of interest',exact:true}).click();
 await page.getByRole('button',{name:'Edit',exact:true}).click();
 await page.getByRole('textbox',{name:'Name (EN)'}).fill('Edited park');
 await page.getByRole('checkbox',{name:'Published',exact:true}).uncheck();
 await page.getByRole('button',{name:'Save',exact:true}).click();
 await expect.poll(()=>writes.length).toBe(3);
 expect(writes[2]).toMatchObject({p_id:4,p_expected_updated_at:'2026-11-15T00:00:00Z',p_body:{active:false}});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
