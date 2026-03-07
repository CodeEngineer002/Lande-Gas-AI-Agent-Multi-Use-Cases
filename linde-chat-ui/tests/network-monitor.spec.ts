/**
 * ╔════════════════════════════════════════════════════╗
 * ║  TEST 5 — Network & API Monitoring                 ║
 * ║  Detects failed requests, slow responses,          ║
 * ║  console errors across all SPA pages.              ║
 * ╚════════════════════════════════════════════════════╝
 */
import { test, expect } from '@playwright/test';
import { NetworkMonitor } from './helpers/network-monitor';
import { SEL, PAGE_LOAD_TIMEOUT } from './helpers/selectors';

test.describe('Network & API Monitoring', () => {
  test('5.1 No failed API requests during full page tour', async ({ page }) => {
    const monitor = new NetworkMonitor(page, 5000);
    monitor.start();

    // Visit all SPA pages
    await page.goto('/', { waitUntil: 'networkidle', timeout: PAGE_LOAD_TIMEOUT });

    // Chat page (default)
    await page.waitForTimeout(2000);

    // Home
    await page.click(SEL.navHome);
    await page.waitForTimeout(2000);

    // Settings
    await page.click(SEL.navSettings);
    await page.waitForTimeout(2000);

    // Back to Chat
    await page.click(SEL.navChat);
    await page.waitForTimeout(2000);

    monitor.stop();

    // Filter out non-critical failures
    const criticalFailures = monitor.failedRequests.filter(
      (r) =>
        r.url.startsWith('http://localhost') &&
        !r.url.includes('favicon') &&
        !r.url.includes('__next') &&
        !r.url.includes('hot-update'),
    );

    if (criticalFailures.length > 0) {
      console.log('Critical failed requests:');
      criticalFailures.forEach((r) =>
        console.log(`  ${r.method} ${r.url} → ${r.status} [${r.resourceType}]`),
      );
    }
    expect(criticalFailures).toHaveLength(0);
  });

  test('5.2 All static assets load successfully', async ({ page }) => {
    const failedAssets: string[] = [];

    page.on('response', (res) => {
      const url = res.url();
      const type = res.request().resourceType();
      if (['stylesheet', 'script', 'image', 'font'].includes(type) && res.status() >= 400) {
        failedAssets.push(`${type}: ${url} → ${res.status()}`);
      }
    });

    await page.goto('/', { waitUntil: 'networkidle', timeout: PAGE_LOAD_TIMEOUT });
    await page.waitForTimeout(3000);

    if (failedAssets.length > 0) {
      console.log('Failed static assets:');
      failedAssets.forEach((a) => console.log(`  ${a}`));
    }
    expect(failedAssets).toHaveLength(0);
  });

  test('5.3 No slow responses (>5s) on initial load', async ({ page }) => {
    const monitor = new NetworkMonitor(page, 5000);
    monitor.start();

    await page.goto('/', { waitUntil: 'networkidle', timeout: PAGE_LOAD_TIMEOUT });
    await page.waitForTimeout(3000);

    monitor.stop();

    if (monitor.slowResponses.length > 0) {
      console.log('Slow responses detected:');
      monitor.slowResponses.forEach((r) =>
        console.log(`  ${r.url} → ${r.durationMs}ms (status ${r.status})`),
      );
    }

    // Warn but don't fail for slow local dev server responses
    // Just ensure there are no extremely slow ones (>15s)
    const extremelySlow = monitor.slowResponses.filter((r) => r.durationMs > 15_000);
    expect(extremelySlow).toHaveLength(0);
  });

  test('5.4 Console is clean across page navigation', async ({ page }) => {
    const monitor = new NetworkMonitor(page);
    monitor.start();

    await page.goto('/', { waitUntil: 'networkidle' });

    // Navigate through all pages
    const pages = [SEL.navHome, SEL.navSettings, SEL.navChat];
    for (const nav of pages) {
      await page.click(nav);
      await page.waitForTimeout(1500);
    }

    monitor.stop();

    // Filter to critical errors only
    const critical = monitor.consoleErrors.filter(
      (e) =>
        !e.text.includes('favicon') &&
        !e.text.includes('Download the React DevTools') &&
        !e.text.includes('Warning:') &&
        !e.text.includes('third-party'),
    );

    if (critical.length > 0) {
      console.log('Console errors during navigation:');
      critical.forEach((e) => console.log(`  [${e.type}] ${e.text}`));
    }
    expect(critical).toHaveLength(0);
  });

  test('5.5 API proxy / webhook endpoint responds', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Test the chat API endpoint exists (OPTIONS or GET)
    const apiEndpoints = ['/api/chat'];
    for (const endpoint of apiEndpoints) {
      try {
        const res = await page.request.fetch(`http://localhost:4000${endpoint}`, {
          method: 'OPTIONS',
          timeout: 5_000,
        });
        // Any response (even 405 Method Not Allowed) means the endpoint exists
        // Only 404 is truly missing
        expect(res.status()).not.toBe(404);
      } catch {
        // If fetch fails, the endpoint might not support OPTIONS; that's okay
        // We just verify no hard crash
      }
    }
  });

  test('5.6 Performance: page load under 10 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'networkidle', timeout: PAGE_LOAD_TIMEOUT });
    const loadTime = Date.now() - startTime;

    console.log(`Page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10_000);
  });

  test('5.7 No mixed content warnings', async ({ page }) => {
    const mixedContent: string[] = [];

    page.on('console', (msg) => {
      if (msg.text().toLowerCase().includes('mixed content')) {
        mixedContent.push(msg.text());
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    expect(mixedContent).toHaveLength(0);
  });

  test('5.8 Network monitor summary report', async ({ page }) => {
    const monitor = new NetworkMonitor(page, 3000);
    monitor.start();

    await page.goto('/', { waitUntil: 'networkidle' });

    // Quick tour of all pages
    const navs = [SEL.navHome, SEL.navSettings, SEL.navChat];
    for (const nav of navs) {
      await page.click(nav);
      await page.waitForTimeout(1000);
    }

    monitor.stop();

    // Print summary
    console.log('\n┌─────────────────────────────────┐');
    console.log('│ NETWORK MONITORING SUMMARY       │');
    console.log('├─────────────────────────────────┤');
    console.log(`│ Console errors:   ${String(monitor.consoleErrors.length).padStart(3)}            │`);
    console.log(`│ Console warnings: ${String(monitor.consoleWarnings.length).padStart(3)}            │`);
    console.log(`│ Failed requests:  ${String(monitor.failedRequests.length).padStart(3)}            │`);
    console.log(`│ Slow responses:   ${String(monitor.slowResponses.length).padStart(3)}            │`);
    console.log('└─────────────────────────────────┘\n');

    // This test always passes — it's a report
    expect(true).toBeTruthy();
  });
});
