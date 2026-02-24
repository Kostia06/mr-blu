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

interface NotificationsSettingsProps {
  user: { id: string } | null;
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'transparent',
  },
  headerStatus: {
    width: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusSaving: {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    color: 'var(--gray-500, #64748b)',
  },
  statusSaved: {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    color: 'var(--data-green, #10b981)',
    background: 'rgba(16, 185, 129, 0.1)',
  },
  content: {
    padding: 'var(--page-padding-x, 20px)',
    maxWidth: 'var(--page-max-width, 600px)',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--section-gap, 24px)',
    paddingBottom: 100,
  },
  statusPreview: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '32px 0',
  },
  previewBell: {
    position: 'relative' as const,
    width: 88,
    height: 88,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--white, #dbe8f4)',
    border: '1px solid var(--gray-200, #e2e8f0)',
    borderRadius: '50%',
    color: 'var(--gray-400, #94a3b8)',
    transition: 'all 0.3s ease',
  },
  previewBellActive: {
    color: 'var(--blu-primary, #0066ff)',
    boxShadow: '0 8px 32px rgba(0, 102, 255, 0.12)',
  },
  badge: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
    minWidth: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--blu-primary, #0066ff)',
    border: '2px solid var(--white, #dbe8f4)',
    borderRadius: 100,
    color: 'white',
    fontSize: 11,
    fontWeight: 700,
    padding: '0 6px',
  },
  previewLabel: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--gray-600, #475569)',
  },
  skeletonCard: {
    height: 76,
    background: 'linear-gradient(90deg, var(--gray-100, #f1f5f9) 25%, var(--gray-50, #f8fafc) 50%, var(--gray-100, #f1f5f9) 75%)',
    backgroundSize: '200% 100%',
    borderRadius: 'var(--radius-button, 14px)',
    animation: 'shimmer 1.5s ease-in-out infinite',
  },
  notificationList: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  notificationItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    padding: 16,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'all 0.2s ease',
  },
  notificationItemEnabled: {
    background: 'rgba(0, 102, 255, 0.04)',
  },
  itemBorder: {
    borderBottom: '1px solid var(--gray-100, #f1f5f9)',
  },
  itemIcon: {
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--gray-100, #f1f5f9)',
    borderRadius: 'var(--radius-input, 12px)',
    color: 'var(--gray-500, #64748b)',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  },
  itemIconSelected: {
    background: 'rgba(0, 102, 255, 0.1)',
    color: 'var(--blu-primary, #0066ff)',
  },
  itemContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
    minWidth: 0,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: 500,
    color: 'var(--gray-900, #0f172a)',
  },
  itemDesc: {
    fontSize: 13,
    color: 'var(--gray-500, #64748b)',
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    background: 'var(--gray-200, #e2e8f0)',
    borderRadius: 100,
    position: 'relative' as const,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    flexShrink: 0,
  },
  toggleSwitchActive: {
    background: 'var(--blu-primary, #0066ff)',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    background: 'var(--white, #dbe8f4)',
    borderRadius: '50%',
    position: 'absolute' as const,
    top: 3,
    left: 3,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)',
  },
  toggleThumbActive: {
    transform: 'translateX(20px)',
  },
  errorMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 16px',
    background: 'var(--status-overdue-bg, rgba(239, 68, 68, 0.1))',
    borderRadius: 'var(--radius-button, 14px)',
    color: 'var(--data-red, #ef4444)',
    fontSize: 14,
    fontWeight: 500,
  },
  infoNote: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    background: 'var(--gray-100, #f1f5f9)',
    borderRadius: 'var(--radius-button, 14px)',
    color: 'var(--gray-500, #64748b)',
  },
  infoText: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.5,
  },
  spin: {
    animation: 'spin 1s linear infinite',
  },
};

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
    <main style={styles.page}>
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <SettingsPageHeader
        title={t('settings.notifications')}
        backLabel={t('common.backToSettings')}
        right={
          <div style={styles.headerStatus}>
            {saving ? (
              <div style={styles.statusSaving}>
                <Loader2 size={16} style={styles.spin} />
              </div>
            ) : saved ? (
              <div style={styles.statusSaved}>
                <Check size={16} strokeWidth={2.5} />
              </div>
            ) : (
              <div style={{ width: 40 }} />
            )}
          </div>
        }
      />

      <div style={styles.content}>
        <section style={styles.statusPreview}>
          <div style={{
            ...styles.previewBell,
            ...(enabledCount > 0 ? styles.previewBellActive : {}),
          }}>
            <BellRing size={32} strokeWidth={1.5} />
            {enabledCount > 0 && (
              <div style={styles.badge}>{enabledCount}</div>
            )}
          </div>
          <p style={styles.previewLabel}>
            {loading
              ? t('common.loading')
              : enabledCount === 0
                ? t('settings.notifAllDisabled')
                : t('settings.notifEnabledCount', { count: enabledCount })}
          </p>
        </section>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={styles.skeletonCard} />
            <div style={styles.skeletonCard} />
            <div style={styles.skeletonCard} />
          </div>
        ) : (
          <FormSection
            title={t('settings.emailNotificationsTitle')}
            description={t('settings.emailNotificationsDesc')}
            variant="card"
          >
            <div style={styles.notificationList}>
              {notificationOptions.map((option, index) => {
                const Icon = ICON_MAP[option.key];
                const isEnabled = preferences[option.key];
                const isLast = index === notificationOptions.length - 1;

                return (
                  <button
                    key={option.key}
                    style={{
                      ...styles.notificationItem,
                      ...(isEnabled ? styles.notificationItemEnabled : {}),
                      ...(!isLast ? styles.itemBorder : {}),
                    }}
                    onClick={() => togglePreference(option.key)}
                    aria-pressed={isEnabled}
                  >
                    <div style={{
                      ...styles.itemIcon,
                      ...(isEnabled ? styles.itemIconSelected : {}),
                    }}>
                      <Icon size={18} strokeWidth={1.5} />
                    </div>
                    <div style={styles.itemContent}>
                      <span style={styles.itemLabel}>{option.label}</span>
                      <span style={styles.itemDesc}>{option.desc}</span>
                    </div>
                    <div style={{
                      ...styles.toggleSwitch,
                      ...(isEnabled ? styles.toggleSwitchActive : {}),
                    }}>
                      <div style={{
                        ...styles.toggleThumb,
                        ...(isEnabled ? styles.toggleThumbActive : {}),
                      }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </FormSection>
        )}

        {error && (
          <div style={styles.errorMessage}>
            <span>{error}</span>
          </div>
        )}

        <div style={styles.infoNote}>
          <Info size={18} strokeWidth={1.5} />
          <p style={styles.infoText}>{t('settings.notifAutoSave')}</p>
        </div>
      </div>
    </main>
  );
}
