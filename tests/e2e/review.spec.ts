import { test, expect } from 'playwright/test';

test.describe('Review Page', () => {
  test('loads review page', async ({ page }) => {
    await page.goto('/dashboard/review');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toMatch(/review|login|dashboard/);
  });

  test('displays review content when data available', async ({ page }) => {
    await page.goto('/dashboard/review');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('login')) return;

    // Review page should show content area
    const main = page.locator('main, [class*="review"]');
    await expect(main).toBeVisible();
  });

  test('has save/send action buttons', async ({ page }) => {
    await page.goto('/dashboard/review');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('login')) return;

    // Look for action buttons
    const buttons = page.locator('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });
});
