import { useState, useEffect, useMemo, useCallback } from 'preact/hooks';
import { Check, Receipt, FileText, Loader2, Mail, BellRing, Info } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import { FormSection } from '@/components/forms/FormSection';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from '@/lib/api/user';
import { cn } from '@/lib/utils';

interface NotificationsSettingsProps {
  user: { id: string } | null;
}

const ICON_MAP = {
  emailOnInvoiceSent: Receipt,
  emailOnEstimateSent: FileText,
  emailConfirmation: Mail,
} as const;

export function NotificationsSettings({ user }: NotificationsSettingsProps) {
  const { t } = useI18nStore();

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailOnInvoiceSent: true,
    emailOnEstimateSent: true,
    emailConfirmation: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const enabledCount = useMemo(
    () => Object.values(preferences).filter(Boolean).length,
    [preferences]
  );

  const notificationOptions = useMemo(() => [
    {
      key: 'emailOnInvoiceSent' as keyof NotificationPreferences,
      label: t('settings.notifInvoiceSent'),
      desc: t('settings.notifInvoiceSentDesc'),
    },
    {
      key: 'emailOnEstimateSent' as keyof NotificationPreferences,
      label: t('settings.notifEstimateSent'),
      desc: t('settings.notifEstimateSentDesc'),
    },
    {
      key: 'emailConfirmation' as keyof NotificationPreferences,
      label: t('settings.notifConfirmation'),
      desc: t('settings.notifConfirmationDesc'),
    },
  ], [t]);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const prefs = await getNotificationPreferences();
        setPreferences(prefs);
      } catch (err) {
        console.error('Failed to load preferences:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPreferences();
  }, []);

  const savePreferences = useCallback(async (updated: NotificationPreferences) => {
    setSaving(true);
    setError('');

    try {
      await updateNotificationPreferences(updated);

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  }, []);

  const togglePreference = useCallback((key: keyof NotificationPreferences) => {
    setPreferences((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      savePreferences(updated);
      return updated;
    });
  }, [savePreferences]);

  return (
    <main className="min-h-screen bg-transparent">
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>

      <SettingsPageHeader
        title={t('settings.notifications')}
        backLabel={t('common.backToSettings')}
        right={
          <div className="w-10 flex items-center justify-center">
            {saving ? (
              <div className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--gray-500,#64748b)]">
                <Loader2 size={16} className="animate-spin" />
              </div>
            ) : saved ? (
              <div className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--data-green,#10b981)] bg-[rgba(16,185,129,0.1)]">
                <Check size={16} strokeWidth={2.5} />
              </div>
            ) : (
              <div className="w-10" />
            )}
          </div>
        }
      />

      <div className="px-[var(--page-padding-x,20px)] max-w-[var(--page-max-width,600px)] mx-auto flex flex-col gap-[var(--section-gap,24px)] pb-[100px]">
        <section className="flex flex-col items-center py-8">
          <div
            className={cn(
              'relative w-[88px] h-[88px] flex items-center justify-center bg-[var(--white,#dbe8f4)] border border-[var(--gray-200,#e2e8f0)] rounded-full text-[var(--gray-400,#94a3b8)] transition-all duration-300',
              enabledCount > 0 && 'text-[var(--blu-primary,#0066ff)] shadow-[0_8px_32px_rgba(0,102,255,0.12)]'
            )}
          >
            <BellRing size={32} strokeWidth={1.5} />
            {enabledCount > 0 && (
              <div className="absolute top-1 right-1 min-w-[22px] h-[22px] flex items-center justify-center bg-[var(--blu-primary,#0066ff)] border-2 border-[var(--white,#dbe8f4)] rounded-full text-white text-[11px] font-bold px-1.5">
                {enabledCount}
              </div>
            )}
          </div>
          <p className="mt-4 text-sm font-medium text-[var(--gray-600,#475569)]">
            {loading
              ? t('common.loading')
              : enabledCount === 0
                ? t('settings.notifAllDisabled')
                : t('settings.notifEnabledCount', { count: enabledCount })}
          </p>
        </section>

        {loading ? (
          <div className="flex flex-col gap-3">
            <div className="h-[76px] bg-[linear-gradient(90deg,var(--gray-100,#f1f5f9)_25%,var(--gray-50,#f8fafc)_50%,var(--gray-100,#f1f5f9)_75%)] bg-[length:200%_100%] rounded-[var(--radius-button,14px)] animate-[shimmer_1.5s_ease-in-out_infinite]" />
            <div className="h-[76px] bg-[linear-gradient(90deg,var(--gray-100,#f1f5f9)_25%,var(--gray-50,#f8fafc)_50%,var(--gray-100,#f1f5f9)_75%)] bg-[length:200%_100%] rounded-[var(--radius-button,14px)] animate-[shimmer_1.5s_ease-in-out_infinite]" />
            <div className="h-[76px] bg-[linear-gradient(90deg,var(--gray-100,#f1f5f9)_25%,var(--gray-50,#f8fafc)_50%,var(--gray-100,#f1f5f9)_75%)] bg-[length:200%_100%] rounded-[var(--radius-button,14px)] animate-[shimmer_1.5s_ease-in-out_infinite]" />
          </div>
        ) : (
          <FormSection
            title={t('settings.emailNotificationsTitle')}
            description={t('settings.emailNotificationsDesc')}
            variant="card"
          >
            <div className="flex flex-col">
              {notificationOptions.map((option, index) => {
                const Icon = ICON_MAP[option.key];
                const isEnabled = preferences[option.key];
                const isLast = index === notificationOptions.length - 1;

                return (
                  <button
                    key={option.key}
                    className={cn(
                      'flex items-center gap-3.5 w-full p-4 bg-transparent border-none cursor-pointer text-left',
                      isEnabled && 'bg-[rgba(0,102,255,0.04)]',
                      !isLast && 'border-b border-[var(--gray-100,#f1f5f9)]'
                    )}
                    onClick={() => togglePreference(option.key)}
                    aria-pressed={isEnabled}
                  >
                    <div
                      className={cn(
                        'w-11 h-11 flex items-center justify-center bg-[var(--gray-100,#f1f5f9)] rounded-[var(--radius-input,12px)] text-[var(--gray-500,#64748b)] shrink-0',
                        isEnabled && 'bg-[rgba(0,102,255,0.1)] text-[var(--blu-primary,#0066ff)]'
                      )}
                    >
                      <Icon size={18} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                      <span className="text-[15px] font-medium text-[var(--gray-900,#0f172a)]">
                        {option.label}
                      </span>
                      <span className="text-[13px] text-[var(--gray-500,#64748b)]">
                        {option.desc}
                      </span>
                    </div>
                    <div
                      className={cn(
                        'w-12 h-7 bg-[var(--gray-200,#e2e8f0)] rounded-full relative transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] shrink-0',
                        isEnabled && 'bg-[var(--blu-primary,#0066ff)]'
                      )}
                    >
                      <div
                        className={cn(
                          'w-[22px] h-[22px] bg-[var(--white,#dbe8f4)] rounded-full absolute top-[3px] left-[3px] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-[0_1px_3px_rgba(0,0,0,0.15)]',
                          isEnabled && 'translate-x-5'
                        )}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </FormSection>
        )}

        {error && (
          <div className="flex items-center gap-2.5 px-4 py-3.5 bg-[var(--status-overdue-bg,rgba(239,68,68,0.1))] rounded-[var(--radius-button,14px)] text-[var(--data-red,#ef4444)] text-sm font-medium">
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-start gap-3 p-4 bg-[var(--gray-100,#f1f5f9)] rounded-[var(--radius-button,14px)] text-[var(--gray-500,#64748b)]">
          <Info size={18} strokeWidth={1.5} />
          <p className="m-0 text-[13px] leading-[1.5]">{t('settings.notifAutoSave')}</p>
        </div>
      </div>
    </main>
  );
}
