import { Loader2, Check, Search, FileText, Receipt, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18nStore } from '@/lib/i18n';
import { SummaryCard } from './SummaryCard';
import type { QueryData, QueryResult, QueryDocument, ClientSuggestion } from '@/lib/review/review-types';
import { navigateTo } from '@/lib/navigation';

interface QueryResultsFlowProps {
  queryData: QueryData | null;
  queryResult: QueryResult | null;
  isLoading: boolean;
  onSelectClient: (clientName: string) => void;
}

function formatQueryAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatQueryDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDocIconClasses(type: string): string {
  if (type === 'invoice') return 'bg-emerald-500/10 text-[var(--data-green)]';
  if (type === 'estimate') return 'bg-purple-500/10 text-purple-500';
  return 'bg-sky-500/10 text-sky-500';
}

function getStatusClasses(status: string): string {
  const map: Record<string, string> = {
    draft: 'bg-[var(--gray-100)] text-[var(--gray-500)]',
    sent: 'bg-sky-500/15 text-sky-400',
    pending: 'bg-amber-500/15 text-amber-300',
    paid: 'bg-emerald-500/15 text-emerald-400',
    overdue: 'bg-red-500/15 text-red-400',
  };
  return map[status] || map.draft;
}

function getMatchClasses(similarity: number): { label: string; classes: string } {
  if (similarity >= 0.8) return { label: 'review.highMatch', classes: 'bg-emerald-500/15 text-emerald-400' };
  if (similarity >= 0.6) return { label: 'review.goodMatch', classes: 'bg-sky-500/15 text-sky-400' };
  return { label: 'review.possibleMatch', classes: 'bg-[var(--gray-100)] text-[var(--gray-500)]' };
}

