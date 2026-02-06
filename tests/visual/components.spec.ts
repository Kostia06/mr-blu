import { test, expect } from 'playwright/test';

const stories = [
  // UI
  { id: 'ui-button--primary', name: 'Button - Primary' },
  { id: 'ui-button--secondary', name: 'Button - Secondary' },
  { id: 'ui-button--ghost', name: 'Button - Ghost' },
  { id: 'ui-button--outline', name: 'Button - Outline' },
  { id: 'ui-button--loading', name: 'Button - Loading' },
  { id: 'ui-button--disabled', name: 'Button - Disabled' },
  { id: 'ui-badge--draft', name: 'Badge - Draft' },
  { id: 'ui-badge--sent', name: 'Badge - Sent' },
  { id: 'ui-badge--paid', name: 'Badge - Paid' },
  { id: 'ui-badge--overdue', name: 'Badge - Overdue' },
  { id: 'ui-badge--all-statuses', name: 'Badge - All Statuses' },
  { id: 'ui-card--glass', name: 'Card - Glass' },
  { id: 'ui-card--solid', name: 'Card - Solid' },
  { id: 'ui-card--gradient', name: 'Card - Gradient' },
  { id: 'ui-toast--success', name: 'Toast - Success' },
  { id: 'ui-toast--error', name: 'Toast - Error' },
  { id: 'ui-toast--multiple-toasts', name: 'Toast - Multiple' },
  { id: 'ui-skeleton--text', name: 'Skeleton - Text' },
  { id: 'ui-skeleton--circle', name: 'Skeleton - Circle' },
  { id: 'ui-skeleton--card', name: 'Skeleton - Card' },
  { id: 'ui-avatar--with-image', name: 'Avatar - With Image' },
  { id: 'ui-avatar--initials-only', name: 'Avatar - Initials' },
  { id: 'ui-avatar--large', name: 'Avatar - Large' },
  { id: 'ui-tabs--underline', name: 'Tabs - Underline' },
  { id: 'ui-tabs--pills', name: 'Tabs - Pills' },
  { id: 'ui-tabs--cards', name: 'Tabs - Cards' },

  // Forms
  { id: 'forms-forminput--default', name: 'FormInput - Default' },
  { id: 'forms-forminput--floating-label', name: 'FormInput - Floating Label' },
  { id: 'forms-forminput--with-error', name: 'FormInput - Error' },
  { id: 'forms-forminput--success', name: 'FormInput - Success' },
  { id: 'forms-forminput--disabled', name: 'FormInput - Disabled' },
  { id: 'forms-formselect--default', name: 'FormSelect - Default' },
  { id: 'forms-formselect--with-error', name: 'FormSelect - Error' },
  { id: 'forms-formselect--disabled', name: 'FormSelect - Disabled' },
  { id: 'forms-formtoggle--default', name: 'FormToggle - Default' },
  { id: 'forms-formtoggle--card-variant', name: 'FormToggle - Card' },
  { id: 'forms-formtoggle--checked', name: 'FormToggle - Checked' },
  { id: 'forms-formtoggle--disabled', name: 'FormToggle - Disabled' },
  { id: 'forms-formsection--default', name: 'FormSection - Default' },
  { id: 'forms-formsection--card', name: 'FormSection - Card' },

  // Dashboard
  { id: 'dashboard-statscard--currency-format', name: 'StatsCard - Currency' },
  { id: 'dashboard-statscard--number-format', name: 'StatsCard - Number' },
  { id: 'dashboard-statscard--with-positive-trend', name: 'StatsCard - Positive Trend' },
  { id: 'dashboard-statscard--with-negative-trend', name: 'StatsCard - Negative Trend' },

  // Documents
  { id: 'documents-documentlistskeleton--default', name: 'DocumentListSkeleton - Default' },
  { id: 'documents-documentlistskeleton--three-items', name: 'DocumentListSkeleton - Three Items' },
  { id: 'documents-monthgroupheader--default', name: 'MonthGroupHeader - Default' },
  { id: 'documents-monthgroupheader--single-document', name: 'MonthGroupHeader - Single' },

  // Settings
  { id: 'settings-settingsitem--default', name: 'SettingsItem - Default' },
  { id: 'settings-settingsitem--with-value', name: 'SettingsItem - With Value' },
  { id: 'settings-settingsitem--destructive', name: 'SettingsItem - Destructive' },
  { id: 'settings-settingssection--with-title', name: 'SettingsSection - With Title' },

  // Components
  { id: 'components-logo--default', name: 'Logo - Default' },
  { id: 'components-logo--icon-only', name: 'Logo - Icon Only' },
  { id: 'components-logo--extra-large', name: 'Logo - Extra Large' },
  { id: 'components-recordbuttonmobile--idle', name: 'RecordButton - Idle' },
  { id: 'components-recordbuttonmobile--recording', name: 'RecordButton - Recording' },
  { id: 'components-recordbuttonmobile--paused', name: 'RecordButton - Paused' },
  { id: 'components-recordbuttonmobile--disabled', name: 'RecordButton - Disabled' },
];

test.describe('Visual Regression Tests', () => {
  for (const story of stories) {
    test(story.name, async ({ page }) => {
      await page.goto(`/iframe.html?id=${story.id}&viewMode=story`, {
        waitUntil: 'networkidle',
      });

      // Wait for any animations to settle
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot(`${story.id}.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    });
  }
});
