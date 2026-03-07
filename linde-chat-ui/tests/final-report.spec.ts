/**
 * ╔════════════════════════════════════════════════════╗
 * ║  TEST 7 — Final Summary Report                     ║
 * ║  Aggregates all test artifacts and prints a         ║
 * ║  human-readable test execution summary.            ║
 * ╚════════════════════════════════════════════════════╝
 *
 * Run AFTER the main test suite:
 *   npx playwright test tests/final-report.spec.ts --project chromium
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const RESULTS_FILE = 'test-results/results.json';
const EVIDENCE_DIR = 'test-results/visual-evidence';

interface TestResult {
  title: string;
  status: 'passed' | 'failed' | 'skipped' | 'timedOut';
  duration: number;
  errors?: Array<{ message: string }>;
}

interface TestSuite {
  title: string;
  specs: Array<{
    title: string;
    tests: TestResult[];
  }>;
  suites?: TestSuite[];
}

function flattenResults(suites: TestSuite[]): TestResult[] {
  const results: TestResult[] = [];
  for (const suite of suites) {
    for (const spec of suite.specs || []) {
      for (const testResult of spec.tests || []) {
        results.push({
          title: `${suite.title} > ${spec.title}`,
          status: testResult.status,
          duration: testResult.duration,
          errors: testResult.errors,
        });
      }
    }
    if (suite.suites) {
      results.push(...flattenResults(suite.suites));
    }
  }
  return results;
}

test.describe('Final Report — Test Execution Summary', () => {
  test('7.1 Generate test summary report', async () => {
    let reportLines: string[] = [];

    reportLines.push('');
    reportLines.push('╔══════════════════════════════════════════════════════════════╗');
    reportLines.push('║       LINDE AI AGENT — E2E TEST EXECUTION REPORT           ║');
    reportLines.push('╠══════════════════════════════════════════════════════════════╣');
    reportLines.push(`║  Report Generated: ${new Date().toISOString()}     ║`);
    reportLines.push('╚══════════════════════════════════════════════════════════════╝');
    reportLines.push('');

    // 1. Parse JSON results if available
    if (fs.existsSync(RESULTS_FILE)) {
      try {
        const raw = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'));
        const results = flattenResults(raw.suites || []);

        const passed = results.filter((r) => r.status === 'passed').length;
        const failed = results.filter((r) => r.status === 'failed').length;
        const skipped = results.filter((r) => r.status === 'skipped').length;
        const total = results.length;
        const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

        reportLines.push('┌──────────────────────────────────────────┐');
        reportLines.push('│          TEST RESULTS SUMMARY            │');
        reportLines.push('├──────────────────────────────────────────┤');
        reportLines.push(`│  Total tests:    ${String(total).padStart(4)}                    │`);
        reportLines.push(`│  ✅ Passed:      ${String(passed).padStart(4)}                    │`);
        reportLines.push(`│  ❌ Failed:      ${String(failed).padStart(4)}                    │`);
        reportLines.push(`│  ⏭️  Skipped:     ${String(skipped).padStart(4)}                    │`);
        reportLines.push(`│  ⏱️  Duration:    ${(totalDuration / 1000).toFixed(1)}s                  │`);
        reportLines.push(`│  Pass Rate:      ${total > 0 ? ((passed / total) * 100).toFixed(1) : 0}%                │`);
        reportLines.push('└──────────────────────────────────────────┘');
        reportLines.push('');

        // Failed test details
        const failures = results.filter((r) => r.status === 'failed');
        if (failures.length > 0) {
          reportLines.push('┌──────────────────────────────────────────┐');
          reportLines.push('│          FAILED TESTS                    │');
          reportLines.push('├──────────────────────────────────────────┤');
          for (const f of failures) {
            reportLines.push(`│  ❌ ${f.title.substring(0, 38).padEnd(38)}│`);
            if (f.errors?.[0]) {
              const errMsg = f.errors[0].message.split('\n')[0].substring(0, 36);
              reportLines.push(`│     → ${errMsg.padEnd(35)}│`);
            }
          }
          reportLines.push('└──────────────────────────────────────────┘');
          reportLines.push('');
        }
      } catch (e) {
        reportLines.push(`⚠️  Could not parse results file: ${(e as Error).message}`);
        reportLines.push('');
      }
    } else {
      reportLines.push('ℹ️  No results.json found — run the full suite first.');
      reportLines.push('   npx playwright test --project chromium');
      reportLines.push('');
    }

    // 2. Visual evidence inventory
    reportLines.push('┌──────────────────────────────────────────┐');
    reportLines.push('│        VISUAL EVIDENCE FILES             │');
    reportLines.push('├──────────────────────────────────────────┤');

    if (fs.existsSync(EVIDENCE_DIR)) {
      const files = fs.readdirSync(EVIDENCE_DIR).filter((f) => f.endsWith('.png'));
      if (files.length > 0) {
        for (const file of files) {
          const stat = fs.statSync(path.join(EVIDENCE_DIR, file));
          const sizeKB = (stat.size / 1024).toFixed(0);
          reportLines.push(`│  📸 ${file.padEnd(30)} ${sizeKB.padStart(4)}KB │`);
        }
      } else {
        reportLines.push('│  No screenshots captured yet.            │');
      }
    } else {
      reportLines.push('│  Visual evidence directory not found.    │');
    }
    reportLines.push('└──────────────────────────────────────────┘');
    reportLines.push('');

    // 3. Test file inventory
    const testDir = path.resolve('tests');
    reportLines.push('┌──────────────────────────────────────────┐');
    reportLines.push('│        TEST FILE INVENTORY               │');
    reportLines.push('├──────────────────────────────────────────┤');
    if (fs.existsSync(testDir)) {
      const testFiles = fs.readdirSync(testDir).filter((f) => f.endsWith('.spec.ts'));
      for (const file of testFiles) {
        reportLines.push(`│  📄 ${file.padEnd(37)}│`);
      }
    }
    reportLines.push('└──────────────────────────────────────────┘');
    reportLines.push('');

    reportLines.push('═══════════════════════════════════════════');
    reportLines.push('  View full HTML report:');
    reportLines.push('    npx playwright show-report');
    reportLines.push('═══════════════════════════════════════════');
    reportLines.push('');

    // Print the report
    const report = reportLines.join('\n');
    console.log(report);

    // Save to file
    const reportPath = 'test-results/FINAL_REPORT.txt';
    fs.mkdirSync('test-results', { recursive: true });
    fs.writeFileSync(reportPath, report, 'utf-8');
    console.log(`Report saved to: ${reportPath}`);

    expect(true).toBeTruthy();
  });
});
