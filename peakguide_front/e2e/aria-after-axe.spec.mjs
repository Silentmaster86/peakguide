import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Upstream Firefox regression: https://github.com/microsoft/playwright/issues/44135
// An Axe scan followed by a labelled lookup crashed Firefox in Playwright 1.65.x.
test('labelled input and named region remain usable after an accessibility scan', async ({ page }) => {
  await page.setContent('<!doctype html><html lang="en"><head><title>ARIA regression fixture</title></head>'
    + '<body><main><section aria-labelledby="sign-in-heading">'
    + '<h1 id="sign-in-heading">Sign in</h1>'
    + '<label for="password">Password</label><input id="password" type="password">'
    + '</section></main></body></html>');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await expect(page.getByLabel('Password', { exact: true })).toHaveCount(1);
  await expect(page.getByRole('region', { name: 'Sign in', exact: true })).toHaveCount(1);
  await page.getByLabel('Password', { exact: true }).fill('local-fixture-only');
  await expect(page.getByLabel('Password', { exact: true })).toHaveValue('local-fixture-only');
});
