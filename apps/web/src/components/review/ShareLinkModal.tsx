import { useState, useEffect, useCallback } from 'preact/hooks';
import { X, Link, Copy, Check, ExternalLink, HelpCircle } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';

interface ShareLinkModalProps {
  open: boolean;
  linkUrl: string | null;
  documentType: 'invoice' | 'estimate';
  onClose: () => void;
}

export function ShareLinkModal({ open, linkUrl, documentType, onClose }: ShareLinkModalProps) {
  const { t } = useI18nStore();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) setCopied(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const copyLink = useCallback(async () => {
    if (!linkUrl) return;
    try {
      await navigator.clipboard.writeText(linkUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      console.error('Failed to copy link');
    }
  }, [linkUrl]);

  const openPreview = useCallback(() => {
    if (linkUrl) window.open(linkUrl, '_blank');
  }, [linkUrl]);

  if (!open) return null;

  return (
    <div style={styles.modalOverlay} onClick={onClose} role="presentation">
      <div
        style={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <button style={styles.modalClose} onClick={onClose}>
          <X size={20} />
        </button>

        <div style={styles.modalHeader}>
          <Link size={24} style={{ color: '#3b82f6' }} />
          <h3 style={styles.modalHeaderTitle}>{t('review.shareLinkCreated')}</h3>
        </div>

        <div style={styles.modalBody}>
          <p style={styles.modalDescription}>
            {t('review.anyoneCanView', { type: documentType })}
          </p>

          <div style={styles.linkDisplay}>
            <input
              type="text"
              readOnly
              value={linkUrl || ''}
              style={styles.linkInput}
            />
          </div>

          <div style={styles.modalActions}>
            <button style={styles.modalBtnSecondary} onClick={copyLink}>
              {copied ? (
                <>
                  <Check size={16} />
                  {t('common.copied')}
                </>
              ) : (
                <>
                  <Copy size={16} />
                  {t('review.copyLink')}
                </>
              )}
            </button>
            <button style={styles.modalBtnPrimary} onClick={openPreview}>
              <ExternalLink size={16} />
              {t('review.openPreview')}
            </button>
          </div>
        </div>

        <p style={styles.modalFooterNote}>
          <HelpCircle size={14} />
          {t('review.noLoginRequired')}
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, Record<string, string>> = {
  modalOverlay: {
    position: 'fixed',
    inset: '0',
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '1000',
    padding: '20px',
  },
  modalContent: {
    background: 'var(--white)',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '480px',
    width: '100%',
    position: 'relative',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
  },
  modalClose: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'none',
    border: 'none',
    color: 'var(--gray-500)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '6px',
    transition: 'all 0.15s ease',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  modalHeaderTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0',
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  modalDescription: {
    fontSize: '14px',
    color: 'var(--gray-500)',
    margin: '0',
  },
  linkDisplay: {
    background: 'transparent',
    border: '1px solid var(--gray-200)',
    borderRadius: '8px',
    padding: '4px',
  },
  linkInput: {
    width: '100%',
    border: 'none',
    background: 'transparent',
    padding: '10px 12px',
    fontSize: '13px',
    color: '#1e293b',
    fontFamily: 'ui-monospace, monospace',
    outline: 'none',
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
  },
  modalBtnSecondary: {
    flex: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    background: 'var(--gray-100)',
    border: '1px solid var(--gray-200)',
    color: 'var(--gray-600)',
  },
  modalBtnPrimary: {
    flex: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    background: '#3b82f6',
    border: 'none',
    color: 'white',
  },
  modalFooterNote: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: 'var(--gray-400)',
    margin: '16px 0 0',
    paddingTop: '16px',
    borderTop: '1px solid #f1f5f9',
  },
};
