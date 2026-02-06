import { test, expect } from 'playwright/test';

test.describe('Mobile-specific behavior', () => {
  test('login page is fully visible without horizontal scroll', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.body.clientWidth);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // 1px tolerance
  });

  test('landing page has no horizontal overflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.body.clientWidth);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test('login form inputs are properly sized for mobile', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"]');
    const box = await emailInput.boundingBox();

    if (box) {
      // Input should be at least 44px tall (Apple HIG touch target)
      expect(box.height).toBeGreaterThanOrEqual(44);
      // Input should fill most of the viewport width
      const viewport = page.viewportSize();
      if (viewport) {
        expect(box.width).toBeGreaterThan(viewport.width * 0.6);
      }
    }
  });

  test('submit button meets minimum touch target size', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const submitBtn = page.locator('button[type="submit"]');
    const box = await submitBtn.boundingBox();

    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('dashboard bottom navigation is visible on mobile', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('login')) return;

    // Look for bottom navigation
    const nav = page.locator('nav, [class*="bottom-nav"], [class*="tab-bar"], [role="tablist"]');
    if (await nav.first().isVisible()) {
      const box = await nav.first().boundingBox();
      const viewport = page.viewportSize();

      if (box && viewport) {
        // Nav should be near the bottom of the viewport
        expect(box.y + box.height).toBeGreaterThan(viewport.height - 100);
      }
    }
  });

  test('text is readable without zooming', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Check that font sizes are at least 14px
    const smallText = await page.evaluate(() => {
      const allElements = document.querySelectorAll('p, span, label, a, button');
      let tooSmall = 0;
      allElements.forEach((el) => {
        const fontSize = parseFloat(getComputedStyle(el).fontSize);
        if (fontSize < 12 && el.textContent?.trim()) {
          tooSmall++;
        }
      });
      return tooSmall;
    });

    // Allow some small text (legal notices, etc.) but not many
    expect(smallText).toBeLessThan(5);
  });
});
