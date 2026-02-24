import { useState, useMemo, useCallback } from 'preact/hooks';
import {
  History,
  AlertTriangle,
  X,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import { FormSection } from '@/components/forms/FormSection';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import { deleteAccount } from '@/lib/api/user';

interface SecuritySettingsProps {
  user: {
    id: string;
    last_sign_in_at?: string;
  } | null;
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'transparent',
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
  securityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    padding: 16,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left' as const,
  },
  itemIcon: {
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 102, 255, 0.1)',
    borderRadius: 'var(--radius-input, 12px)',
    color: 'var(--blu-primary, #0066ff)',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  },
  itemIconDanger: {
    background: 'rgba(239, 68, 68, 0.1)',
    color: 'var(--data-red, #ef4444)',
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
  itemLabelDanger: {
    color: 'var(--data-red, #ef4444)',
  },
  itemDesc: {
    fontSize: 13,
    color: 'var(--gray-500, #64748b)',
  },
  itemAction: {
    color: 'var(--gray-400, #94a3b8)',
    flexShrink: 0,
  },
  modalOverlay: {
    position: 'fixed' as const,
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 100,
  },
  modalBackdrop: {
    position: 'absolute' as const,
    inset: 0,
    background: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  },
  modalContent: {
    position: 'relative' as const,
    background: 'var(--white, #dbe8f4)',
    border: '1px solid var(--gray-200, #e2e8f0)',
    borderRadius: 'var(--radius-card, 20px)',
    padding: 28,
    maxWidth: 400,
    width: '100%',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  modalClose: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--gray-100, #f1f5f9)',
    border: 'none',
    borderRadius: 'var(--radius-input, 12px)',
    color: 'var(--gray-500, #64748b)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  modalIcon: {
    width: 72,
    height: 72,
    background: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--data-red, #ef4444)',
    margin: '0 auto 20px',
  },
  modalTitle: {
    fontFamily: 'var(--font-display, system-ui)',
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--gray-900, #0f172a)',
    textAlign: 'center' as const,
    margin: '0 0 8px',
    letterSpacing: '-0.02em',
  },
  modalDesc: {
    fontSize: 14,
    color: 'var(--gray-600, #475569)',
    textAlign: 'center' as const,
    lineHeight: 1.5,
    margin: '0 0 24px',
  },
  confirmInputWrapper: {
    marginBottom: 20,
  },
  confirmLabel: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--gray-700, #334155)',
    marginBottom: 8,
  },
  confirmInput: {
    width: '100%',
    padding: '14px 16px',
    background: 'transparent',
    border: '1px solid var(--gray-200, #e2e8f0)',
    borderRadius: 'var(--radius-input, 12px)',
    color: 'var(--gray-900, #0f172a)',
    fontSize: 15,
    transition: 'all 0.2s ease',
    boxSizing: 'border-box' as const,
  },
  deleteError: {
    color: 'var(--data-red, #ef4444)',
    fontSize: 13,
    fontWeight: 500,
    margin: '0 0 16px',
    textAlign: 'center' as const,
  },
  modalActions: {
    display: 'flex',
    gap: 12,
  },
  btnBase: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '14px 20px',
    borderRadius: 'var(--radius-button, 14px)',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  btnCancel: {
    background: 'var(--gray-100, #f1f5f9)',
    border: '1px solid var(--gray-200, #e2e8f0)',
    color: 'var(--gray-700, #334155)',
  },
  btnDelete: {
    background: 'var(--data-red, #ef4444)',
    border: 'none',
    color: 'white',
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  spin: {
    animation: 'spin 1s linear infinite',
  },
};

function formatLastSignIn(dateString: string | undefined, locale: string): string {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString(
    locale === 'es' ? 'es-ES' : 'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }
  );
}

