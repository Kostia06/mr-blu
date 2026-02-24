import { useState, useEffect, useCallback } from 'preact/hooks';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';

interface DocumentInfo {
  id: string;
  type: 'invoice' | 'estimate' | 'contract';
  title: string;
  client: string;
  amount?: number;
}

interface DeleteConfirmModalProps {
  open: boolean;
  document: DocumentInfo | null;
  onClose: () => void;
  onConfirm: (documentId: string, documentType: string) => Promise<void>;
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function DeleteConfirmModal({ open, document, onClose, onConfirm }: DeleteConfirmModalProps) {
  const { t } = useI18nStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setIsDeleting(false);
    }
  }, [open]);

  const handleClose = useCallback(() => {
    if (isDeleting) return;
    setError(null);
    onClose();
  }, [isDeleting, onClose]);

  const handleDelete = useCallback(async () => {
    if (!document || isDeleting) return;
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm(document.id, document.type);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
      setIsDeleting(false);
    }
  }, [document, isDeleting, onConfirm, handleClose]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isDeleting, handleClose]);

  if (!open || !document) return null;

  const typeLabel =
    document.type === 'invoice'
      ? t('review.invoice')
      : document.type === 'estimate'
        ? t('review.estimate')
        : t('documents.contracts');

  const typeBadgeBg =
    document.type === 'invoice'
      ? 'rgba(16, 185, 129, 0.1)'
      : document.type === 'estimate'
        ? 'rgba(14, 165, 233, 0.1)'
        : 'rgba(0, 102, 255, 0.1)';

  const typeBadgeColor =
    document.type === 'invoice'
      ? '#059669'
      : document.type === 'estimate'
        ? '#0284c7'
        : 'var(--blu-primary, #0066ff)';

  return (
    <>
      <style>{spinKeyframes}</style>
      {/* Backdrop */}
      <button
        style={styles.backdrop}
        onClick={handleClose}
        aria-label={t('aria.closeModal')}
      />

      {/* Modal */}
      <div
        style={styles.container}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
      >
        <div style={styles.content}>
          <button style={styles.closeBtn} onClick={handleClose} aria-label={t('common.close')}>
            <X size={20} />
          </button>

          <div style={styles.step}>
            <div style={styles.iconWrapperWarning}>
              <Trash2 size={32} />
            </div>

            <h2 id="delete-modal-title" style={styles.title}>
              {t('delete.title')}
            </h2>

            <div style={styles.warningBox}>
              <AlertTriangle size={16} />
              <span>{t('delete.warning')}</span>
            </div>

            <div style={styles.summary}>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>{t('documents.client')}</span>
                <span style={styles.summaryValue}>{document.client}</span>
              </div>
              <div style={{ ...styles.summaryRow, borderBottom: 'none' }}>
                <span style={styles.summaryLabel}>{t('review.documentType')}</span>
                <span
                  style={{
                    ...styles.typeBadge,
                    background: typeBadgeBg,
                    color: typeBadgeColor,
                  }}
                >
                  {typeLabel}
                </span>
              </div>
              {document.amount ? (
                <div style={{ ...styles.summaryRow, borderBottom: 'none' }}>
                  <span style={styles.summaryLabel}>{t('documents.amount')}</span>
                  <span style={{ ...styles.summaryValue, color: 'var(--data-green, #10b981)' }}>
                    {formatAmount(document.amount)}
                  </span>
                </div>
              ) : null}
            </div>

            {error && (
              <div style={styles.errorMessage}>
                <AlertTriangle size={14} />
                <span>{error}</span>
              </div>
            )}

            <div style={styles.actions}>
              <button
                style={styles.btnSecondary}
                onClick={handleClose}
                disabled={isDeleting}
              >
                {t('common.cancel')}
              </button>
              <button
                style={{
                  ...styles.btnDanger,
                  opacity: isDeleting ? '0.5' : '1',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                }}
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span style={styles.spinner} />
                    {t('docDetail.deleting')}
                  </>
                ) : (
                  t('common.delete')
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const spinKeyframes = `
@keyframes deleteModalSpin {
  to { transform: rotate(360deg); }
}
`;

const styles: Record<string, Record<string, string>> = {
  backdrop: {
    position: 'fixed',
    inset: '0',
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    zIndex: '1000',
    border: 'none',
    cursor: 'default',
  },
  container: {
    position: 'fixed',
    inset: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '1001',
    padding: '20px',
  },
  content: {
    position: 'relative',
    background: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: 'var(--radius-lg, 20px)',
    padding: '32px 24px 24px',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
  },
  closeBtn: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--gray-100, #f1f5f9)',
    border: 'none',
    borderRadius: '50%',
    color: 'var(--gray-500, #64748b)',
    cursor: 'pointer',
  },
  step: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  iconWrapperWarning: {
    width: '72px',
    height: '72px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    marginBottom: '16px',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
  },
  title: {
    fontFamily: 'var(--font-display, system-ui)',
    fontSize: '22px',
    fontWeight: '700',
    color: 'var(--gray-900, #0f172a)',
    margin: '0 0 16px',
  },
  warningBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    background: 'rgba(245, 158, 11, 0.1)',
    borderRadius: '10px',
    color: '#d97706',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '20px',
    width: '100%',
  },
  summary: {
    width: '100%',
    background: 'var(--gray-50, #f8fafc)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '24px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid var(--gray-100, #f1f5f9)',
  },
  summaryLabel: {
    fontSize: '14px',
    color: 'var(--gray-500, #64748b)',
  },
  summaryValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--gray-900, #0f172a)',
  },
  typeBadge: {
    padding: '4px 10px',
    borderRadius: '100px',
    fontSize: '12px',
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  errorMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 14px',
    background: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '8px',
    color: '#dc2626',
    fontSize: '13px',
    marginBottom: '16px',
    width: '100%',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    width: '100%',
  },
  btnSecondary: {
    flex: '1',
    padding: '14px 20px',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: 'var(--gray-100, #f1f5f9)',
    color: 'var(--gray-700, #334155)',
  },
  btnDanger: {
    flex: '1',
    padding: '14px 20px',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: '#ef4444',
    color: 'white',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'deleteModalSpin 0.8s linear infinite',
    display: 'inline-block',
  },
};
