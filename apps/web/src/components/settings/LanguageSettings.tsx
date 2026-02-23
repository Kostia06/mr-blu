import type { User } from '@supabase/supabase-js';
import { Check, Globe, Info } from 'lucide-react';
import { FormSection } from '@/components/forms/FormSection';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import { useI18nStore } from '@/lib/i18n';

interface LanguageSettingsProps {
  user: User | null;
}

const languages = [
  { code: 'en', name: 'English', native: 'English', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: 'es', name: 'Espa\u00F1ol', native: 'Spanish', flag: '\u{1F1EA}\u{1F1F8}' },
];

export function LanguageSettings({ user }: LanguageSettingsProps) {
  const { locale, t, setLocale } = useI18nStore();

  const selectedLanguage = languages.find((l) => l.code === locale) || languages[0];

  return (
    <main style={styles.page}>
      <SettingsPageHeader
        title={t('settings.languageTitle')}
        backLabel={t('common.backToSettings')}
      />

      <div style={styles.pageContent}>
        {/* Preview Section */}
        <section style={styles.languagePreview}>
          <div style={styles.previewGlobe}>
            <Globe size={32} strokeWidth={1.5} />
            <div style={styles.currentFlag}>{selectedLanguage.flag}</div>
          </div>
          <p style={styles.previewLabel}>{selectedLanguage.name}</p>
        </section>

        {/* Language Selection */}
        <FormSection
          title={t('settings.selectLanguage')}
          description={t('settings.languageDesc')}
          variant="card"
        >
          <div style={styles.languageList}>
            {languages.map((lang) => {
              const isSelected = locale === lang.code;
              return (
                <button
                  key={lang.code}
                  style={{
                    ...styles.languageItem,
                    ...(isSelected ? styles.languageItemSelected : {}),
                  }}
                  onClick={() => setLocale(lang.code)}
                  aria-pressed={isSelected}
                >
                  <div
                    style={{
                      ...styles.languageFlagContainer,
                      ...(isSelected ? styles.languageFlagContainerSelected : {}),
                    }}
                  >
                    <span style={styles.languageFlag}>{lang.flag}</span>
                  </div>
                  <div style={styles.languageInfo}>
                    <span style={styles.languageName}>{lang.name}</span>
                    <span style={styles.languageNative}>{lang.native}</span>
                  </div>
                  {isSelected && (
                    <div style={styles.languageCheck}>
                      <Check size={14} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </FormSection>

        {/* Info Note */}
        <div style={styles.infoNote}>
          <Info size={18} strokeWidth={1.5} />
          <p style={styles.infoNoteText}>{t('settings.languageHint')}</p>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, Record<string, string | number>> = {
  page: {
    minHeight: '100vh',
    background: 'transparent',
  },
  pageContent: {
    padding: 'var(--page-padding-x, 20px)',
    maxWidth: 'var(--page-max-width, 600px)',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--section-gap, 24px)',
    paddingBottom: 100,
  },

  /* Language Preview */
  languagePreview: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px 0',
  },
  previewGlobe: {
    position: 'relative',
    width: 88,
    height: 88,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--white, #dbe8f4)',
    border: '1px solid var(--gray-200, #e2e8f0)',
    borderRadius: '50%',
    color: 'var(--blu-primary, #0066ff)',
    boxShadow: '0 8px 32px rgba(0,102,255,0.1)',
  },
  currentFlag: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--white, #dbe8f4)',
    border: '2px solid var(--gray-50, #f8fafc)',
    borderRadius: '50%',
    fontSize: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  previewLabel: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--gray-600, #475569)',
  },

  /* Language List */
  languageList: {
    display: 'flex',
    flexDirection: 'column',
  },
  languageItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    padding: 16,
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--gray-100, #f1f5f9)',
    cursor: 'pointer',
    textAlign: 'left',
  },
  languageItemSelected: {
    background: 'rgba(0,102,255,0.04)',
  },
  languageFlagContainer: {
    width: 48,
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--gray-100, #f1f5f9)',
    borderRadius: 'var(--radius-input, 12px)',
    flexShrink: 0,
  },
  languageFlagContainerSelected: {
    background: 'rgba(0,102,255,0.1)',
  },
  languageFlag: {
    fontSize: 24,
    lineHeight: 1,
  },
  languageInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  },
  languageName: {
    fontSize: 15,
    fontWeight: 500,
    color: 'var(--gray-900, #0f172a)',
  },
  languageNative: {
    fontSize: 13,
    color: 'var(--gray-500, #64748b)',
  },
  languageCheck: {
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--blu-primary, #0066ff)',
    borderRadius: '50%',
    color: 'white',
    flexShrink: 0,
  },

  /* Info Note */
  infoNote: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    background: 'var(--gray-100, #f1f5f9)',
    borderRadius: 'var(--radius-button, 14px)',
    color: 'var(--gray-500, #64748b)',
  },
  infoNoteText: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.5,
  },
};
