import { test, expect } from 'playwright/test';

test.describe('Performance', () => {
  test('login page loads under 3 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(3000);
  });

  test('landing page loads under 3 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(3000);
  });

  test('LCP is under 2.5 seconds on login', async ({ page }) => {
    await page.goto('/login');

    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let lastLcp = 0;
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            lastLcp = entries[entries.length - 1].startTime;
          }
        });
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
        // Give it time to collect entries
        setTimeout(() => {
          observer.disconnect();
          resolve(lastLcp);
        }, 1000);
      });
    });

    expect(lcp).toBeLessThan(2500);
  });

  test('no significant layout shift on login', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        });
        observer.observe({ type: 'layout-shift', buffered: true });
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 200);
      });
    });

    expect(cls).toBeLessThan(0.1);
  });

  test('JS bundle size is reasonable', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map((r) => ({
        name: r.name,
        size: (r as PerformanceResourceTiming).transferSize,
      }));
    });

    const jsResources = resources.filter((r) => r.name.endsWith('.js'));
    const totalJS = jsResources.reduce((sum, r) => sum + (r.size || 0), 0);

    // Total JS should be under 500KB
    expect(totalJS).toBeLessThan(500 * 1024);

    // No single chunk over 200KB
    for (const r of jsResources) {
      expect(r.size).toBeLessThan(200 * 1024);
    }
  });
});
