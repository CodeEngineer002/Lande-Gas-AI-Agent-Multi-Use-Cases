/**
 * Network & Console Monitor — shared test helper
 * ────────────────────────────────────────────────
 * Attaches to a Playwright Page and records:
 *  • Console errors / warnings
 *  • Failed network requests (4xx / 5xx / aborted)
 *  • Slow responses (> threshold)
 *
 * Usage:
 *   const monitor = new NetworkMonitor(page);
 *   monitor.start();
 *   // …interact with page…
 *   monitor.stop();
 *   expect(monitor.consoleErrors).toHaveLength(0);
 */

import type { Page, ConsoleMessage, Request, Response } from '@playwright/test';

export interface FailedRequest {
  url: string;
  status: number;
  method: string;
  resourceType: string;
}

export interface SlowResponse {
  url: string;
  durationMs: number;
  status: number;
}

export interface ConsoleEntry {
  type: string;
  text: string;
  location: string;
}

export class NetworkMonitor {
  readonly consoleErrors: ConsoleEntry[] = [];
  readonly consoleWarnings: ConsoleEntry[] = [];
  readonly failedRequests: FailedRequest[] = [];
  readonly slowResponses: SlowResponse[] = [];

  private page: Page;
  private slowThresholdMs: number;
  private requestTimings = new Map<Request, number>();
  private listening = false;

  // Internal bound handlers (for clean removal)
  private onConsole = (msg: ConsoleMessage) => {
    const entry: ConsoleEntry = {
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
        ? `${msg.location().url}:${msg.location().lineNumber}`
        : '',
    };
    if (msg.type() === 'error') this.consoleErrors.push(entry);
    if (msg.type() === 'warning') this.consoleWarnings.push(entry);
  };

  private onRequest = (req: Request) => {
    this.requestTimings.set(req, Date.now());
  };

  private onResponse = (res: Response) => {
    const req = res.request();
    const start = this.requestTimings.get(req);
    const status = res.status();

    // Failed requests (exclude common non-errors like redirects)
    if (status >= 400) {
      this.failedRequests.push({
        url: req.url(),
        status,
        method: req.method(),
        resourceType: req.resourceType(),
      });
    }

    // Slow responses
    if (start) {
      const duration = Date.now() - start;
      if (duration > this.slowThresholdMs) {
        this.slowResponses.push({
          url: req.url(),
          durationMs: duration,
          status,
        });
      }
    }
  };

  private onRequestFailed = (req: Request) => {
    this.failedRequests.push({
      url: req.url(),
      status: 0,
      method: req.method(),
      resourceType: req.resourceType(),
    });
  };

  constructor(page: Page, slowThresholdMs = 3000) {
    this.page = page;
    this.slowThresholdMs = slowThresholdMs;
  }

  /** Attach listeners */
  start(): void {
    if (this.listening) return;
    this.listening = true;
    this.page.on('console', this.onConsole);
    this.page.on('request', this.onRequest);
    this.page.on('response', this.onResponse);
    this.page.on('requestfailed', this.onRequestFailed);
  }

  /** Detach listeners */
  stop(): void {
    if (!this.listening) return;
    this.listening = false;
    this.page.off('console', this.onConsole);
    this.page.off('request', this.onRequest);
    this.page.off('response', this.onResponse);
    this.page.off('requestfailed', this.onRequestFailed);
  }

  /** Quick summary string */
  summary(): string {
    const lines: string[] = [];
    if (this.consoleErrors.length)
      lines.push(`❌ Console errors: ${this.consoleErrors.length}`);
    if (this.failedRequests.length)
      lines.push(`❌ Failed requests: ${this.failedRequests.length}`);
    if (this.slowResponses.length)
      lines.push(`⚠️  Slow responses: ${this.slowResponses.length}`);
    return lines.length ? lines.join('\n') : '✅ Clean — no errors detected';
  }

  /** Reset collected data */
  reset(): void {
    this.consoleErrors.length = 0;
    this.consoleWarnings.length = 0;
    this.failedRequests.length = 0;
    this.slowResponses.length = 0;
    this.requestTimings.clear();
  }
}