export function SecuritySettings({ user }: SecuritySettingsProps) {
  const { t, locale } = useI18nStore();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const confirmPhrase = useMemo(() => t('security.deleteConfirmPhrase'), [t]);
  const canDelete = useMemo(
    () => deleteConfirmText.toLowerCase().trim() === confirmPhrase.toLowerCase(),
    [deleteConfirmText, confirmPhrase]
  );

  const lastSignIn = useMemo(
    () => formatLastSignIn(user?.last_sign_in_at, locale),
    [user?.last_sign_in_at, locale]
  );

  const openDeleteModal = useCallback(() => {
    setShowDeleteModal(true);
    setDeleteConfirmText('');
    setDeleteError('');
  }, []);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setDeleteConfirmText('');
    setDeleteError('');
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    if (!canDelete || isDeleting) return;

    setIsDeleting(true);
    setDeleteError('');

    try {
      await deleteAccount();

      window.location.href = '/';
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account');
      setIsDeleting(false);
    }
  }, [canDelete, isDeleting]);

  return (
    <main style={styles.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <SettingsPageHeader
        title={t('security.title')}
        backLabel={t('common.backToSettings')}
      />

      <div style={styles.content}>
        <FormSection title={t('settings.sessionsTitle')} variant="card">
          <div style={styles.securityItem}>
            <div style={styles.itemIcon}>
              <History size={18} strokeWidth={1.5} />
            </div>
            <div style={styles.itemContent}>
              <span style={styles.itemLabel}>{t('security.lastSignIn')}</span>
              <span style={styles.itemDesc}>{lastSignIn}</span>
            </div>
          </div>
        </FormSection>

        <FormSection title={t('settings.dangerZoneTitle')} variant="card">
          <button style={styles.securityItem} onClick={openDeleteModal}>
            <div style={{ ...styles.itemIcon, ...styles.itemIconDanger }}>
              <AlertTriangle size={18} strokeWidth={1.5} />
            </div>
            <div style={styles.itemContent}>
              <span style={{ ...styles.itemLabel, ...styles.itemLabelDanger }}>
                {t('security.deleteAccount')}
              </span>
              <span style={styles.itemDesc}>{t('security.deleteAccountDesc')}</span>
            </div>
            <div style={styles.itemAction}>
              <ChevronRight size={18} strokeWidth={1.5} />
            </div>
          </button>
        </FormSection>
      </div>

      {showDeleteModal && (
        <div style={styles.modalOverlay} role="presentation">
          <div
            style={styles.modalBackdrop}
            onClick={closeDeleteModal}
            role="button"
            tabIndex={-1}
            aria-label={t('aria.closeModal')}
          />
          <div
            style={styles.modalContent}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            <button
              style={styles.modalClose}
              onClick={closeDeleteModal}
              aria-label={t('common.close')}
            >
              <X size={20} strokeWidth={2} />
            </button>

            <div style={styles.modalIcon}>
              <AlertTriangle size={32} strokeWidth={1.5} />
            </div>

            <h2 id="delete-modal-title" style={styles.modalTitle}>
              {t('security.deleteConfirmTitle')}
            </h2>
            <p style={styles.modalDesc}>{t('security.deleteConfirmDesc')}</p>

            <div style={styles.confirmInputWrapper}>
              <label htmlFor="confirm-delete" style={styles.confirmLabel}>
                {t('security.deleteConfirmLabel').replace('{phrase}', confirmPhrase)}
              </label>
              <input
                id="confirm-delete"
                type="text"
                style={styles.confirmInput}
                value={deleteConfirmText}
                onInput={(e) => setDeleteConfirmText((e.target as HTMLInputElement).value)}
                placeholder={confirmPhrase}
                autoComplete="off"
                autoCapitalize="off"
                spellcheck={false}
              />
            </div>

            {deleteError && <p style={styles.deleteError}>{deleteError}</p>}

            <div style={styles.modalActions}>
              <button
                style={{
                  ...styles.btnBase,
                  ...styles.btnCancel,
                  ...(isDeleting ? styles.btnDisabled : {}),
                }}
                onClick={closeDeleteModal}
                disabled={isDeleting}
              >
                {t('security.cancel')}
              </button>
              <button
                style={{
                  ...styles.btnBase,
                  ...styles.btnDelete,
                  ...(!canDelete || isDeleting ? styles.btnDisabled : {}),
                }}
                onClick={handleDeleteAccount}
                disabled={!canDelete || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} style={styles.spin} />
                    <span>{t('security.deleting')}</span>
                  </>
                ) : (
                  <span>{t('security.deleteButton')}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
