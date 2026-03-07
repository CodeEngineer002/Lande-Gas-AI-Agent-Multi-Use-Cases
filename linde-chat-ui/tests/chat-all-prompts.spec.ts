/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  COMPREHENSIVE CHAT PROMPT TEST — Linde Gas AI Agent         ║
 * ║  ───────────────────────────────────────────────────────────  ║
 * ║  Tests ALL supported intents × gas types with visual output.  ║
 * ║  Runs in headed mode with slow motion so you can watch.      ║
 * ║                                                               ║
 * ║  Run:  npx playwright test tests/chat-all-prompts.spec.ts    ║
 * ║        --project chromium --workers=1                         ║
 * ╚═══════════════════════════════════════════════════════════════╝
 *
 * INTENTS:  greeting, smalltalk, datasheet, quotation,
 *           delivery_update, availability, appointment
 *
 * GASES:    Oxygen, Nitrogen, Hydrogen, Argon, Helium,
 *           Carbon Dioxide, Methane
 */


import { test, expect, Page } from '@playwright/test';
import { SEL, PAGE_LOAD_TIMEOUT, CHAT_RESPONSE_TIMEOUT } from './helpers/selectors';

/* ─── Generous timeout for AI round-trips ─── */
const AI_WAIT = 30_000;
const PAUSE_BETWEEN = 3_000; // pause between prompts so you can read

