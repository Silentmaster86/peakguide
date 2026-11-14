import {test, expect} from '@playwright/test';
import {adminText} from '../src/features/admin/text.js';

for (const lang of ['pl','en','ua','zh']) {
 test(`administrator translations and keyboard editor: ${lang}`, async({page})=>{
  const t=adminText(lang);
  const user={id:'11111111-1111-4111-8111-111111111111',email:'admin@example.test',user_metadata:{}};
  const profile={...user,display_name:'Test admin',role:'admin',is_admin:true};
  await page.addInitScript(({lang,user})=>{
   localStorage.setItem('peakguide_lang',lang);
   localStorage.setItem('sb-test-auth-token',JSON.stringify({access_token:'test-token',refresh_token:'test-refresh',expires_at:Math.floor(Date.now()/1000)+3600,user}));
  },{lang,user});
  await page.route('https://test.supabase.co/**',route=>{
   const url=new URL(route.request().url());
   let data=[];
   if(url.pathname.endsWith('/user'))data=user;
   if(url.pathname.endsWith('/profiles'))data=url.searchParams.has('id')?profile:[profile];
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
  });
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/panel');
  await expect(page.getByRole('heading',{name:t('Admin • Messages')})).toBeVisible();
  // Panel tabs are distinct from the public navigation links.
  const tabs=page.locator('main button');
  const peakTab={pl:'Szczyty',en:'Peaks',ua:'Вершини',zh:'山峰'}[lang];
  await tabs.filter({hasText:new RegExp(`^${peakTab}$`)}).click();
  const add=page.getByRole('button',{name:t('+ Add peak')});
  await add.click();
  const dialog=page.getByRole('dialog',{name:t('Add Peak')});
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button',{name:t('Close')})).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('textbox',{name:t('Tips')})).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button',{name:t('Close')})).toBeFocused();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(add).toBeFocused();
  expect(errors).toEqual([]);
 });
}
