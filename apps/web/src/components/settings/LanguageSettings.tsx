import type { User } from '@supabase/supabase-js';
import { Check, Globe, Info } from 'lucide-react';
import { FormSection } from '@/components/forms/FormSection';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import { useI18nStore } from '@/lib/i18n';
import { cn } from '@/lib/utils';

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
    <main class="min-h-screen bg-transparent">
      <SettingsPageHeader
        title={t('settings.languageTitle')}
        backLabel={t('common.backToSettings')}
      />

      <div class="px-[var(--page-padding-x,20px)] max-w-[var(--page-max-width,600px)] mx-auto flex flex-col gap-[var(--section-gap,24px)] pb-[100px]">
        {/* Preview Section */}
        <section class="flex flex-col items-center py-8">
          <div class="relative w-[88px] h-[88px] flex items-center justify-center bg-[var(--white,#dbe8f4)] border border-[var(--gray-200,#e2e8f0)] rounded-full text-[var(--blu-primary,#0066ff)] shadow-[0_8px_32px_rgba(0,102,255,0.1)]">
            <Globe size={32} strokeWidth={1.5} />
            <div class="absolute -bottom-1 -right-1 w-9 h-9 flex items-center justify-center bg-[var(--white,#dbe8f4)] border-2 border-[var(--gray-50,#f8fafc)] rounded-full text-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
              {selectedLanguage.flag}
            </div>
          </div>
          <p class="mt-4 text-sm font-medium text-[var(--gray-600,#475569)]">
            {selectedLanguage.name}
          </p>
        </section>

        {/* Language Selection */}
        <FormSection
          title={t('settings.selectLanguage')}
          description={t('settings.languageDesc')}
          variant="card"
        >
          <div class="flex flex-col">
            {languages.map((lang) => {
              const isSelected = locale === lang.code;
              return (
                <button
                  key={lang.code}
                  class={cn(
                    'flex items-center gap-3.5 w-full p-4 bg-transparent border-none border-b border-b-[var(--gray-100,#f1f5f9)] cursor-pointer text-left',
                    isSelected && 'bg-[rgba(0,102,255,0.04)]'
                  )}
                  onClick={() => setLocale(lang.code)}
                  aria-pressed={isSelected}
                >
                  <div
                    class={cn(
                      'w-12 h-12 flex items-center justify-center bg-[var(--gray-100,#f1f5f9)] rounded-[var(--radius-input,12px)] shrink-0',
                      isSelected && 'bg-[rgba(0,102,255,0.1)]'
                    )}
                  >
                    <span class="text-2xl leading-none">{lang.flag}</span>
                  </div>
                  <div class="flex-1 flex flex-col gap-0.5 min-w-0">
                    <span class="text-[15px] font-medium text-[var(--gray-900,#0f172a)]">
                      {lang.name}
                    </span>
                    <span class="text-[13px] text-[var(--gray-500,#64748b)]">
                      {lang.native}
                    </span>
                  </div>
                  {isSelected && (
                    <div class="w-6 h-6 flex items-center justify-center bg-[var(--blu-primary,#0066ff)] rounded-full text-white shrink-0">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </FormSection>

        {/* Info Note */}
        <div class="flex items-start gap-3 p-4 bg-[var(--gray-100,#f1f5f9)] rounded-[var(--radius-button,14px)] text-[var(--gray-500,#64748b)]">
          <Info size={18} strokeWidth={1.5} />
          <p class="m-0 text-[13px] leading-normal">{t('settings.languageHint')}</p>
        </div>
      </div>
    </main>
  );
}
