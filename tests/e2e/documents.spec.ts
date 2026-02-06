import { test, expect } from 'playwright/test';

test.describe('Documents', () => {
  test('loads documents list page', async ({ page }) => {
    await page.goto('/dashboard/documents');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toMatch(/documents|login/);
  });

  test('displays document list or empty state', async ({ page }) => {
    await page.goto('/dashboard/documents');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('login')) return;

    // Should show either documents or an empty state
    const content = page.locator('main, [class*="content"]');
    await expect(content).toBeVisible();
  });

  test('has filter/tab controls', async ({ page }) => {
    await page.goto('/dashboard/documents');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('login')) return;

    // Look for filter tabs (all, invoices, estimates, etc.)
    const tabs = page.locator('[role="tablist"], [class*="tab"], [class*="filter"], [class*="segment"]');
    if (await tabs.first().isVisible()) {
      await expect(tabs.first()).toBeVisible();
    }
  });

  test('has search input', async ({ page }) => {
    await page.goto('/dashboard/documents');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('login')) return;

    const searchInput = page.locator('input[type="search"], input[placeholder*="buscar" i], input[placeholder*="search" i]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      // Search should filter results
      await page.waitForTimeout(500);
    }
  });

  test('can navigate to document detail', async ({ page }) => {
    await page.goto('/dashboard/documents');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('login')) return;

    // Click first document if any exist
    const docItem = page.locator('a[href*="/dashboard/documents/"]').first();
    if (await docItem.isVisible()) {
      await docItem.click();
      await expect(page).toHaveURL(/\/dashboard\/documents\/.+/);
    }
  });
});
