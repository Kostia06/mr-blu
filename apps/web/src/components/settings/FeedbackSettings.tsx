import { useState, useMemo, useCallback } from 'preact/hooks';
import { Send, CheckCircle } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import { cn } from '@/lib/utils';

type Category = 'bug' | 'feature' | 'general' | 'praise';

const MAX_CHARS = 2000;
const CATEGORIES: Category[] = ['bug', 'feature', 'general', 'praise'];

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
      <main className="min-h-screen bg-transparent">
        {renderHeader()}
        <div className="px-[var(--page-padding-x,20px)] max-w-[var(--page-max-width,600px)] mx-auto flex flex-col justify-center gap-[var(--section-gap,24px)] min-h-[calc(100vh-80px)] pb-[100px]">
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="w-[88px] h-[88px] flex items-center justify-center bg-[rgba(0,102,255,0.08)] rounded-full text-[var(--blu-primary,#0066ff)] mb-5">
              <CheckCircle size={48} strokeWidth={1.5} />
            </div>
            <p className="text-base font-medium text-[var(--gray-600,#475569)] m-0 leading-[1.5]">
              {t('feedback.thanks')}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent">
      {renderHeader()}

      <div className="px-[var(--page-padding-x,20px)] max-w-[var(--page-max-width,600px)] mx-auto flex flex-col justify-center gap-[var(--section-gap,24px)] min-h-[calc(100vh-80px)] pb-[100px]">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={cn(
                'px-[18px] py-2 bg-[var(--glass-white-50,rgba(255,255,255,0.5))] backdrop-blur-[8px] border border-[var(--glass-white-30,rgba(255,255,255,0.3))] rounded-full text-sm font-medium text-[var(--gray-600,#475569)] cursor-pointer transition-all duration-150',
                category === cat && 'bg-[var(--blu-primary,#0066ff)] border-[var(--blu-primary,#0066ff)] text-white'
              )}
              onClick={() => setCategory(cat)}
              aria-pressed={category === cat}
            >
              {t(`feedback.${cat}`)}
            </button>
          ))}
        </div>

        <div className="relative">
          <textarea
            className={cn(
              'w-full min-h-[160px] p-4 bg-[var(--glass-white-50,rgba(255,255,255,0.5))] backdrop-blur-[12px] border border-[var(--glass-white-30,rgba(255,255,255,0.3))] rounded-[var(--radius-input,12px)] font-[inherit] text-[15px] leading-[1.6] text-[var(--gray-900,#0f172a)] resize-y transition-[border-color] duration-150 box-border',
              isOverLimit && 'border-[var(--red-500,#ef4444)]'
            )}
            value={comment}
            onInput={(e) => setComment((e.target as HTMLTextAreaElement).value)}
            placeholder={t('feedback.placeholder')}
            rows={6}
            maxLength={MAX_CHARS}
          />
          <div
            className={cn(
              'absolute bottom-3 right-3.5 text-xs text-[var(--gray-400,#94a3b8)] pointer-events-none',
              isOverLimit && 'text-[var(--red-500,#ef4444)]'
            )}
          >
            {charCount}/{MAX_CHARS}
          </div>
        </div>

        <button
          className={cn(
            'flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-[var(--blu-primary,#0066ff)] border-none rounded-[var(--radius-button,14px)] text-[15px] font-semibold text-white cursor-pointer transition-all duration-150',
            !canSubmit && 'opacity-50 cursor-not-allowed'
          )}
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
