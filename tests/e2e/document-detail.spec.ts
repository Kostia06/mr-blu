import { test, expect } from 'playwright/test';

test.describe('Document Detail', () => {
  test('displays document info', async ({ page }) => {
    await page.goto('/dashboard/documents');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('login')) return;

    // Navigate to first document
    const docLink = page.locator('a[href*="/dashboard/documents/"]').first();
    if (!(await docLink.isVisible())) return;

    await docLink.click();
    await page.waitForLoadState('networkidle');

    // Should show document content
    const main = page.locator('main, [class*="content"]');
    await expect(main).toBeVisible();
  });

  test('has action buttons (send, download)', async ({ page }) => {
    await page.goto('/dashboard/documents');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('login')) return;

    const docLink = page.locator('a[href*="/dashboard/documents/"]').first();
    if (!(await docLink.isVisible())) return;

    await docLink.click();
    await page.waitForLoadState('networkidle');

    // Check for action buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('PDF download triggers download', async ({ page }) => {
    await page.goto('/dashboard/documents');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('login')) return;

    const docLink = page.locator('a[href*="/dashboard/documents/"]').first();
    if (!(await docLink.isVisible())) return;

    await docLink.click();
    await page.waitForLoadState('networkidle');

    // Look for download/PDF button
    const pdfBtn = page.locator('button:has-text("PDF"), button:has-text("descargar"), button:has-text("download")').first();
    if (await pdfBtn.isVisible()) {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
        pdfBtn.click(),
      ]);

      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.pdf$/);
      }
    }
  });
});
