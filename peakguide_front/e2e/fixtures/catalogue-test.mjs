import { test as base, expect } from '@playwright/test';

// These public catalogue cases navigate several pages and scan each with Axe.
// Give Firefox a fresh process per case. Playwright records custom contexts too,
// so failures retain the normal traces and screenshots without dropping checks.
export const test = base.extend({
  context: async ({ context, browserName, playwright, launchOptions, headless,
    contextOptions, baseURL, viewport, userAgent, deviceScaleFactor, isMobile,
    hasTouch, locale, timezoneId, colorScheme, reducedMotion }, use) => {
    if (browserName !== 'firefox') {
      await use(context);
      return;
    }
    const isolated = await playwright.firefox.launch({ ...launchOptions, headless });
    try {
      const fresh = await isolated.newContext({ ...contextOptions, baseURL,
        viewport, userAgent, deviceScaleFactor, isMobile, hasTouch, locale,
        timezoneId, colorScheme, reducedMotion });
      try {
        await use(fresh);
      } finally {
        await fresh.close();
      }
    } finally {
      await isolated.close();
    }
  },
});

export { expect };
