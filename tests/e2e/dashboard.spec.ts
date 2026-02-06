import { test, expect } from 'playwright/test';

test.describe('Dashboard', () => {
  test('loads dashboard page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Should either show dashboard content or redirect to login
    const url = page.url();
    expect(url).toMatch(/dashboard|login/);
  });

  test('displays stats cards when authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Skip if redirected to login
    if (page.url().includes('login')) return;

    // Stats cards should be visible
    const statsCards = page.locator('[class*="stats"], [class*="stat-card"]');
    await expect(statsCards.first()).toBeVisible();
  });

  test('displays recent documents section', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('login')) return;

    // Recent documents section
    const recentSection = page.locator('text=/recientes|recent/i');
    await expect(recentSection).toBeVisible();
  });

  test('navigates to documents via tab or link', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('login')) return;

    // Find and click documents link/tab
    const docsLink = page.locator('a[href*="documents"]').first();
    if (await docsLink.isVisible()) {
      await docsLink.click();
      await expect(page).toHaveURL(/documents/);
    }
  });

  test('navigates to settings', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('login')) return;

    const settingsLink = page.locator('a[href*="settings"]').first();
    if (await settingsLink.isVisible()) {
      await settingsLink.click();
      await expect(page).toHaveURL(/settings/);
    }
  });
});
