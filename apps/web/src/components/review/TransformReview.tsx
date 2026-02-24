import { useState, useEffect, useMemo } from 'preact/hooks';
import {
  FileText,
  ClipboardList,
  ArrowRight,
  ArrowLeftRight,
  Check,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18nStore } from '@/lib/i18n';
import type { TransformSourceDocument } from '@/lib/review/review-types';

interface TransformReviewProps {
  sourceDocument: TransformSourceDocument;
  initialConversion?: { enabled: boolean; targetType: 'invoice' | 'estimate' };
  initialSplit?: unknown;
  initialSchedule?: unknown;
  isExecuting?: boolean;
  error?: string | null;
  onExecute: (config: TransformConfig) => void;
  onBack: () => void;
}

interface TransformConfig {
  conversion: { enabled: boolean; targetType: 'invoice' | 'estimate' };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function TransformReview({
  sourceDocument,
  initialConversion = { enabled: true, targetType: 'invoice' },
  onExecute,
  onBack,
}: TransformReviewProps) {
  const { t } = useI18nStore();

  const [conversionEnabled, setConversionEnabled] = useState(true);
  const [targetType, setTargetType] = useState<'invoice' | 'estimate'>('invoice');
  const [isProcessing, setIsProcessing] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      setConversionEnabled(initialConversion.enabled);
      setTargetType(initialConversion.targetType);
      setInitialized(true);
    }
  }, [initialized, initialConversion]);

  const effectiveType = useMemo(
    () => (conversionEnabled ? targetType : sourceDocument.type),
    [conversionEnabled, targetType, sourceDocument.type]
  );

  const summaryText = useMemo(() => {
    if (!conversionEnabled || sourceDocument.type === targetType) {
      return t('review.noConversionNeeded');
    }
    return t('review.convertFromTo', { from: sourceDocument.type, to: targetType });
  }, [conversionEnabled, sourceDocument.type, targetType, t]);

  const isValid = useMemo(
    () => conversionEnabled && sourceDocument.type !== targetType,
    [conversionEnabled, sourceDocument.type, targetType]
  );

  function handleExecute() {
    if (!isValid || isProcessing) return;
    setIsProcessing(true);

    const config: TransformConfig = {
      conversion: {
        enabled: conversionEnabled,
        targetType,
      },
    };

    onExecute(config);
  }

  return (
    <>
      <style>{`@keyframes trSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .tr-spinning { animation: trSpin 1s linear infinite; } @media (prefers-reduced-motion: reduce) { .tr-spinning { animation: none; } }`}</style>
      <div class="flex flex-col gap-4 pb-[100px]">
        {/* Source Document Card */}
        <section class="bg-white/50 backdrop-blur-[20px] rounded-2xl p-5">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-[var(--gray-500,#64748b)] m-0 mb-4">
            {t('review.sourceDocument')}
          </h2>
          <div class="flex items-center gap-3.5 p-4 bg-white/60 rounded-xl">
            <div class="w-12 h-12 flex items-center justify-center bg-[rgba(0,102,255,0.1)] text-[var(--blu-primary,#0066ff)] rounded-xl shrink-0">
              {sourceDocument.type === 'invoice' ? (
                <FileText size={24} strokeWidth={1.5} />
              ) : (
                <ClipboardList size={24} strokeWidth={1.5} />
              )}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[15px] font-semibold text-[var(--gray-900,#0f172a)] m-0 mb-0.5">
                {sourceDocument.type === 'invoice' ? t('review.invoice') : t('review.estimate')} #{sourceDocument.number}
              </p>
              <p class="text-[13px] text-[var(--gray-500,#64748b)] m-0">
                {sourceDocument.clientName}
              </p>
            </div>
            <div class="text-lg font-bold text-[var(--gray-900,#0f172a)] shrink-0">
              {formatCurrency(sourceDocument.total)}
            </div>
          </div>
        </section>

        {/* Conversion Section */}
        <section class="bg-white/50 backdrop-blur-[20px] rounded-2xl p-5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 flex items-center justify-center bg-[rgba(0,102,255,0.1)] text-[var(--blu-primary,#0066ff)] rounded-[10px]">
                <ArrowLeftRight size={18} />
              </div>
              <h2 class="text-[15px] font-semibold text-[var(--gray-900,#0f172a)] m-0">
                {t('review.convertType')}
              </h2>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t border-black/[0.06]">
            <div class="flex items-center gap-2">
              <button
                class={cn(
                  'flex-1 flex flex-col items-center justify-center gap-1.5 px-3.5 py-[18px] bg-white/60 border-2 border-transparent rounded-xl text-sm font-semibold text-[var(--gray-600,#475569)] cursor-pointer transition-all duration-150 min-h-[80px] relative',
                  targetType === 'estimate' && 'border-[var(--blu-primary,#0066ff)] bg-[rgba(0,102,255,0.08)] text-[var(--blu-primary,#0066ff)]',
                  sourceDocument.type === 'estimate' && targetType === 'estimate' && 'border-[var(--gray-300,#d1d5db)] bg-black/[0.03] text-[var(--gray-500,#64748b)]'
                )}
                onClick={() => setTargetType('estimate')}
                type="button"
              >
                <ClipboardList size={18} />
                {t('review.estimate')}
                {sourceDocument.type === 'estimate' && (
                  <span class="text-[10px] font-semibold uppercase tracking-wider text-[var(--gray-400,#94a3b8)] px-1.5 py-0.5 bg-black/5 rounded">
                    {t('review.current')}
                  </span>
                )}
              </button>
              <div class="text-[var(--gray-400,#94a3b8)] shrink-0">
                <ArrowRight size={16} />
              </div>
              <button
                class={cn(
                  'flex-1 flex flex-col items-center justify-center gap-1.5 px-3.5 py-[18px] bg-white/60 border-2 border-transparent rounded-xl text-sm font-semibold text-[var(--gray-600,#475569)] cursor-pointer transition-all duration-150 min-h-[80px] relative',
                  targetType === 'invoice' && 'border-[var(--blu-primary,#0066ff)] bg-[rgba(0,102,255,0.08)] text-[var(--blu-primary,#0066ff)]',
                  sourceDocument.type === 'invoice' && targetType === 'invoice' && 'border-[var(--gray-300,#d1d5db)] bg-black/[0.03] text-[var(--gray-500,#64748b)]'
                )}
                onClick={() => setTargetType('invoice')}
                type="button"
              >
                <FileText size={18} />
                {t('review.invoice')}
                {sourceDocument.type === 'invoice' && (
                  <span class="text-[10px] font-semibold uppercase tracking-wider text-[var(--gray-400,#94a3b8)] px-1.5 py-0.5 bg-black/5 rounded">
                    {t('review.current')}
                  </span>
                )}
              </button>
            </div>
            <p class="text-[13px] text-[var(--gray-500,#64748b)] text-center mt-4 m-0">
              {sourceDocument.type === targetType
                ? t('review.selectDifferentType')
                : t('review.convertFromTo', { from: sourceDocument.type, to: targetType })}
            </p>
          </div>
        </section>

        {/* Preview Section */}
        <section class="bg-white/70 backdrop-blur-[20px] rounded-2xl p-5">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-[var(--gray-500,#64748b)] m-0 mb-4">
            {t('recording.preview')}
          </h2>
          <p class="text-sm text-[var(--gray-600,#475569)] m-0 mb-4 px-3.5 py-3 bg-[rgba(0,102,255,0.05)] rounded-[10px]">
            {summaryText}
          </p>

          <div class="flex items-center gap-3 p-3.5 bg-white/80 rounded-xl">
            <div class="w-10 h-10 flex items-center justify-center bg-[rgba(0,102,255,0.1)] text-[var(--blu-primary,#0066ff)] rounded-[10px] shrink-0">
              {effectiveType === 'invoice' ? (
                <FileText size={18} strokeWidth={1.5} />
              ) : (
                <ClipboardList size={18} strokeWidth={1.5} />
              )}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-[var(--gray-900,#0f172a)] m-0 mb-0.5">
                {effectiveType === 'invoice' ? t('review.invoice') : t('review.estimate')}
              </p>
              <p class="flex items-center gap-1.5 text-xs text-[var(--gray-500,#64748b)] m-0">
                {t('review.forClient', { client: sourceDocument.clientName })}
              </p>
            </div>
            <div class="text-[15px] font-bold text-[var(--gray-900,#0f172a)] shrink-0">
              {formatCurrency(sourceDocument.total)}
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div class="fixed bottom-0 left-0 right-0 flex gap-3 px-5 py-4 pb-[calc(16px+var(--safe-area-bottom,0px))] bg-white/95 backdrop-blur-[20px] border-t border-black/[0.06] z-[100]">
          <button
            class={cn(
              'flex items-center justify-center gap-2 px-6 py-4 bg-white/80 border border-black/10 rounded-[14px] text-[15px] font-semibold text-[var(--gray-700,#334155)] cursor-pointer transition-all duration-150 min-h-[56px]',
              isProcessing && 'opacity-50 cursor-not-allowed'
            )}
            onClick={onBack}
            type="button"
            disabled={isProcessing}
          >
            <ArrowLeft size={18} />
            {t('review.back')}
          </button>

          <button
            class={cn(
              'flex-1 flex items-center justify-center gap-2.5 px-6 py-4 bg-[var(--blu-primary,#0066ff)] text-white border-none rounded-[14px] text-base font-bold cursor-pointer transition-all duration-200 min-h-[56px]',
              (!isValid || isProcessing) && 'bg-[var(--gray-300,#d1d5db)] text-[var(--gray-500,#64748b)] cursor-not-allowed shadow-none'
            )}
            onClick={handleExecute}
            type="button"
            disabled={!isValid || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 size={20} class="tr-spinning" />
                {t('review.converting')}
              </>
            ) : (
              <>
                <Check size={20} />
                {t('review.convertDocument')}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
