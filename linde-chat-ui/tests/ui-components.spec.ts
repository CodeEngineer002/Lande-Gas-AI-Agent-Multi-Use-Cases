/**
 * ╔════════════════════════════════════════════════════╗
 * ║  TEST 3 — UI Component Validation                 ║
 * ║  Verify every major UI component renders,          ║
 * ║  is interactive, and meets accessibility basics.   ║
 * ╚════════════════════════════════════════════════════╝
 */
import { test, expect } from '@playwright/test';
import { SEL, PAGE_LOAD_TIMEOUT } from './helpers/selectors';

test.describe('UI Components — TopBar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle', timeout: PAGE_LOAD_TIMEOUT });
  });

  test('3.1 TopBar is visible and contains brand elements', async ({ page }) => {
    const topBar = page.locator(SEL.topBar);
    await expect(topBar).toBeVisible();

    // Brand icon or logo should be present
    const brandElements = topBar.locator('img, svg, .topbar-brand-icon');
    const count = await brandElements.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('3.2 Search input is present and focusable', async ({ page }) => {
    const searchInput = page.locator(SEL.searchInput);
    await expect(searchInput).toBeVisible();

    await searchInput.focus();
    await expect(searchInput).toBeFocused();

    // Can type in search
    await searchInput.fill('test search query');
    await expect(searchInput).toHaveValue('test search query');
  });
});

test.describe('UI Components — Left Sidebar (Icon Rail)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle', timeout: PAGE_LOAD_TIMEOUT });
  });

  test('3.3 Icon rail renders with navigation buttons', async ({ page }) => {
    const iconRail = page.locator(SEL.iconRail);
    await expect(iconRail).toBeVisible();

    // Should have at least Home, Chat, Settings buttons
    const buttons = iconRail.locator('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('3.4 Each nav button has an aria-label', async ({ page }) => {
    const railButtons = page.locator('.icon-rail .rail-btn');
    const count = await railButtons.count();

    for (let i = 0; i < count; i++) {
      const btn = railButtons.nth(i);
      const ariaLabel = await btn.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel!.length).toBeGreaterThan(0);
    }
  });

  test('3.5 Sidebar collapse/expand toggle works', async ({ page }) => {
    // Look for the sidebar toggle button
    const collapseBtn = page.locator(SEL.sidebarCollapse);
    const expandBtn = page.locator(SEL.sidebarExpand);

    // One of them should be visible
    const collapseVisible = await collapseBtn.isVisible().catch(() => false);
    const expandVisible = await expandBtn.isVisible().catch(() => false);

    if (collapseVisible) {
      await collapseBtn.click();
      await page.waitForTimeout(500);
      // After collapse, expand button should appear
      await expect(expandBtn).toBeVisible({ timeout: 3_000 });

      // Expand it back
      await expandBtn.click();
      await page.waitForTimeout(500);
      await expect(collapseBtn).toBeVisible({ timeout: 3_000 });
    } else if (expandVisible) {
      await expandBtn.click();
      await page.waitForTimeout(500);
      await expect(collapseBtn).toBeVisible({ timeout: 3_000 });
    } else {
      // No toggle found — skip gracefully
      test.skip();
    }
  });
});

test.describe('UI Components — Composer (Chat Input)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle', timeout: PAGE_LOAD_TIMEOUT });
    // Ensure we're on Chat page
    await page.click(SEL.navChat);
    await page.waitForTimeout(500);
  });

  test('3.6 Composer textarea is visible with placeholder', async ({ page }) => {
    const textarea = page.locator(SEL.composerTextarea);
    await expect(textarea).toBeVisible();

    const placeholder = await textarea.getAttribute('placeholder');
    expect(placeholder).toBeTruthy();
    expect(placeholder!.toLowerCase()).toContain('linde');
  });

  test('3.7 Composer accepts text input', async ({ page }) => {
    const textarea = page.locator(SEL.composerTextarea);
    await textarea.click();
    await textarea.fill('Hello, this is a test message');

    const value = await textarea.inputValue();
    expect(value).toBe('Hello, this is a test message');
  });

  test('3.8 Send button is present', async ({ page }) => {
    const sendBtn = page.locator(SEL.sendButton);
    await expect(sendBtn).toBeVisible();
  });

  test('3.9 Attach button is present', async ({ page }) => {
    const attachBtn = page.locator(SEL.attachButton);
    await expect(attachBtn).toBeVisible();
  });

  test('3.10 Keyboard hints are displayed', async ({ page }) => {
    // Composer should show Enter/Shift+Enter hints
    const composerArea = page.locator(SEL.composerRoot);
    const text = await composerArea.innerText();
    expect(text).toContain('Enter');
  });
});

test.describe('UI Components — Home Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle', timeout: PAGE_LOAD_TIMEOUT });
    await page.click(SEL.navHome);
    await page.waitForTimeout(500);
  });

  test('3.11 Dashboard renders with title', async ({ page }) => {
    const title = page.locator(SEL.dashboardTitle);
    await expect(title).toBeVisible({ timeout: 5_000 });
    await expect(title).toHaveText('Dashboard');
  });

  test('3.12 Dashboard has subtitle description', async ({ page }) => {
    const subtitle = page.locator('.hd-subtitle');
    await expect(subtitle).toBeVisible();
    const text = await subtitle.innerText();
    expect(text.length).toBeGreaterThan(5);
  });

  test('3.13 Dashboard contains metric cards', async ({ page }) => {
    // MetricCards or similar dashboard widgets
    const cards = page.locator('.metric-card, .hd-card, [class*="metric"], [class*="card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

test.describe('UI Components — Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle', timeout: PAGE_LOAD_TIMEOUT });
    await page.click(SEL.navSettings);
    await page.waitForTimeout(500);
  });

  test('3.14 Settings page renders', async ({ page }) => {
    // At least one settings toggle should be visible
    const toggle = page.locator(SEL.settingsToggle).first();
    await expect(toggle).toBeVisible({ timeout: 5_000 });
  });

  test('3.15 Settings toggle switches are clickable', async ({ page }) => {
    const toggle = page.locator(SEL.settingsToggle).first();
    await expect(toggle).toBeVisible();

    // Get initial state
    const initialState = await toggle.getAttribute('aria-checked');

    // Click toggle
    await toggle.click();
    await page.waitForTimeout(300);

    // State should change
    const newState = await toggle.getAttribute('aria-checked');
    expect(newState).not.toBe(initialState);
  });

  test('3.16 Settings cards are rendered', async ({ page }) => {
    const cards = page.locator(SEL.settingsCard);
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('3.17 Settings labels are legible', async ({ page }) => {
    const labels = page.locator('.sp-row-label');
    const count = await labels.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const text = await labels.nth(i).innerText();
      expect(text.trim().length).toBeGreaterThan(0);
    }
  });
});

test.describe('UI Components — Responsive Layout', () => {
  const viewports = [
    { name: 'Desktop', width: 1440, height: 900 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 812 },
  ];

  for (const vp of viewports) {
    test(`3.18 App renders at ${vp.name} (${vp.width}×${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/', { waitUntil: 'networkidle' });

      // Page should not be blank
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.trim().length).toBeGreaterThan(0);

      // No JS errors during resize
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));
      await page.waitForTimeout(1000);
      expect(errors).toHaveLength(0);

      // Take screenshot for visual evidence
      await page.screenshot({
        path: `test-results/viewport-${vp.name.toLowerCase()}.png`,
        fullPage: true,
      });
    });
  }
});
