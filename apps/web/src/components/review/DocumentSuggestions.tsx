import { FileText, Clock, Sparkles, ChevronRight, X, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18nStore } from '@/lib/i18n';

interface RecentDocument {
  id: string;
  document_number: string;
  client_name: string;
  total: number;
  created_at: string;
  document_type: 'invoice' | 'estimate';
}

interface DocumentSuggestionsProps {
  documents: RecentDocument[];
  onSelect: (document: RecentDocument) => void;
  onDismiss: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function DocumentSuggestions({
  documents,
  onSelect,
  onDismiss,
}: DocumentSuggestionsProps) {
  const t = useI18nStore((s) => s.t);

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('time.today');
    if (diffDays === 1) return t('time.yesterday');
    if (diffDays < 7) return t('documents.xDaysAgo').replace('{n}', String(diffDays));

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <div class="flex flex-col bg-[var(--color-bg-secondary,#dbe8f4)] rounded-2xl overflow-hidden border border-[var(--color-border,#e2e8f0)] shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
      <header class="px-5 pt-4 pb-3 border-b border-black/[0.06]">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-2 text-[var(--color-accent,#0684c7)]">
            <Sparkles size={18} />
            <h3 class="text-[15px] font-semibold text-[var(--color-text,#0f172a)] m-0">
              {t('suggestions.needInspiration')}
            </h3>
          </div>
          <button
            class="w-8 h-8 flex items-center justify-center bg-black/[0.04] border-none rounded-lg text-[var(--color-text-secondary,#64748b)] cursor-pointer transition-all duration-200 hover:bg-black/[0.08] hover:text-[var(--color-text,#0f172a)]"
            onClick={onDismiss}
            aria-label={t('suggestions.dismiss')}
          >
            <X size={18} />
          </button>
        </div>
        <p class="text-[13px] text-[var(--color-text-secondary,#64748b)] m-0">
          {t('suggestions.pickUpWhereLeftOff')}
        </p>
      </header>

      <div class="px-4 py-3 max-h-[320px] overflow-y-auto">
        {documents.length > 0 ? (
          <section class="mb-2">
            <h4 class="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary,#94a3b8)] m-0 mb-2.5 pl-1">
              {t('suggestions.recentDocuments')}
            </h4>
            <div class="flex flex-col gap-2">
              {documents.map((document, i) => {
                const isLatest = i === 0;
                return (
                  <button
                    key={document.id}
                    class={cn(
                      'relative flex items-center gap-3 px-3.5 py-3 bg-white/60 border border-transparent rounded-xl cursor-pointer transition-all duration-200 text-left opacity-0 animate-[doc-fadeInUp_0.3s_ease_forwards]',
                      'hover:bg-white/90 hover:border-[rgba(6,132,199,0.2)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:-translate-y-px',
                      isLatest && 'bg-gradient-to-br from-[rgba(6,132,199,0.08)] to-[rgba(14,165,233,0.08)] border-[rgba(6,132,199,0.15)] hover:from-[rgba(6,132,199,0.12)] hover:to-[rgba(14,165,233,0.12)] hover:border-[rgba(6,132,199,0.3)]'
                    )}
                    onClick={() => onSelect(document)}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {isLatest && (
                      <div class="absolute -top-1.5 right-3 flex items-center gap-[3px] px-2 py-0.5 bg-[var(--color-accent,#0684c7)] rounded-[10px] text-[10px] font-semibold text-white uppercase tracking-wide">
                        <Star size={10} />
                        <span>{t('suggestions.latest')}</span>
                      </div>
                    )}
                    <div
                      class={cn(
                        'w-10 h-10 flex items-center justify-center bg-[rgba(6,132,199,0.1)] rounded-[10px] text-[var(--color-accent,#0684c7)] shrink-0',
                        isLatest && 'bg-[rgba(6,132,199,0.15)]'
                      )}
                    >
                      <FileText size={18} />
                    </div>
                    <div class="flex-1 min-w-0 flex flex-col gap-0.5">
                      <span class="text-sm font-medium text-[var(--color-text,#0f172a)] whitespace-nowrap overflow-hidden text-ellipsis">
                        {document.document_number} - {document.client_name}
                      </span>
                      <div class="flex items-center gap-1 text-xs text-[var(--color-text-secondary,#64748b)]">
                        <span class="font-medium capitalize">{document.document_type}</span>
                        <span class="opacity-50">-</span>
                        <span>{formatCurrency(document.total)}</span>
                        <span class="opacity-50">-</span>
                        <Clock size={12} />
                        <span class="opacity-90">{formatDate(document.created_at)}</span>
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      class="text-[var(--color-text-secondary,#cbd5e1)] shrink-0 transition-all duration-200 group-hover:text-[var(--color-accent,#0684c7)] group-hover:translate-x-0.5"
                    />
                  </button>
                );
              })}
            </div>
          </section>
        ) : (
          <div class="flex flex-col items-center justify-center gap-3 py-10 px-5 text-[var(--color-text-secondary,#94a3b8)]">
            <FileText size={32} />
            <p class="text-sm m-0">{t('suggestions.noRecentDocuments')}</p>
          </div>
        )}
      </div>

      <footer class="px-4 pt-3 pb-4 border-t border-black/[0.06]">
        <button
          class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--color-accent,#0684c7)] border-none rounded-xl text-sm font-medium text-white cursor-pointer transition-all duration-200 hover:bg-[var(--color-primary-600,#056fa6)] hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(6,132,199,0.3)] active:translate-y-0"
          onClick={onDismiss}
        >
          <Sparkles size={16} />
          <span>{t('suggestions.continueWithAI')}</span>
          <ChevronRight size={16} />
        </button>
      </footer>

      <style>{`
        @keyframes doc-fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[doc-fadeInUp_0\\.3s_ease_forwards\\] {
            animation: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}
