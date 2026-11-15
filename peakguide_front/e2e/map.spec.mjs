import {test,expect} from '@playwright/test';
const range={slug:'beskid-wyspowy',mountain_ranges_i18n:[{lang:'en',name:'Beskid Wyspowy'}],countries:{slug:'poland',code:'PL',countries_i18n:[{lang:'en',name:'Poland'}]}};
const peaks=[{id:1,slug:'lyzka',elevation_m:803,latitude:49.642726,longitude:20.462113,peaks_i18n:[{lang:'en',name:'Łyżka'}],mountain_ranges:range},{id:2,slug:'ben-nevis',elevation_m:1345,latitude:56.796,longitude:-5.003,peaks_i18n:[{lang:'en',name:'Ben Nevis'}],mountain_ranges:{slug:'grampian',mountain_ranges_i18n:[{lang:'en',name:'Grampian'}],countries:{slug:'uk',code:'GB',countries_i18n:[{lang:'en',name:'UK'}]}}},{id:3,slug:'unknown',elevation_m:900,latitude:null,longitude:null,peaks_i18n:[{lang:'en',name:'Unknown location'}],mountain_ranges:range}];
test.beforeEach(async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('peakguide_lang','en'));
 await page.route('https://test.supabase.co/**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(new URL(route.request().url()).pathname.endsWith('/peaks')?peaks:[])}));
 await page.route('**.tile.openstreetmap.org/**',route=>route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')}));
});
test('map filters, missing coordinates and detail links work',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/map');
 await expect(page.getByRole('status')).toContainText('Peaks on map: 2');
 await expect(page.getByRole('status')).toContainText('Without valid coordinates: 1');
 await expect(page.locator('.leaflet-interactive')).toHaveCount(2);
 await page.locator('.leaflet-interactive').first().click();
 await expect(page.locator('.leaflet-popup').getByRole('link',{name:'View details',exact:true})).toHaveAttribute('href','/peaks/lyzka');
 await page.getByRole('combobox',{name:'Country',exact:true}).selectOption('poland');
 await expect(page.getByRole('status')).toContainText('Peaks on map: 1');
 await page.getByRole('searchbox',{name:'Search peaks'}).fill('not found');
 await expect(page.getByText('No peaks match these filters.')).toBeVisible();
 await expect(page.locator('.leaflet-container')).toHaveCount(0);
 await page.getByRole('searchbox',{name:'Search peaks'}).fill('Łyżka');
 await expect(page.locator('.leaflet-container')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.locator('.explore-map-list').getByRole('link',{name:'Łyżka'}).click();
 await expect(page).toHaveURL('/peaks/lyzka');expect(errors).toEqual([]);
});
test('tile failure keeps a usable list and retry control',async({page})=>{
 await page.route('**.tile.openstreetmap.org/**',route=>route.abort());
 await page.goto('/map');
 await expect(page.getByRole('alert')).toContainText('Some map tiles could not load');
 await expect(page.locator('.explore-map-list').getByRole('link',{name:'Ben Nevis'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Retry',exact:true})).toBeVisible();
});
test('API failure can be retried and home CTA opens the map',async({page})=>{
 let failed=true;
 await page.route('**/rest/v1/peaks?**',route=>route.fulfill({status:failed?500:200,contentType:'application/json',body:JSON.stringify(failed?{message:'offline'}:peaks)}));
 await page.goto('/map');await expect(page.getByRole('alert')).toContainText('Could not load peaks');
 failed=false;await page.getByRole('button',{name:'Retry',exact:true}).click();
 await expect(page.locator('.leaflet-container')).toBeVisible();
 await page.goto('/');await page.locator('.map-teaser-button').click();await expect(page).toHaveURL('/map');
});
test('nearby peaks form a group with a zoom control',async({page})=>{
 const nearby=[peaks[0],{...peaks[0],id:4,slug:'neighbor',peaks_i18n:[{lang:'en',name:'Neighbor'}],latitude:49.6428}];
 await page.route('**/rest/v1/peaks?**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(nearby)}));
 await page.goto('/map');await expect(page.locator('.pg-map-group')).toHaveText('2');
 await page.locator('.leaflet-interactive').click();
 await page.getByRole('button',{name:'Zoom into group (2)'}).click();
 await expect(page.locator('.leaflet-interactive')).toHaveCount(2);
});
test('map labels follow all four UI languages',async({page})=>{
 for(const [lang,title] of [['pl','Mapa szczytów'],['en','Peak map'],['ua','Мапа вершин'],['zh','山峰地图']]){
  await page.addInitScript(value=>localStorage.setItem('peakguide_lang',value),lang);
  await page.goto('/map');await expect(page.getByRole('heading',{level:1,name:title})).toBeVisible();
  await expect(page.locator('.leaflet-container')).toBeVisible();
 }
});
test('base layer switch preserves filters and markers, updates credits and remembers choice',async({page})=>{
 const image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
 for(const pattern of ['https://server.arcgisonline.com/**']) await page.route(pattern,route=>route.fulfill({contentType:'image/png',body:image}));
 await page.goto('/map');
 await page.getByRole('combobox',{name:'Country',exact:true}).selectOption('poland');
 await expect(page.locator('.leaflet-interactive')).toHaveCount(1);
 await page.getByRole('button',{name:'Map layers',exact:true}).click();
 const view=page.getByRole('combobox',{name:'Map view',exact:true});
 for(const [value,source,credit] of [['satellite','server.arcgisonline.com','Esri'],['topo','World_Topo_Map','Esri'],['standard','tile.openstreetmap.org','OpenStreetMap']]){
  await view.selectOption(value);
  await expect(page.locator('.leaflet-tile').first()).toHaveAttribute('src',new RegExp(source.replaceAll('.','\\.')));
  await expect(page.locator('.leaflet-control-attribution')).toContainText(credit);
  await expect(page.getByRole('combobox',{name:'Country',exact:true})).toHaveValue('poland');
  await expect(page.locator('.leaflet-interactive')).toHaveCount(1);
 }
 await view.selectOption('satellite');await page.reload();await page.getByRole('button',{name:'Map layers',exact:true}).click();await expect(view).toHaveValue('satellite');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('switching away from a failed provider clears its error',async({page})=>{
 await page.route('https://server.arcgisonline.com/**',route=>route.abort());
 await page.goto('/map');
 await page.getByRole('button',{name:'Map layers',exact:true}).click();
 const view=page.getByRole('combobox',{name:'Map view',exact:true});
 await view.selectOption('satellite');await expect(page.getByRole('alert')).toBeVisible();
 await view.selectOption('standard');await expect(page.getByRole('alert')).toHaveCount(0);
 await expect(page.locator('.leaflet-tile').first()).toHaveAttribute('src',/tile.openstreetmap.org/);
});
test('optional POI and route layers follow peak filters and survive missing geometry',async({page},testInfo)=>{
 await page.route('**/rest/v1/pois?**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{id:1,peak_id:1,active:true,latitude:49.64,longitude:20.46,pois_i18n:[{lang:'en',name:'Trailhead'}],peaks:{slug:'lyzka',active:true}}])}));
 await page.route('**/rest/v1/trails?**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{id:8,peak_id:1,slug:'route',active:true,route_geometry:{type:'LineString',coordinates:[[20.46,49.64],[20.462,49.643]]},trails_i18n:[{lang:'en',name:'Stored route'}],peaks:{slug:'lyzka',active:true}},{id:9,peak_id:2,slug:'no-geometry',active:true,trails_i18n:[{lang:'en',name:'No geometry route'}],peaks:{slug:'ben-nevis',active:true}}])}));
 await page.goto('/map');
 await page.getByRole('button',{name:'Map layers',exact:true}).click();
 await page.getByRole('checkbox',{name:'Points of interest',exact:true}).check();
 await page.getByRole('checkbox',{name:'Route lines',exact:true}).check();
 await expect(page.getByText('Points of interest: 1',{exact:true})).toBeVisible();
 await expect(page.getByRole('link',{name:'No geometry route',exact:true})).toBeVisible();
 await expect(page.locator('.leaflet-overlay-pane path')).toHaveCount(1);
 await expect(page.locator('.leaflet-marker-icon')).toHaveCount(3);
 await page.screenshot({path:testInfo.outputPath('map-overlays.png'),fullPage:true});
 await page.getByRole('combobox',{name:'Country',exact:true}).selectOption('uk');
 await expect(page.getByText('Points of interest: 0',{exact:true})).toBeVisible();
 await expect(page.locator('.leaflet-overlay-pane path')).toHaveCount(0);
 await expect(page.locator('.leaflet-marker-icon')).toHaveCount(1);
 await page.getByRole('checkbox',{name:'Route lines',exact:true}).uncheck();
 await expect(page.getByRole('link',{name:'No geometry route',exact:true})).toHaveCount(0);
});

test('map workspace supports keyboard pins, expand and Escape without losing filters',async({page})=>{
 await page.goto('/map');
 await page.getByRole('combobox',{name:'Country',exact:true}).selectOption('poland');
 const pin=page.locator('.pg-map-marker--peak');
 await pin.focus();await page.keyboard.press('Enter');
 await expect(page.locator('.pg-map-popup').getByRole('heading',{name:'Łyżka'})).toBeVisible();
 await expect.poll(()=>page.locator('.explore-map-canvas').evaluate(canvas=>{const c=canvas.getBoundingClientRect(),p=canvas.querySelector('.pg-map-popup').getBoundingClientRect();return p.left>=c.left&&p.right<=c.right&&p.top>=c.top;})).toBe(true);
 await page.getByRole('button',{name:'Expand map',exact:true}).click();
 await expect(page.locator('.explore-map-canvas')).toHaveClass(/is-expanded/);
 const dialog=page.getByRole('dialog',{name:'Peak map',exact:true});
 await expect(dialog).toBeVisible();
 const focusables=dialog.locator('button,a[href],select,input,[tabindex="0"]').filter({visible:true});
 await focusables.last().focus();await page.keyboard.press('Tab');await expect(focusables.first()).toBeFocused();
 await expect.poll(()=>page.locator('.explore-map-canvas').evaluate(e=>Math.round(e.getBoundingClientRect().height))).toBeGreaterThan(500);
 await page.getByRole('button',{name:'Map layers',exact:true}).click();
 await page.getByRole('combobox',{name:'Map view',exact:true}).focus();
 await page.keyboard.press('Escape');
 await expect(page.getByRole('button',{name:'Map layers',exact:true})).toBeFocused();
 await expect(page.locator('.explore-map-canvas')).toHaveClass(/is-expanded/);
 await page.keyboard.press('Escape');
 await expect(page.locator('.explore-map-canvas')).not.toHaveClass(/is-expanded/);
 await expect(page.getByRole('combobox',{name:'Country',exact:true})).toHaveValue('poland');
 await expect(page.getByRole('button',{name:'Expand map',exact:true})).toBeFocused();
 await page.getByRole('button',{name:'Show all results',exact:true}).click();
});

test('POI pictograms follow their types and names stay plain text',async({page})=>{
 const names=['parking','shelter','trailhead','viewpoint','unknown'];
 const literal='<img src=x onerror=alert(1)>';
 await page.route('**/rest/v1/pois?**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(names.map((slug,i)=>({id:i+1,peak_id:1,active:true,latitude:49.64+i*.08,longitude:20.46+i*.08,poi_types:{slug},pois_i18n:[{lang:'en',name:i?slug:literal}],peaks:{slug:'lyzka',active:true}})))}));
 await page.goto('/map');
 await page.getByRole('button',{name:'Map layers',exact:true}).click();
 await page.getByRole('checkbox',{name:'Points of interest',exact:true}).check();
 for(const kind of ['parking','shelter','trailhead','viewpoint','poi'])await expect(page.locator(`.pg-map-marker--${kind}`)).toHaveCount(1);
 await page.locator('.pg-map-marker--parking').focus();await page.keyboard.press('Enter');
 await expect(page.locator('.pg-map-popup').getByRole('heading',{name:literal,exact:true})).toBeVisible();
 await expect(page.locator('.pg-map-popup img')).toHaveCount(0);
});
