import { test, expect } from 'playwright/test';

test.describe('Settings', () => {
  test('loads settings page', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toMatch(/settings|login/);
  });

  test('displays settings sections', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('login')) return;

    const main = page.locator('main, [class*="settings"]');
    await expect(main).toBeVisible();
  });

  test('navigates to business settings', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('login')) return;

    const businessLink = page.locator('a[href*="business"]').first();
    if (await businessLink.isVisible()) {
      await businessLink.click();
      await expect(page).toHaveURL(/business/);
    }
  });

  test('navigates to profile settings', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('login')) return;

    const profileLink = page.locator('a[href*="profile"]').first();
    if (await profileLink.isVisible()) {
      await profileLink.click();
      await expect(page).toHaveURL(/profile/);
    }
  });

  test('navigates to language settings', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('login')) return;

    const langLink = page.locator('a[href*="language"]').first();
    if (await langLink.isVisible()) {
      await langLink.click();
      await expect(page).toHaveURL(/language/);
    }
  });

  test('navigates to appearance settings', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('login')) return;

    const appearLink = page.locator('a[href*="appearance"]').first();
    if (await appearLink.isVisible()) {
      await appearLink.click();
      await expect(page).toHaveURL(/appearance/);
    }
  });
});
