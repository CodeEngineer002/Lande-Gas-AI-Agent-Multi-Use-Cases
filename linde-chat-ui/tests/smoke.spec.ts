/**
 * ╔════════════════════════════════════════════════════╗
 * ║  TEST 1 — Smoke Test                              ║
 * ║  Verify the app boots, renders core layout,       ║
 * ║  and has no critical console / network errors.     ║
 * ╚════════════════════════════════════════════════════╝
 */
import { test, expect } from '@playwright/test';
import { NetworkMonitor } from './helpers/network-monitor';
import { SEL, PAGE_LOAD_TIMEOUT } from './helpers/selectors';

test.describe('Smoke Test — Application Boot', () => {
  test('1.1 Homepage loads with HTTP 200', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'networkidle', timeout: PAGE_LOAD_TIMEOUT });
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);
  });

  test('1.2 Page has a valid <title>', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('1.3 Core layout elements render', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // TopBar present
    await expect(page.locator(SEL.topBar)).toBeVisible({ timeout: 10_000 });

    // Icon-rail navigation present
    await expect(page.locator(SEL.iconRail)).toBeVisible();

    // Composer textarea present (default page is 'chat')
    await expect(page.locator(SEL.composerTextarea)).toBeVisible();
  });

  test('1.4 No critical console errors on initial load', async ({ page }) => {
    const monitor = new NetworkMonitor(page);
    monitor.start();

    await page.goto('/', { waitUntil: 'networkidle' });
    // Give hydration a moment
    await page.waitForTimeout(2000);
    monitor.stop();

    // Filter out known benign errors (e.g., favicon 404, third-party scripts)
    const criticalErrors = monitor.consoleErrors.filter(
      (e) =>
        !e.text.includes('favicon') &&
        !e.text.includes('third-party') &&
        !e.text.includes('Download the React DevTools'),
    );

    if (criticalErrors.length > 0) {
      console.log('Console errors found:');
      criticalErrors.forEach((e) => console.log(`  [${e.type}] ${e.text}`));
    }
    expect(criticalErrors).toHaveLength(0);
  });

  test('1.5 No failed network requests on initial load', async ({ page }) => {
    const monitor = new NetworkMonitor(page);
    monitor.start();

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    monitor.stop();

    // Filter out known acceptable failures (favicon, analytics, external)
    const meaningful = monitor.failedRequests.filter(
      (r) =>
        !r.url.includes('favicon') &&
        !r.url.includes('analytics') &&
        r.url.startsWith('http://localhost'),
    );

    if (meaningful.length > 0) {
      console.log('Failed requests:');
      meaningful.forEach((r) => console.log(`  ${r.method} ${r.url} → ${r.status}`));
    }
    expect(meaningful).toHaveLength(0);
  });

  test('1.6 Page is not blank (has meaningful content)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Body should have text content
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length).toBeGreaterThan(10);
  });

  test('1.7 No JavaScript unhandled exceptions', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    if (errors.length > 0) {
      console.log('Unhandled JS exceptions:', errors);
    }
    expect(errors).toHaveLength(0);
  });
});
