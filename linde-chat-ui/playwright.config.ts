import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',

  fullyParallel: true,
  retries: 1,

  timeout: 60000,

  expect: {
    timeout: 10000,
  },

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  use: {
    baseURL: 'http://localhost:4000',

    headless: false,

    screenshot: 'only-on-failure',

    video: 'retain-on-failure',

    trace: 'retain-on-failure',

    actionTimeout: 15000,

    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--start-maximized'], // Open browser in full screen
        },
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4000',
    reuseExistingServer: true,
    timeout: 120000,
  },
});