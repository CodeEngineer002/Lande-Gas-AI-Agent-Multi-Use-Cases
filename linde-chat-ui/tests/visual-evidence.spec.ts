/**
 * ╔════════════════════════════════════════════════════╗
 * ║  TEST 6 — Visual Evidence & Snapshot Capture       ║
 * ║  Captures full-page screenshots on each SPA view   ║
 * ║  for visual regression and evidence gathering.     ║
 * ╚════════════════════════════════════════════════════╝
 */
import { test } from '@playwright/test';
import { SEL, PAGE_LOAD_TIMEOUT } from './helpers/selectors';
import * as fs from 'fs';
import * as path from 'path';

const EVIDENCE_DIR = 'test-results/visual-evidence';

test.describe('Visual Evidence — Screenshot Capture', () => {
  test.beforeAll(() => {
    // Ensure evidence directory exists
    if (!fs.existsSync(EVIDENCE_DIR)) {
      fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle', timeout: PAGE_LOAD_TIMEOUT });
  });

  test('6.1 Capture Chat page screenshot', async ({ page }) => {
    await page.click(SEL.navChat);
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, 'chat-page.png'),
      fullPage: true,
    });
  });

  test('6.2 Capture Home Dashboard screenshot', async ({ page }) => {
    await page.click(SEL.navHome);
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, 'home-dashboard.png'),
      fullPage: true,
    });
  });

  test('6.3 Capture Settings page screenshot', async ({ page }) => {
    await page.click(SEL.navSettings);
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, 'settings-page.png'),
      fullPage: true,
    });
  });

  test('6.4 Capture TopBar close-up', async ({ page }) => {
    const topBar = page.locator(SEL.topBar);
    await topBar.screenshot({
      path: path.join(EVIDENCE_DIR, 'topbar-closeup.png'),
    });
  });

  test('6.5 Capture Composer close-up', async ({ page }) => {
    await page.click(SEL.navChat);
    await page.waitForTimeout(500);

    const composer = page.locator(SEL.composerRoot);
    await composer.screenshot({
      path: path.join(EVIDENCE_DIR, 'composer-closeup.png'),
    });
  });

  test('6.6 Capture Icon Rail close-up', async ({ page }) => {
    const iconRail = page.locator(SEL.iconRail);
    await iconRail.screenshot({
      path: path.join(EVIDENCE_DIR, 'icon-rail-closeup.png'),
    });
  });

  test('6.7 Capture all pages in sequence (filmstrip)', async ({ page }) => {
    const views = [
      { name: 'chat', nav: SEL.navChat },
      { name: 'home', nav: SEL.navHome },
      { name: 'settings', nav: SEL.navSettings },
    ];

    for (const view of views) {
      await page.click(view.nav);
      await page.waitForTimeout(800);
      await page.screenshot({
        path: path.join(EVIDENCE_DIR, `filmstrip-${view.name}.png`),
        fullPage: true,
      });
    }
  });
});
