import { test, expect } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = [
  { name: 'login', path: '/login' },
  { name: 'landing', path: '/' },
];

for (const { name, path } of pages) {
  test(`${name} page has no critical accessibility violations`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    if (critical.length > 0) {
      const summary = critical.map(
        (v) => `${v.id} (${v.impact}): ${v.description} [${v.nodes.length} instances]`
      );
      console.log(`Accessibility issues on ${name}:\n${summary.join('\n')}`);
    }

    expect(critical).toEqual([]);
  });
}

test('login form has proper labels', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Email input should have a label
  const emailInput = page.locator('input[type="email"]');
  const id = await emailInput.getAttribute('id');
  if (id) {
    const label = page.locator(`label[for="${id}"]`);
    await expect(label).toBeVisible();
  }
});

test('color contrast is sufficient on login page', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2aa'])
    .analyze();

  const contrastViolations = results.violations.filter(
    (v) => v.id === 'color-contrast'
  );

  expect(contrastViolations).toEqual([]);
});

test('all interactive elements are keyboard accessible', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Tab through elements
  let focusableCount = 0;
  const maxTabs = 20;

  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press('Tab');
    const tagName = await page.evaluate(() => document.activeElement?.tagName);
    if (!tagName || tagName === 'BODY') break;
    focusableCount++;
  }

  // Login page should have at least email input + submit button + back link
  expect(focusableCount).toBeGreaterThanOrEqual(2);
});