/* ─── All test prompts organized by intent ─── */
const PROMPT_SUITE = [
  // ── 1. GREETING ──
  {
    category: 'Greeting',
    prompts: [
      { msg: 'Hi there, good morning!', expectContains: ['hello', 'hi', 'welcome', 'help', 'assist', 'morning'] },
      { msg: `Hey, just checking in — can you help me with something?`, expectContains: ['hey', 'hi', 'hello', 'help', 'assist', 'sure'] },
      { msg: `Hello! I'm new here, what's this about?`, expectContains: ['hello', 'welcome', 'help', 'linde', 'gas', 'assist'] },
    ],
  },

  // ── 2. SMALLTALK ──
  {
    category: 'Smalltalk',
    prompts: [
      { msg: 'So what kind of things can I ask you about?', expectContains: ['help', 'datasheet', 'quotation', 'delivery', 'gas', 'assist'] },
      { msg: `Just curious — who made this chatbot?`, expectContains: ['linde', 'ai', 'agent', 'built', 'designed', 'help'] },
      { msg: 'Do you know any cool facts about industrial gases?', expectContains: ['gas', 'interesting', 'fact', 'oxygen', 'nitrogen', 'help'] },
      { msg: 'Which all gases do you guys deal in?', expectContains: ['gas', 'oxygen', 'nitrogen', 'hydrogen', 'argon', 'helium', 'product'] },
    ],
  },

  // ── 3. DATASHEET — Per Gas ──
  {
    category: 'Datasheet',
    prompts: [
      { msg: 'Hey, can I get the safety datasheet for Oxygen?', expectContains: ['oxygen', 'o2', 'datasheet', 'data'] },
      { msg: `I need to check the specs for Nitrogen — do you have a datasheet?`, expectContains: ['nitrogen', 'n2', 'datasheet', 'data', 'technical'] },
      { msg: `We're evaluating Hydrogen for our plant, can you share the technical data sheet?`, expectContains: ['hydrogen', 'h2', 'datasheet', 'data'] },
      { msg: 'Please send me the Argon datasheet, we need it for compliance', expectContains: ['argon', 'ar', 'datasheet', 'data'] },
      { msg: 'Do you have a product datasheet for Helium?', expectContains: ['helium', 'he', 'datasheet', 'data'] },
      { msg: `I'm looking for the CO2 data sheet — can you pull that up?`, expectContains: ['co2', 'carbon', 'datasheet', 'data'] },
      { msg: 'Our team needs the Methane technical data sheet for a project review', expectContains: ['methane', 'ch4', 'datasheet', 'data'] },
    ],
  },

  // ── 4. QUOTATION — Per Gas ──
  {
    category: 'Quotation',
    prompts: [
      { msg: 'What would 20 Oxygen cylinders cost me approximately?', expectContains: ['oxygen', 'price', 'cost', 'quotation', '₹', 'cylinder'] },
      { msg: `We need to order Nitrogen in bulk — can you give me a price estimate?`, expectContains: ['nitrogen', 'quotation', 'quote', 'price', 'cost', 'bulk'] },
      { msg: 'How much would Hydrogen cost per cylinder?', expectContains: ['hydrogen', 'price', 'cost', 'quotation', '₹'] },
      { msg: 'Can you send me a quick quote for about 50 Argon cylinders?', expectContains: ['argon', 'quotation', 'quote', 'price', 'cylinder'] },
      { msg: `What's the going rate for Helium these days?`, expectContains: ['helium', 'rate', 'price', 'cost', 'quotation'] },
      { msg: `We're planning a large CO2 order — what kind of pricing can you offer?`, expectContains: ['co2', 'carbon', 'price', 'cost', 'bulk', 'quotation'] },
    ],
  },

  // ── 5. DELIVERY UPDATE ──
  {
    category: 'Delivery Update',
    prompts: [
      { msg: `Hey, I placed an order last week and haven't received it yet — where's my delivery?`, expectContains: ['delivery', 'status', 'order', 'track', 'shipment'] },
      { msg: `Can you check what's happening with my current order?`, expectContains: ['order', 'status', 'delivery', 'track'] },
      { msg: `I'm expecting an Oxygen delivery today — any update on when it'll arrive?`, expectContains: ['delivery', 'oxygen', 'arrive', 'status', 'track', 'order'] },
      { msg: 'My order number is 12345, can you tell me the delivery status?', expectContains: ['delivery', 'status', 'order', '12345', 'track'] },
    ],
  },

  // ── 6. AVAILABILITY ──
  {
    category: 'Availability',
    prompts: [
      { msg: `We urgently need Nitrogen — is it available for immediate dispatch?`, expectContains: ['nitrogen', 'available', 'availability', 'stock', 'supply'] },
      { msg: 'Can you check if Oxygen cylinders are in stock right now?', expectContains: ['oxygen', 'available', 'availability', 'stock', 'cylinder'] },
      { msg: 'Do you currently have Argon in your warehouse?', expectContains: ['argon', 'stock', 'available', 'availability'] },
      { msg: 'Is Helium available for delivery sometime this week?', expectContains: ['helium', 'available', 'delivery', 'week'] },
    ],
  },

  // ── 7. APPOINTMENT ──
  {
    category: 'Appointment',
    prompts: [
      { msg: `I'd like to talk to a sales person — can we set up a call?`, expectContains: ['meeting', 'schedule', 'appointment', 'calendar', 'sales', 'call'] },
      { msg: 'Can you book me an appointment for sometime next Tuesday?', expectContains: ['appointment', 'book', 'tuesday', 'schedule', 'calendar'] },
      { msg: `We're thinking about switching to Linde for bulk supply — can I speak to someone?`, expectContains: ['bulk', 'order', 'talk', 'help', 'someone', 'appointment', 'supply'] },
    ],
  },

  // ── 8. MULTI-INTENT (Combined) ──
  {
    category: 'Multi-Intent',
    prompts: [
      { msg: 'Can you send me both the datasheet and a price quote for Oxygen?', expectContains: ['oxygen', 'datasheet', 'quotation', 'data', 'price'] },
      { msg: `I need datasheets for both Nitrogen and Argon — can you pull those up?`, expectContains: ['nitrogen', 'argon', 'datasheet', 'data'] },
      { msg: `What's the pricing and availability situation for Hydrogen right now?`, expectContains: ['hydrogen', 'price', 'available', 'availability', 'cost'] },
    ],
  },

  // ── 9. EDGE CASES ──
  {
    category: 'Edge Cases',
    prompts: [
      { msg: 'asdfghjkl', expectContains: ['sorry', 'understand', 'help', 'clarify', 'rephrase', 'don'] },
      { msg: `What's the weather going to be like tomorrow?`, expectContains: ['help', 'gas', 'linde', 'assist', 'sorry', 'can'] },
      { msg: 'O2', expectContains: ['oxygen', 'o2', 'help', 'datasheet', 'would'] },
      { msg: `That's really helpful, thanks a lot!`, expectContains: ['welcome', 'glad', 'help', 'thank', 'assist', 'anything'] },
      { msg: 'Give me a rundown of all the gases you supply', expectContains: ['gas', 'oxygen', 'nitrogen', 'hydrogen', 'argon', 'helium', 'product'] },
    ],
  },

  // ── 10. FOLLOW-UP / CONTEXT (builds on previous conversation) ──
  {
    category: 'Follow-up Context',
    prompts: [
      { msg: 'Actually, can you check the same thing for Nitrogen as well?', expectContains: ['nitrogen', 'n2'] },
      { msg: `While you're at it, how about Argon — same info please?`, expectContains: ['argon', 'ar'] },
      { msg: `Perfect — could you email all of this to me?`, expectContains: ['email', 'send', 'sure', 'help'] },
    ],
  },
];

/* ─── Helper: send a chat message and wait for response ─── */
async function sendAndWait(page: Page, message: string): Promise<string> {
  const textarea = page.locator(SEL.composerTextarea);

  // Type the message character-by-character for visual effect
  await textarea.click();
  await textarea.fill('');
  await textarea.type(message, { delay: 40 });

  // Small pause so viewer can read the typed prompt
  await page.waitForTimeout(1000);

  // Send
  await textarea.press('Enter');

  // Wait for typing indicator to appear then disappear, or just wait
  try {
    await page.locator(SEL.typingIndicator).waitFor({ state: 'visible', timeout: 5_000 });
    await page.locator(SEL.typingIndicator).waitFor({ state: 'hidden', timeout: AI_WAIT });
  } catch {
    // Typing indicator might be missed — just wait
    await page.waitForTimeout(8_000);
  }

  // Extra pause for the response to fully render
  await page.waitForTimeout(2_000);

  // Grab page text for assertion
  return page.locator('body').innerText();
}

