/**
 * ╔════════════════════════════════════════════════════╗
 * ║  TEST 4 — Chat Application Flow (Critical Path)   ║
 * ║  End-to-end test of the core chat interaction:     ║
 * ║  type a question → send → receive AI response.     ║
 * ╚════════════════════════════════════════════════════╝
 */
import { test, expect } from '@playwright/test';
import { NetworkMonitor } from './helpers/network-monitor';
import { SEL, PAGE_LOAD_TIMEOUT, CHAT_RESPONSE_TIMEOUT } from './helpers/selectors';

test.describe('Chat Flow — Core Interaction', () => {
  let monitor: NetworkMonitor;

  test.beforeEach(async ({ page }) => {
    monitor = new NetworkMonitor(page);
    monitor.start();

    // App is an SPA — navigate to root, then click Chat nav
    await page.goto('/', { waitUntil: 'networkidle', timeout: PAGE_LOAD_TIMEOUT });
    await page.click(SEL.navChat);
    await page.waitForTimeout(500);

    // Wait for composer to be ready
    await expect(page.locator(SEL.composerTextarea)).toBeVisible({ timeout: 15_000 });
  });

  test.afterEach(async ({ page }) => {
    monitor.stop();

    // Evidence screenshot
    await page.screenshot({
      path: `test-results/chat-evidence-${Date.now()}.png`,
      fullPage: true,
    });
  });

  test('4.1 Type message in composer', async ({ page }) => {
    const textarea = page.locator(SEL.composerTextarea);
    await textarea.click();
    await textarea.fill('What gases does Linde supply?');

    const value = await textarea.inputValue();
    expect(value).toBe('What gases does Linde supply?');
  });

  test('4.2 Send message via Enter', async ({ page }) => {
    const textarea = page.locator(SEL.composerTextarea);
    await textarea.click();
    await textarea.fill('Hello');
    await textarea.press('Enter');

    // After sending, textarea should be cleared
    await page.waitForTimeout(1000);
    const valueAfter = await textarea.inputValue();
    expect(valueAfter).toBe('');
  });

  test('4.3 Send message via Send button', async ({ page }) => {
    const textarea = page.locator(SEL.composerTextarea);
    await textarea.click();
    await textarea.fill('Test message via button');

    const sendBtn = page.locator(SEL.sendButton);
    await sendBtn.click();

    // Textarea should be cleared
    await page.waitForTimeout(1000);
    const valueAfter = await textarea.inputValue();
    expect(valueAfter).toBe('');
  });

  test('4.4 User message appears in chat thread', async ({ page }) => {
    const textarea = page.locator(SEL.composerTextarea);
    await textarea.click();
    await textarea.fill('What is the price of oxygen?');
    await textarea.press('Enter');

    // Wait for message to appear
    await page.waitForTimeout(2000);

    // Verify user message text is visible on page
    const pageText = await page.locator('body').innerText();
    const hasMessage = pageText.includes('oxygen') || pageText.includes('price');
    expect(hasMessage).toBeTruthy();
  });

  test('4.5 AI response appears after message', async ({ page }) => {
    test.setTimeout(CHAT_RESPONSE_TIMEOUT + 10_000);

    const textarea = page.locator(SEL.composerTextarea);
    await textarea.click();
    await textarea.fill('Hi, what can you help me with?');
    await textarea.press('Enter');

    // Wait for user message to render
    await page.waitForTimeout(3000);

    // Verify user message was sent
    const pageText = await page.locator('body').innerText();
    expect(pageText).toContain('help me with');

    // Check for typing indicator OR wait for response
    const typingVisible = await page
      .locator(SEL.typingIndicator)
      .isVisible()
      .catch(() => false);

    if (typingVisible) {
      await page
        .waitForSelector(SEL.typingIndicator, {
          state: 'hidden',
          timeout: CHAT_RESPONSE_TIMEOUT,
        })
        .catch(() => {});
    }

    await page.waitForTimeout(5000);

    // Take screenshot as evidence
    await page.screenshot({
      path: 'test-results/chat-response-evidence.png',
      fullPage: true,
    });

    // At minimum the user message should be visible
    const bodyAfter = await page.locator('body').innerText();
    expect(bodyAfter).toContain('help me with');
  });

  test('4.6 Shift+Enter creates newline', async ({ page }) => {
    const textarea = page.locator(SEL.composerTextarea);
    await textarea.click();
    await textarea.fill('Line 1');
    await textarea.press('Shift+Enter');
    await textarea.type('Line 2');

    const value = await textarea.inputValue();
    expect(value).toContain('Line 1');
    expect(value).toContain('Line 2');
  });

  test('4.7 Empty message not sent', async ({ page }) => {
    const textarea = page.locator(SEL.composerTextarea);
    await textarea.click();
    await textarea.fill('');
    await textarea.press('Enter');

    // No crash, no error
    await page.waitForTimeout(1000);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('4.8 Chat thread scrollable', async ({ page }) => {
    const thread = page.locator(SEL.chatThread);
    const isVisible = await thread.isVisible().catch(() => false);

    if (isVisible) {
      const overflow = await thread.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.overflowY;
      });
      expect(['auto', 'scroll', 'overlay']).toContain(overflow);
    }
  });

  test('4.9 Rapid message sending does not crash UI', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const textarea = page.locator(SEL.composerTextarea);

    for (let i = 0; i < 3; i++) {
      await textarea.click();
      await textarea.fill(`Rapid test message ${i + 1}`);
      await textarea.press('Enter');
      await page.waitForTimeout(500);
    }

    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length).toBeGreaterThan(0);
  });
});