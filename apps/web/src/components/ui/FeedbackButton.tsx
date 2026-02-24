import { useState, useCallback } from 'preact/hooks';
import { MessageCircle, X, Send, CheckCircle } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import { useAppStateStore } from '@/stores/appStateStore';

const CATEGORIES = [
  { value: 'bug', key: 'feedback.bug' },
  { value: 'feature', key: 'feedback.feature' },
  { value: 'general', key: 'feedback.general' },
  { value: 'praise', key: 'feedback.praise' },
] as const;

export function FeedbackButton() {
  const { t } = useI18nStore();
  const { isRecordingMode, isModalOpen, setModalOpen } = useAppStateStore();

  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState<string>('general');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const shouldHide = isRecordingMode || isModalOpen;
  const canSubmit = comment.trim().length > 0 && !submitting;

  const reset = useCallback(() => {
    setComment('');
    setCategory('general');
    setSubmitting(false);
    setSuccess(false);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setModalOpen(false);
    reset();
  }, [reset, setModalOpen]);

  const openModal = useCallback(() => {
    setOpen(true);
    setModalOpen(true);
  }, [setModalOpen]);

  const submit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: comment.trim(),
          category,
          pageContext: window.location.pathname,
        }),
      });
      setSuccess(true);
      setTimeout(close, 1500);
    } catch {
      setSubmitting(false);
    }
  }, [canSubmit, comment, category, close]);

  return (
    <>
      {/* FAB */}
      {!shouldHide && !open && (
        <button style={fabStyle} onClick={openModal} aria-label="Send feedback">
          <MessageCircle size={22} />
        </button>
      )}

      {/* Modal */}
      {open && (
        <div style={overlayStyle} onClick={close} onKeyDown={(e) => { if (e.key === 'Escape') close(); }}>
          <div
            style={modalStyle}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {success ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '32px 0', textAlign: 'center' }}>
                <CheckCircle size={48} style={{ color: '#0066FF' }} />
                <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 500, color: '#1a1a2e' }}>{t('feedback.thanks')}</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#1a1a2e' }}>{t('feedback.title')}</h2>
                  <button style={closeBtnStyle} onClick={close} aria-label="Close">
                    <X size={20} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        border: category === cat.value ? '1px solid #0066ff' : '1px solid #ddd',
                        background: category === cat.value ? 'rgba(0, 102, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
                        color: category === cat.value ? '#0066ff' : '#444',
                        fontWeight: category === cat.value ? '500' : '400',
                      }}
                      onClick={() => setCategory(cat.value)}
                    >
                      {t(cat.key)}
                    </button>
                  ))}
                </div>

                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <textarea
                    value={comment}
                    onInput={(e) => setComment((e.target as HTMLTextAreaElement).value)}
                    maxLength={2000}
                    rows={5}
                    placeholder={t('feedback.placeholder')}
                    style={textareaStyle}
                  />
                  <span style={{ position: 'absolute', bottom: '8px', right: '12px', fontSize: '0.75rem', color: '#999' }}>
                    {comment.length}/2000
                  </span>
                </div>

                <button
                  style={{ ...submitBtnStyle, opacity: canSubmit ? '1' : '0.5', cursor: canSubmit ? 'pointer' : 'not-allowed' }}
                  disabled={!canSubmit}
                  onClick={submit}
                >
                  {submitting ? t('feedback.sending') : (
                    <>
                      <Send size={16} />
                      {t('feedback.submit')}
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const fabStyle: Record<string, string> = {
  position: 'fixed',
  bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
  right: '16px',
  zIndex: '1000',
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  border: 'none',
  background: '#0066ff',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: '0 4px 16px rgba(0, 102, 255, 0.4)',
};

const overlayStyle: Record<string, string> = {
  position: 'fixed',
  inset: '0',
  zIndex: '1001',
  background: 'rgba(0, 0, 0, 0.4)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px',
};

const modalStyle: Record<string, string> = {
  background: 'rgba(255, 255, 255, 0.85)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.5)',
  borderRadius: '16px',
  padding: '24px',
  width: '100%',
  maxWidth: '420px',
  boxShadow: '0 8px 32px rgba(0, 102, 255, 0.15)',
};

const closeBtnStyle: Record<string, string> = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#666',
  padding: '4px',
  borderRadius: '8px',
};

const textareaStyle: Record<string, string> = {
  width: '100%',
  border: '1px solid #ddd',
  borderRadius: '12px',
  padding: '12px',
  fontSize: '0.9rem',
  resize: 'vertical',
  background: 'rgba(255, 255, 255, 0.6)',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const submitBtnStyle: Record<string, string> = {
  width: '100%',
  padding: '12px',
  border: 'none',
  borderRadius: '12px',
  background: '#0066ff',
  color: 'white',
  fontSize: '0.95rem',
  fontWeight: '500',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
};
