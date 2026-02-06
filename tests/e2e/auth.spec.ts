import { test, expect } from 'playwright/test';

test.describe('Authentication', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/);
  });

  test('displays login page with magic link form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('mrblu');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('email input is required', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('submitting valid email shows success state', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('button[type="submit"]').click();

    // Should show the success/check email state
    await expect(page.locator('.success-state')).toBeVisible({ timeout: 10000 });
  });

  test('back link navigates to home', async ({ page }) => {
    await page.goto('/login');
    await page.locator('.back-link').click();
    await expect(page).toHaveURL('/');
  });

  test('logout redirects to login', async ({ page }) => {
    const response = await page.request.post('/auth/logout');
    expect(response.status()).toBeLessThan(400);
  });
});
