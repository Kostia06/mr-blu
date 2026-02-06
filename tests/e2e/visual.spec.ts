import { test, expect } from 'playwright/test';

const pages = [
  { name: 'login', path: '/login' },
  { name: 'landing', path: '/' },
];

for (const { name, path } of pages) {
  test(`${name} page visual regression`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Let animations settle

    await expect(page).toHaveScreenshot(`${name}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
    });
  });
}

// Authenticated pages — these will show login redirect if not authenticated,
// which is still useful for visual regression of the redirect flow
const authPages = [
  { name: 'dashboard', path: '/dashboard' },
  { name: 'documents', path: '/dashboard/documents' },
  { name: 'settings', path: '/dashboard/settings' },
  { name: 'review', path: '/dashboard/review' },
];

for (const { name, path } of authPages) {
  test(`${name} page visual regression`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot(`${name}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
    });
  });
}
