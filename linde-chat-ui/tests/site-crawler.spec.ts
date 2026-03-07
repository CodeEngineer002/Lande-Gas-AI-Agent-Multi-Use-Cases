import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:4000';
const CRAWL_TIMEOUT = 60_000; // max time per page navigation
const MAX_PAGES = 100; // safety cap

interface PageReport {
  url: string;
  consoleErrors: string[];
  failedRequests: { url: string; status: number | string }[];
}

interface BrokenLink {
  sourceUrl: string;
  href: string;
  status: number | string;
}

/**
 * Crawl the entire site starting from BASE_URL.
 * Collects every same-origin link, visits each page once,
 * and records console errors + failed network requests.
 */
async function crawlSite(page: Page) {
  const visited = new Set<string>();
  const queue: string[] = ['/'];
  const pageReports: PageReport[] = [];
  const brokenLinks: BrokenLink[] = [];

  while (queue.length > 0 && visited.size < MAX_PAGES) {
    const path = queue.shift()!;
    const fullUrl = new URL(path, BASE_URL).href;

    // Normalize: strip hash, trailing slash for dedup
    const normalized = normalizeUrl(fullUrl);
    if (visited.has(normalized)) continue;
    visited.add(normalized);

    const consoleErrors: string[] = [];
    const failedRequests: { url: string; status: number | string }[] = [];

    // Listen for console errors
    const onConsoleMsg = (msg: import('@playwright/test').ConsoleMessage) => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[console.error] ${msg.text()}`);
      }
    };
    page.on('console', onConsoleMsg);

    // Listen for failed network requests
    const onResponse = (response: import('@playwright/test').Response) => {
      const status = response.status();
      if (status >= 400) {
        failedRequests.push({ url: response.url(), status });
      }
    };
    page.on('response', onResponse);

    const onRequestFailed = (request: import('@playwright/test').Request) => {
      failedRequests.push({
        url: request.url(),
        status: request.failure()?.errorText || 'ERR_FAILED',
      });
    };
    page.on('requestfailed', onRequestFailed);

    try {
      const response = await page.goto(fullUrl, {
        waitUntil: 'networkidle',
        timeout: CRAWL_TIMEOUT,
      });

      // Check if the page itself returned an error
      if (response && response.status() >= 400) {
        brokenLinks.push({
          sourceUrl: 'direct navigation',
          href: fullUrl,
          status: response.status(),
        });
      }

      // Wait a bit for any lazy-loaded content / JS errors
      await page.waitForTimeout(1000);

      // Extract all same-origin links from the page
      const links = await page.evaluate((baseOrigin: string) => {
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        return anchors
          .map((a) => {
            try {
              const url = new URL((a as HTMLAnchorElement).href, document.baseURI);
              return url.origin === baseOrigin ? url.pathname + url.search : null;
            } catch {
              return null;
            }
          })
          .filter((href): href is string => href !== null);
      }, new URL(BASE_URL).origin);

      // Add new links to queue
      for (const link of links) {
        const norm = normalizeUrl(new URL(link, BASE_URL).href);
        if (!visited.has(norm) && !queue.includes(link)) {
          queue.push(link);
        }
      }
    } catch (error) {
      failedRequests.push({
        url: fullUrl,
        status: `Navigation error: ${(error as Error).message}`,
      });
    } finally {
      page.removeListener('console', onConsoleMsg);
      page.removeListener('response', onResponse);
      page.removeListener('requestfailed', onRequestFailed);
    }

    pageReports.push({ url: fullUrl, consoleErrors, failedRequests });
  }

  return { pageReports, brokenLinks, visited };
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = '';
    // Remove trailing slash except for root
    let path = u.pathname;
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    return u.origin + path + u.search;
  } catch {
    return url;
  }
}

// ─── Test: Broken Links ──────────────────────────────────────────
test.describe('Site Crawler — localhost:4000', () => {
  test.setTimeout(5 * 60_000); // 5 min total timeout for crawl

  let pageReports: PageReport[];
  let brokenLinks: BrokenLink[];
  let visitedCount: number;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const result = await crawlSite(page);
    pageReports = result.pageReports;
    brokenLinks = result.brokenLinks;
    visitedCount = result.visited.size;
    await page.close();

    // Print crawl summary
    console.log(`\n════════════════════════════════════════`);
    console.log(`  CRAWL COMPLETE: ${visitedCount} pages visited`);
    console.log(`════════════════════════════════════════\n`);
  });

  test('should have no broken links (4xx/5xx on navigation)', () => {
    if (brokenLinks.length > 0) {
      const report = brokenLinks
        .map((l) => `  ✗ ${l.href} → ${l.status} (from: ${l.sourceUrl})`)
        .join('\n');
      console.log(`\n🔗 BROKEN LINKS:\n${report}\n`);
    }
    expect(brokenLinks, `Found ${brokenLinks.length} broken link(s):\n${JSON.stringify(brokenLinks, null, 2)}`).toHaveLength(0);
  });

  test('should have no console errors on any page', () => {
    const pagesWithErrors = pageReports.filter((p) => p.consoleErrors.length > 0);

    if (pagesWithErrors.length > 0) {
      const report = pagesWithErrors
        .map((p) => `  Page: ${p.url}\n${p.consoleErrors.map((e) => `    ✗ ${e}`).join('\n')}`)
        .join('\n\n');
      console.log(`\n🛑 CONSOLE ERRORS:\n${report}\n`);
    }

    expect(
      pagesWithErrors,
      `Found console errors on ${pagesWithErrors.length} page(s):\n${JSON.stringify(pagesWithErrors, null, 2)}`
    ).toHaveLength(0);
  });

  test('should have no failed network requests on any page', () => {
    const pagesWithFailures = pageReports.filter((p) => p.failedRequests.length > 0);

    if (pagesWithFailures.length > 0) {
      const report = pagesWithFailures
        .map(
          (p) =>
            `  Page: ${p.url}\n${p.failedRequests.map((r) => `    ✗ ${r.url} → ${r.status}`).join('\n')}`
        )
        .join('\n\n');
      console.log(`\n❌ FAILED NETWORK REQUESTS:\n${report}\n`);
    }

    expect(
      pagesWithFailures,
      `Failed requests on ${pagesWithFailures.length} page(s):\n${JSON.stringify(pagesWithFailures, null, 2)}`
    ).toHaveLength(0);
  });

  test('should have crawled at least the homepage', () => {
    expect(visitedCount).toBeGreaterThanOrEqual(1);
  });
});
