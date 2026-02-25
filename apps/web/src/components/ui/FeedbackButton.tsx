import { useState, useCallback } from 'preact/hooks';
import { MessageCircle, X, Send, CheckCircle } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import { useAppStateStore } from '@/stores/appStateStore';
import { cn } from '@/lib/utils';

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
        <button
          class="fixed bottom-[calc(80px+env(safe-area-inset-bottom,0px))] right-4 z-[1000] w-12 h-12 rounded-full border-none bg-[#0066ff] text-white flex items-center justify-center cursor-pointer shadow-[0_4px_16px_rgba(0,102,255,0.4)]"
          onClick={openModal}
          aria-label="Send feedback"
        >
          <MessageCircle size={22} />
        </button>
      )}

      {/* Modal */}
      {open && (
        <div
          class="fixed inset-0 z-[1001] bg-black/40 backdrop-blur-[4px] flex items-center justify-center p-4"
          onClick={close}
          onKeyDown={(e) => { if (e.key === 'Escape') close(); }}
        >
          <div
            class="bg-white/85 backdrop-blur-[20px] border border-white/50 rounded-2xl p-6 w-full max-w-[420px] shadow-[0_8px_32px_rgba(0,102,255,0.15)]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {success ? (
              <div class="flex flex-col items-center gap-3 py-8 text-center">
                <CheckCircle size={48} class="text-[#0066FF]" />
                <p class="m-0 text-[1.05rem] font-medium text-[#1a1a2e]">{t('feedback.thanks')}</p>
              </div>
            ) : (
              <>
                <div class="flex justify-between items-center mb-4">
                  <h2 class="m-0 text-[1.15rem] font-semibold text-[#1a1a2e]">{t('feedback.title')}</h2>
                  <button
                    class="bg-transparent border-none cursor-pointer text-[#666] p-1 rounded-lg"
                    onClick={close}
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div class="flex flex-wrap gap-2 mb-4">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      class={cn(
                        'px-3.5 py-1.5 rounded-[20px] text-[0.85rem] cursor-pointer border',
                        category === cat.value
                          ? 'border-[#0066ff] bg-[rgba(0,102,255,0.1)] text-[#0066ff] font-medium'
                          : 'border-[#ddd] bg-white/60 text-[#444] font-normal',
                      )}
                      onClick={() => setCategory(cat.value)}
                    >
                      {t(cat.key)}
                    </button>
                  ))}
                </div>

                <div class="relative mb-4">
                  <textarea
                    value={comment}
                    onInput={(e) => setComment((e.target as HTMLTextAreaElement).value)}
                    maxLength={2000}
                    rows={5}
                    placeholder={t('feedback.placeholder')}
                    class="w-full border border-[#ddd] rounded-xl p-3 text-[0.9rem] resize-y bg-white/60 font-[inherit] box-border"
                  />
                  <span class="absolute bottom-2 right-3 text-xs text-[#999]">
                    {comment.length}/2000
                  </span>
                </div>

                <button
                  class={cn(
                    'w-full p-3 border-none rounded-xl bg-[#0066ff] text-white text-[0.95rem] font-medium flex items-center justify-center gap-2',
                    canSubmit ? 'opacity-100 cursor-pointer' : 'opacity-50 cursor-not-allowed',
                  )}
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