export function QueryResultsFlow({ queryData, queryResult, isLoading, onSelectClient }: QueryResultsFlowProps) {
  const { t } = useI18nStore();

  return (
    <>
      <style>{`@keyframes qrfSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .qrf-spinning { animation: qrfSpin 1s linear infinite; color: var(--blu-primary, #0066ff); }`}</style>
      <div class="flex-1 px-[var(--page-padding-x)] max-w-[var(--page-max-width)] mx-auto w-full flex flex-col gap-[var(--section-gap)]">
        <SummaryCard
          summary={queryData?.naturalLanguageQuery || queryData?.summary || 'Processing your query...'}
          variant="info-query"
          label="Your question"
        />

        {isLoading && (
          <div class="flex flex-col items-center justify-center gap-4 py-[60px] px-[var(--page-padding-x,20px)] text-[var(--gray-500)]">
            <Loader2 size={24} class="qrf-spinning" />
            <span class="text-sm">{t('review.searchingDocuments')}</span>
          </div>
        )}

        {!isLoading && queryResult && (
          <>
            {queryResult.answer && (
              <div class="flex items-start gap-3 p-4 bg-emerald-500/[0.08] border border-emerald-500/20 rounded-[14px]">
                <div class="w-9 h-9 flex items-center justify-center bg-emerald-500/15 rounded-[10px] text-emerald-400 shrink-0">
                  <Check size={20} />
                </div>
                <p class="text-[15px] leading-relaxed text-[var(--gray-900)] m-0 pt-1.5">
                  {queryResult.answer}
                </p>
              </div>
            )}

            {queryResult.summary && (
              <>
                <div class="grid grid-cols-2 gap-3 mt-4">
                  <div class="flex flex-col items-center gap-1 px-3.5 py-[18px] border border-[var(--gray-200)] rounded-[14px]">
                    <span class="text-[22px] font-bold text-[var(--gray-900)]">
                      {queryResult.summary.count}
                    </span>
                    <span class="text-xs text-[var(--gray-500)]">{t('review.documents')}</span>
                  </div>
                  <div class="flex flex-col items-center gap-1 px-3.5 py-[18px] border border-[var(--gray-200)] rounded-[14px]">
                    <span class="text-[22px] font-bold text-[var(--gray-900)]">
                      {formatQueryAmount(queryResult.summary.totalAmount)}
                    </span>
                    <span class="text-xs text-[var(--gray-500)]">{t('review.totalAmountLabel')}</span>
                  </div>
                </div>

                {Object.keys(queryResult.summary.byStatus).length > 0 && (
                  <div class="mt-4">
                    <h4 class="text-xs font-semibold text-[var(--gray-500)] uppercase tracking-wider m-0 mb-2.5">
                      {t('review.byStatus')}
                    </h4>
                    <div class="flex flex-wrap gap-2">
                      {Object.entries(queryResult.summary.byStatus).map(([status, value]) => (
                        <span
                          key={status}
                          class={cn('px-3 py-1.5 rounded-lg text-xs font-medium capitalize', getStatusClasses(status))}
                        >
                          {status}: {queryResult.queryType === 'sum' ? formatQueryAmount(value as number) : value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {queryResult.documents && queryResult.documents.length > 0 ? (
              <div class="mt-5">
                <h4 class="text-sm font-semibold text-[var(--gray-600)] m-0 mb-3">
                  {t('review.documentsFound')}
                </h4>
                <div class="flex flex-col gap-2.5">
                  {queryResult.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={`/dashboard/documents/${doc.id}?type=${doc.documentType}`}
                      class="flex items-center gap-3 px-4 py-3.5 border border-[var(--gray-200)] rounded-[14px] no-underline transition-all duration-200 hover:bg-[var(--gray-100)] hover:border-[#cbd5e1] hover:-translate-y-px"
                    >
                      <div class={cn('w-10 h-10 flex items-center justify-center rounded-[10px] shrink-0', getDocIconClasses(doc.type))}>
                        {doc.type === 'invoice' ? <Receipt size={18} /> : <FileText size={18} />}
                      </div>
                      <div class="flex-1 min-w-0">
                        <span class="block text-sm font-semibold text-[var(--gray-900)] whitespace-nowrap overflow-hidden text-ellipsis">
                          {doc.title}
                        </span>
                        <span class="flex items-center gap-1.5 text-xs text-[var(--gray-500)] mt-0.5">
                          <span class="px-1.5 py-0.5 bg-[var(--gray-100)] rounded text-[10px] font-semibold uppercase">
                            {doc.type}
                          </span>
                          {doc.client} &middot; {formatQueryDate(doc.date)}
                        </span>
                      </div>
                      <div class="flex flex-col items-end gap-1">
                        {doc.amount > 0 && (
                          <span class="text-sm font-semibold text-[var(--data-green)]">
                            {formatQueryAmount(doc.amount)}
                          </span>
                        )}
                        <span class={cn('px-2 py-0.5 rounded-md text-[10px] font-semibold capitalize', getStatusClasses(doc.status))}>
                          {doc.status}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ) : queryResult.success ? (
              <div class="flex flex-col items-center gap-3 py-10 px-5 text-[var(--gray-500)] text-center">
                <Search size={32} />
                <p class="m-0 text-sm">{t('review.noDocumentsMatch')}</p>
              </div>
            ) : null}

            {queryResult?.suggestions?.alternatives && queryResult.suggestions.alternatives.length > 0 && (
              <div class="mt-5 p-4 bg-amber-500/[0.08] border border-amber-500/20 rounded-[14px]">
                <h4 class="flex items-center gap-2 text-sm font-semibold text-amber-300 m-0 mb-1.5">
                  <Search size={16} />
                  {queryResult.documents?.length ? t('review.similarClients') : t('review.didYouMean')}
                </h4>
                <p class="text-[13px] text-[var(--gray-500)] m-0 mb-3.5">
                  {queryResult.documents?.length
                    ? t('review.speechMisheard')
                    : t('review.selectClientBelow', { client: queryResult.suggestions.searchedFor })}
                </p>
                <div class="flex flex-col gap-2">
                  {queryResult.suggestions.alternatives.map((suggestion) => {
                    const match = getMatchClasses(suggestion.similarity);
                    return (
                      <button
                        key={suggestion.id}
                        class="flex items-center justify-between px-3.5 py-3 bg-transparent border border-[var(--gray-200)] rounded-[10px] transition-all duration-200 text-left cursor-pointer hover:bg-amber-500/15 hover:border-amber-500/30 hover:-translate-y-px"
                        onClick={() => onSelectClient(suggestion.name)}
                      >
                        <span class="text-sm font-medium text-[var(--gray-900)]">{suggestion.name}</span>
                        <span class={cn('text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md', match.classes)}>
                          {t(match.label)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        <div class="flex gap-3 mt-6 pt-5 border-t border-[var(--gray-200)]">
          <button
            class="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 bg-[var(--gray-100)] text-[var(--gray-600)] border border-[var(--gray-200)] hover:bg-[var(--gray-200)]"
            onClick={() => navigateTo('/dashboard/documents')}
          >
            <FileText size={18} />
            View All Documents
          </button>
          <button
            class="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 border-none bg-gradient-to-br from-[#0066ff] to-[#0052cc] text-white shadow-[0_4px_12px_rgba(0,102,255,0.25)] hover:shadow-[0_6px_16px_rgba(0,102,255,0.35)]"
            onClick={() => navigateTo('/dashboard')}
          >
            <Mic size={18} />
            New Recording
          </button>
        </div>
      </div>
    </>
  );
}
