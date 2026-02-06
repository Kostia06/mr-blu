import { defineConfig, devices } from 'playwright/test';

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    // ── Visual regression (Storybook) ──
    {
      name: 'visual-mobile',
      testDir: './tests/visual',
      use: {
        ...devices['iPhone 14'],
        baseURL: 'http://localhost:6006',
      },
    },
    {
      name: 'visual-desktop',
      testDir: './tests/visual',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:6006',
      },
    },

    // ── E2E (App) — Mobile ──
    {
      name: 'iPhone SE',
      testDir: './tests/e2e',
      use: {
        ...devices['iPhone SE'],
        baseURL: 'http://localhost:4173',
      },
    },
    {
      name: 'iPhone 14',
      testDir: './tests/e2e',
      use: {
        ...devices['iPhone 14'],
        baseURL: 'http://localhost:4173',
      },
    },
    {
      name: 'iPhone 14 Pro Max',
      testDir: './tests/e2e',
      use: {
        ...devices['iPhone 14 Pro Max'],
        baseURL: 'http://localhost:4173',
      },
    },
    {
      name: 'Pixel 7',
      testDir: './tests/e2e',
      use: {
        ...devices['Pixel 7'],
        baseURL: 'http://localhost:4173',
      },
    },

    // ── E2E (App) — Tablet ──
    {
      name: 'iPad Mini',
      testDir: './tests/e2e',
      use: {
        ...devices['iPad Mini'],
        baseURL: 'http://localhost:4173',
      },
    },
    {
      name: 'iPad Pro 11',
      testDir: './tests/e2e',
      use: {
        ...devices['iPad Pro 11'],
        baseURL: 'http://localhost:4173',
      },
    },

    // ── E2E (App) — Desktop ──
    {
      name: 'Desktop Chrome',
      testDir: './tests/e2e',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:4173',
      },
    },
    {
      name: 'Desktop Safari',
      testDir: './tests/e2e',
      use: {
        ...devices['Desktop Safari'],
        baseURL: 'http://localhost:4173',
      },
    },
    {
      name: 'Desktop Firefox',
      testDir: './tests/e2e',
      use: {
        ...devices['Desktop Firefox'],
        baseURL: 'http://localhost:4173',
      },
    },
  ],
  webServer: [
    {
      command: 'npm run storybook -- --ci',
      url: 'http://localhost:6006',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'npm run preview',
      port: 4173,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
  ],
});
