import {test,expect} from '@playwright/test';
const labels={pl:'Więcej',en:'More',ua:'Більше',zh:'更多'};
test.beforeEach(async({page})=>{
 await page.route('https://test.supabase.co/**',route=>route.fulfill({json:[]}));
});
for(const lang of Object.keys(labels))test(`${lang}: arrow opening, disabled items, Tab and reverse Tab`,async({page})=>{
 await page.addInitScript(lang=>localStorage.setItem('peakguide_lang',lang),lang);
 await page.goto('/');const trigger=page.locator('#main-nav').getByRole('button',{name:labels[lang],exact:true});
 await trigger.focus();await page.keyboard.press('ArrowUp');const menu=page.getByRole('menu',{name:labels[lang],exact:true});
 await expect(menu.getByRole('menuitem').last()).toBeFocused();await expect(menu.getByRole('menuitem').last()).toHaveAttribute('aria-disabled','true');
 const beforeSpace=await page.evaluate(()=>scrollY);await page.keyboard.press('Enter');await page.keyboard.press('Space');await expect(page).toHaveURL('/');await expect(menu).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(beforeSpace);
 await page.keyboard.press('Home');await expect(menu.getByRole('menuitem').first()).toBeFocused();
 await page.keyboard.press('Tab');await expect(menu).toHaveCount(0);await expect(trigger).toHaveAttribute('aria-expanded','false');await expect(trigger).not.toBeFocused();
 expect(await page.evaluate(()=>document.activeElement!==document.body)).toBe(true);
 await trigger.focus();await page.keyboard.press('ArrowDown');await expect(menu.getByRole('menuitem').first()).toBeFocused();
 await page.keyboard.press('Shift+Tab');await expect(menu).toHaveCount(0);await expect(trigger).not.toBeFocused();
 expect(await page.evaluate(()=>document.activeElement!==document.body)).toBe(true);
 await trigger.focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
});
test('language and theme keep their selected value focused, and Tab closes their popups',async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('peakguide_lang','en');localStorage.setItem('ui_theme_mode','dark');});await page.goto('/weather');
 for(const id of ['desktop-lang-switcher','desktop-theme-switcher']){
  const trigger=page.locator(`#${id} > button`);await trigger.focus();await page.keyboard.press('ArrowDown');
  const list=page.getByRole('listbox');await expect(list.getByRole('option',{selected:true})).toBeFocused();
  await page.keyboard.press('Tab');await expect(list).toHaveCount(0);await expect(trigger).not.toBeFocused();expect(await page.evaluate(()=>document.activeElement!==document.body)).toBe(true);
  await trigger.focus();await page.keyboard.press('ArrowUp');await expect(list.getByRole('option',{selected:true})).toBeFocused();await page.keyboard.press('Shift+Tab');await expect(list).toHaveCount(0);await expect(trigger).not.toBeFocused();
 }
});
test('Space follows the mobile Weather link',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('peakguide_lang','en'));await page.setViewportSize({width:390,height:844});await page.goto('/');
 const trigger=page.locator('#main-nav').getByRole('button',{name:'More',exact:true});await trigger.focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');await expect(page.getByRole('menuitem',{name:'Weather',exact:true})).toBeFocused();
 await page.keyboard.press('Space');await expect(page).toHaveURL('/weather');await expect(page.getByRole('heading',{name:'Weather forecast',exact:true})).toBeVisible();await expect(page.getByRole('menu')).toHaveCount(0);
});
test('an all-disabled desktop menu remains dismissible',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('peakguide_lang','en'));await page.setViewportSize({width:1440,height:900});await page.goto('/weather');
 await expect(page.getByRole('heading',{name:'Weather forecast',exact:true})).toBeVisible();
 const trigger=page.locator('#main-nav').getByRole('button',{name:'More',exact:true});await trigger.focus();await page.keyboard.press('ArrowDown');await expect(page.getByRole('menuitem',{name:/Trailheads/})).toBeFocused();
 await page.keyboard.press('Escape');await expect(trigger).toBeFocused();await expect(page.getByRole('menu')).toHaveCount(0);
});