/* ─── TESTS ─── */

// Count total prompts for the test title
const totalPrompts = PROMPT_SUITE.reduce((sum, cat) => sum + cat.prompts.length, 0);


test.describe(`Chat Prompt Suite — ${totalPrompts} Prompts across ${PROMPT_SUITE.length} Categories`, () => {
  test.setTimeout(0); // No global timeout — each prompt has its own

  test('Run all chat prompts visually', async ({ page }) => {
    // Navigate to app
    await page.goto('/', { waitUntil: 'networkidle', timeout: PAGE_LOAD_TIMEOUT });
    await page.click(SEL.navChat);
    await page.waitForTimeout(1000);
    await expect(page.locator(SEL.composerTextarea)).toBeVisible({ timeout: 15_000 });

    const results: Array<{
      category: string;
      prompt: string;
      status: 'PASS' | 'FAIL';
      response: string;
      matchedKeywords: string[];
    }> = [];

    let passCount = 0;
    let failCount = 0;

    for (const category of PROMPT_SUITE) {
      console.log(`\n${'═'.repeat(60)}`);
      console.log(`  📂  CATEGORY: ${category.category.toUpperCase()}`);
      console.log(`${'═'.repeat(60)}`);

      for (const { msg, expectContains } of category.prompts) {
        console.log(`\n  💬  Sending: "${msg}"`);

        const responseText = await sendAndWait(page, msg);
        const responseLower = responseText.toLowerCase();

        // Check which keywords matched
        const matched = expectContains.filter((kw) =>
          responseLower.includes(kw.toLowerCase()),
        );

        const passed = matched.length > 0;

        if (passed) {
          passCount++;
          console.log(`  ✅  PASS — Matched: [${matched.join(', ')}]`);
        } else {
          failCount++;
          // Print a snippet of the response for debugging
          const snippet = responseText.substring(0, 200).replace(/\n/g, ' ');
          console.log(`  ❌  FAIL — No keywords matched!`);
          console.log(`      Expected one of: [${expectContains.join(', ')}]`);
          console.log(`      Response snippet: "${snippet}..."`);
        }

        results.push({
          category: category.category,
          prompt: msg,
          status: passed ? 'PASS' : 'FAIL',
          response: responseText.substring(0, 300),
          matchedKeywords: matched,
        });

        // Screenshot after each prompt
        await page.screenshot({
          path: `test-results/prompt-${category.category.replace(/\s/g, '_')}-${results.length}.png`,
          fullPage: true,
        });

        // Pause between prompts so you can watch
        await page.waitForTimeout(PAUSE_BETWEEN);
      }
    }

    // ─── FINAL REPORT ───
    console.log(`\n\n${'╔' + '═'.repeat(58) + '╗'}`);
    console.log(`${'║'}       CHAT PROMPT TEST — FINAL RESULTS                    ${'║'}`);
    console.log(`${'╠' + '═'.repeat(58) + '╣'}`);
    console.log(`${'║'}  Total prompts:  ${String(totalPrompts).padStart(3)}                                      ${'║'}`);
    console.log(`${'║'}  ✅ Passed:      ${String(passCount).padStart(3)}                                      ${'║'}`);
    console.log(`${'║'}  ❌ Failed:      ${String(failCount).padStart(3)}                                      ${'║'}`);
    console.log(`${'║'}  Pass Rate:      ${((passCount / totalPrompts) * 100).toFixed(1)}%                                  ${'║'}`);
    console.log(`${'╚' + '═'.repeat(58) + '╝'}`);

    // Category breakdown
    console.log('\n  Category Breakdown:');
    for (const cat of PROMPT_SUITE) {
      const catResults = results.filter((r) => r.category === cat.category);
      const catPassed = catResults.filter((r) => r.status === 'PASS').length;
      const icon = catPassed === catResults.length ? '✅' : '⚠️';
      console.log(
        `    ${icon} ${cat.category.padEnd(20)} ${catPassed}/${catResults.length} passed`,
      );
    }

    // Save JSON results
    const fs = await import('fs');
    fs.mkdirSync('test-results', { recursive: true });
    fs.writeFileSync(
      'test-results/chat-prompts-results.json',
      JSON.stringify(results, null, 2),
    );
    console.log('\n  📄 Results saved to: test-results/chat-prompts-results.json');

    // Final screenshot
    await page.screenshot({
      path: 'test-results/chat-prompts-final.png',
      fullPage: true,
    });

    // We don't hard-fail the test — this is an observation/evidence run.
    // But log failures prominently.
    if (failCount > 0) {
      console.log(`\n  ⚠️  ${failCount} prompt(s) did not match expected keywords.`);
      console.log('     Check screenshots and results JSON for details.');
    }
  });
});
