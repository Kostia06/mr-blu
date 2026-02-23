import { useState, useMemo, useCallback } from 'preact/hooks';
import { Send, CheckCircle } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';

type Category = 'bug' | 'feature' | 'general' | 'praise';

const MAX_CHARS = 2000;
const CATEGORIES: Category[] = ['bug', 'feature', 'general', 'praise'];

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
    justifyContent: 'center',
    gap: 'var(--section-gap, 24px)',
    minHeight: 'calc(100vh - 80px)',
    paddingBottom: 100,
  },
  categorySelector: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  categoryPill: {
    padding: '8px 18px',
    background: 'var(--glass-white-50, rgba(255, 255, 255, 0.5))',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid var(--glass-white-30, rgba(255, 255, 255, 0.3))',
    borderRadius: 100,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--gray-600, #475569)',
    cursor: 'pointer',
    transition: 'all var(--duration-fast, 150ms) ease',
  },
  categoryPillSelected: {
    background: 'var(--blu-primary, #0066ff)',
    borderColor: 'var(--blu-primary, #0066ff)',
    color: 'white',
  },
  textareaWrapper: {
    position: 'relative' as const,
  },
  textarea: {
    width: '100%',
    minHeight: 160,
    padding: 16,
    background: 'var(--glass-white-50, rgba(255, 255, 255, 0.5))',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid var(--glass-white-30, rgba(255, 255, 255, 0.3))',
    borderRadius: 'var(--radius-input, 12px)',
    fontFamily: 'inherit',
    fontSize: 15,
    lineHeight: 1.6,
    color: 'var(--gray-900, #0f172a)',
    resize: 'vertical' as const,
    transition: 'border-color var(--duration-fast, 150ms) ease',
    boxSizing: 'border-box' as const,
  },
  textareaOverLimit: {
    borderColor: 'var(--red-500, #ef4444)',
  },
  charCount: {
    position: 'absolute' as const,
    bottom: 12,
    right: 14,
    fontSize: 12,
    color: 'var(--gray-400, #94a3b8)',
    pointerEvents: 'none' as const,
  },
  charCountOverLimit: {
    color: 'var(--red-500, #ef4444)',
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    padding: '14px 24px',
    background: 'var(--blu-primary, #0066ff)',
    border: 'none',
    borderRadius: 'var(--radius-button, 14px)',
    fontSize: 15,
    fontWeight: 600,
    color: 'white',
    cursor: 'pointer',
    transition: 'all var(--duration-fast, 150ms) ease',
  },
  submitBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  successState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px 24px',
    textAlign: 'center' as const,
  },
  successIcon: {
    width: 88,
    height: 88,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 102, 255, 0.08)',
    borderRadius: '50%',
    color: 'var(--blu-primary, #0066ff)',
    marginBottom: 20,
  },
  successText: {
    fontSize: 16,
    fontWeight: 500,
    color: 'var(--gray-600, #475569)',
    margin: 0,
    lineHeight: 1.5,
  },
};

export function FeedbackSettings() {
  const { t } = useI18nStore();

  const [comment, setComment] = useState('');
  const [category, setCategory] = useState<Category>('general');
  const [isSending, setIsSending] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const charCount = comment.length;
  const isOverLimit = charCount > MAX_CHARS;
  const canSubmit = useMemo(
    () => comment.trim().length > 0 && !isOverLimit && !isSending,
    [comment, isOverLimit, isSending]
  );

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;

    setIsSending(true);
    try {
      const { submitFeedback } = await import('@/lib/api/external');
      await submitFeedback({
        comment: comment.trim(),
        category,
        pageContext: '/dashboard/settings/feedback',
      });
      setIsSubmitted(true);
    } catch {
      // silently fail
    } finally {
      setIsSending(false);
    }
  }, [canSubmit, comment, category]);

  const renderHeader = () => (
    <SettingsPageHeader
      title={t('feedback.title')}
      backLabel={t('common.backToSettings')}
    />
  );

  if (isSubmitted) {
    return (
      <main style={styles.page}>
        {renderHeader()}
        <div style={styles.content}>
          <div style={styles.successState}>
            <div style={styles.successIcon}>
              <CheckCircle size={48} strokeWidth={1.5} />
            </div>
            <p style={styles.successText}>{t('feedback.thanks')}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      {renderHeader()}

      <div style={styles.content}>
        <div style={styles.categorySelector}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              style={{
                ...styles.categoryPill,
                ...(category === cat ? styles.categoryPillSelected : {}),
              }}
              onClick={() => setCategory(cat)}
              aria-pressed={category === cat}
            >
              {t(`feedback.${cat}`)}
            </button>
          ))}
        </div>

        <div style={styles.textareaWrapper}>
          <textarea
            style={{
              ...styles.textarea,
              ...(isOverLimit ? styles.textareaOverLimit : {}),
            }}
            value={comment}
            onInput={(e) => setComment((e.target as HTMLTextAreaElement).value)}
            placeholder={t('feedback.placeholder')}
            rows={6}
            maxLength={MAX_CHARS}
          />
          <div style={{
            ...styles.charCount,
            ...(isOverLimit ? styles.charCountOverLimit : {}),
          }}>
            {charCount}/{MAX_CHARS}
          </div>
        </div>

        <button
          style={{
            ...styles.submitBtn,
            ...(!canSubmit ? styles.submitBtnDisabled : {}),
          }}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {isSending ? (
            <span>{t('feedback.sending')}</span>
          ) : (
            <>
              <Send size={18} strokeWidth={2} />
              <span>{t('feedback.submit')}</span>
            </>
          )}
        </button>
      </div>
    </main>
  );
}
