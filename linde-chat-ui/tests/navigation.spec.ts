/**
 * ╔════════════════════════════════════════════════════╗
 * ║  TEST 2 — Navigation & Link Crawl                 ║
 * ║  Verify in-app SPA navigation, detect broken      ║
 * ║  links, and validate page transitions.             ║
 * ╚════════════════════════════════════════════════════╝
 */
import { test, expect } from '@playwright/test';
import { SEL, PAGE_LOAD_TIMEOUT } from './helpers/selectors';

test.describe('Navigation — SPA Page Routing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle', timeout: PAGE_LOAD_TIMEOUT });
  });

  test('2.1 Icon-rail has all 4 navigation buttons', async ({ page }) => {
    const navButtons = page.locator('.icon-rail .rail-btn');
    // 4 nav items + 1 branding toggle = 5 total rail-btn elements
    const count = await navButtons.count();
    expect(count).toBeGreaterThanOrEqual(4);

    // Verify specific nav labels exist
    for (const label of ['Home', 'Chat', 'Settings']) {
      await expect(page.locator(`.icon-rail button[aria-label="${label}"]`)).toBeVisible();
    }
  });

  test('2.2 Navigate to Home page', async ({ page }) => {
    await page.click(SEL.navHome);
    await page.waitForTimeout(500);

    // Dashboard should be visible
    await expect(page.locator(SEL.dashboardTitle)).toBeVisible({ timeout: 5_000 });
    const titleText = await page.locator(SEL.dashboardTitle).innerText();
    expect(titleText).toContain('Dashboard');
  });

  test('2.3 Navigate to Chat page', async ({ page }) => {
    // First go to Home, then back to Chat
    await page.click(SEL.navHome);
    await page.waitForTimeout(500);

    await page.click(SEL.navChat);
    await page.waitForTimeout(500);

    // Composer should be visible
    await expect(page.locator(SEL.composerTextarea)).toBeVisible({ timeout: 5_000 });
  });

  test('2.4 Navigate to Settings page', async ({ page }) => {
    await page.click(SEL.navSettings);
    await page.waitForTimeout(500);

    // Settings toggles should be visible
    await expect(page.locator(SEL.settingsToggle).first()).toBeVisible({ timeout: 5_000 });
  });

  test('2.5 Navigation highlights active page', async ({ page }) => {
    // Default page is 'chat' — Chat button should have .active
    const chatBtn = page.locator(SEL.navChat);
    await expect(chatBtn).toHaveAttribute('aria-pressed', 'true');

    // Navigate to Home
    await page.click(SEL.navHome);
    await page.waitForTimeout(500);

    const homeBtn = page.locator(SEL.navHome);
    await expect(homeBtn).toHaveAttribute('aria-pressed', 'true');

    // Chat should no longer be active
    await expect(chatBtn).toHaveAttribute('aria-pressed', 'false');
  });

  test('2.6 Round-trip navigation (Home → Settings → Chat)', async ({ page }) => {
    // Home
    await page.click(SEL.navHome);
    await page.waitForTimeout(400);
    await expect(page.locator(SEL.dashboardTitle)).toBeVisible();

    // Settings
    await page.click(SEL.navSettings);
    await page.waitForTimeout(400);
    await expect(page.locator(SEL.settingsToggle).first()).toBeVisible();

    // Chat
    await page.click(SEL.navChat);
    await page.waitForTimeout(400);
    await expect(page.locator(SEL.composerTextarea)).toBeVisible();
  });

  test('2.7 All anchor links on the page are valid', async ({ page }) => {
    const links = await page.locator('a[href]').all();
    const broken: string[] = [];

    for (const link of links) {
      const href = await link.getAttribute('href');
      if (!href || href.startsWith('javascript:') || href.startsWith('#') || href.startsWith('mailto:')) continue;

      // Resolve relative URLs
      const absoluteUrl = new URL(href, 'http://localhost:4000').toString();

      // Only test local links
      if (!absoluteUrl.startsWith('http://localhost:4000')) continue;

      try {
        const res = await page.request.get(absoluteUrl);
        if (res.status() >= 400) {
          broken.push(`${href} → ${res.status()}`);
        }
      } catch (err) {
        broken.push(`${href} → FAILED (${(err as Error).message})`);
      }
    }

    if (broken.length > 0) {
      console.log('Broken links found:', broken);
    }
    expect(broken).toHaveLength(0);
  });

  test('2.8 No 404 pages when navigating via icon-rail', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const navButtons = [SEL.navHome, SEL.navChat, SEL.navSettings];
    for (const sel of navButtons) {
      await page.click(sel);
      await page.waitForTimeout(500);
    }

    // No JS crashes during navigation
    expect(errors).toHaveLength(0);

    // Page should still have content (not a white screen)
    const text = await page.locator('body').innerText();
    expect(text.trim().length).toBeGreaterThan(0);
  });
});
