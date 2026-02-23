import { Loader2, Check, Search, FileText, Receipt, Mic } from 'lucide-react';
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

function getDocIconClass(type: string): Record<string, string> {
  if (type === 'invoice') {
    return { background: 'rgba(16, 185, 129, 0.1)', color: 'var(--data-green)' };
  }
  if (type === 'estimate') {
    return { background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' };
  }
  return { background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' };
}

function getStatusStyle(status: string): Record<string, string> {
  const map: Record<string, Record<string, string>> = {
    draft: { background: 'var(--gray-100)', color: 'var(--gray-500)' },
    sent: { background: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8' },
    pending: { background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' },
    paid: { background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' },
    overdue: { background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' },
  };
  return map[status] || map.draft;
}

function getMatchLabel(similarity: number, t: (key: string) => string): { label: string; style: Record<string, string> } {
  if (similarity >= 0.8) {
    return { label: t('review.highMatch'), style: { background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' } };
  }
  if (similarity >= 0.6) {
    return { label: t('review.goodMatch'), style: { background: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8' } };
  }
  return { label: t('review.possibleMatch'), style: { background: 'var(--gray-100)', color: 'var(--gray-500)' } };
}

export function QueryResultsFlow({ queryData, queryResult, isLoading, onSelectClient }: QueryResultsFlowProps) {
  const { t } = useI18nStore();

  return (
    <>
      <style>{keyframes}</style>
      <div style={styles.content}>
        <SummaryCard
          summary={queryData?.naturalLanguageQuery || queryData?.summary || 'Processing your query...'}
          variant="info-query"
          label="Your question"
        />

        {isLoading && (
          <div style={styles.queryLoading}>
            <Loader2 size={24} class="qrf-spinning" />
            <span style={{ fontSize: '14px' }}>{t('review.searchingDocuments')}</span>
          </div>
        )}

        {!isLoading && queryResult && (
          <>
            {queryResult.answer && (
              <div style={styles.queryAnswerCard}>
                <div style={styles.answerIcon}>
                  <Check size={20} />
                </div>
                <p style={styles.answerText}>{queryResult.answer}</p>
              </div>
            )}

            {queryResult.summary && (
              <>
                <div style={styles.queryStats}>
                  <div style={styles.statCard}>
                    <span style={styles.statValue}>{queryResult.summary.count}</span>
                    <span style={styles.statLabel}>{t('review.documents')}</span>
                  </div>
                  <div style={styles.statCard}>
                    <span style={styles.statValue}>{formatQueryAmount(queryResult.summary.totalAmount)}</span>
                    <span style={styles.statLabel}>{t('review.totalAmountLabel')}</span>
                  </div>
                </div>

                {Object.keys(queryResult.summary.byStatus).length > 0 && (
                  <div style={styles.breakdownSection}>
                    <h4 style={styles.breakdownTitle}>{t('review.byStatus')}</h4>
                    <div style={styles.breakdownChips}>
                      {Object.entries(queryResult.summary.byStatus).map(([status, value]) => (
                        <span key={status} style={{ ...styles.breakdownChip, ...getStatusStyle(status) }}>
                          {status}: {queryResult.queryType === 'sum' ? formatQueryAmount(value as number) : value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {queryResult.documents && queryResult.documents.length > 0 ? (
              <div style={styles.queryResultsSection}>
                <h4 style={styles.resultsTitle}>{t('review.documentsFound')}</h4>
                <div style={styles.queryDocList}>
                  {queryResult.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={`/dashboard/documents/${doc.id}?type=${doc.documentType}`}
                      style={styles.queryDocItem}
                    >
                      <div style={{ ...styles.queryDocIcon, ...getDocIconClass(doc.type) }}>
                        {doc.type === 'invoice' ? <Receipt size={18} /> : <FileText size={18} />}
                      </div>
                      <div style={styles.queryDocInfo}>
                        <span style={styles.queryDocTitle}>{doc.title}</span>
                        <span style={styles.queryDocMeta}>
                          <span style={styles.queryDocType}>{doc.type}</span>
                          {doc.client} &middot; {formatQueryDate(doc.date)}
                        </span>
                      </div>
                      <div style={styles.queryDocEnd}>
                        {doc.amount > 0 && (
                          <span style={styles.queryDocAmount}>{formatQueryAmount(doc.amount)}</span>
                        )}
                        <span style={{ ...styles.queryDocStatus, ...getStatusStyle(doc.status) }}>
                          {doc.status}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ) : queryResult.success ? (
              <div style={styles.noResults}>
                <Search size={32} />
                <p style={{ margin: '0', fontSize: '14px' }}>{t('review.noDocumentsMatch')}</p>
              </div>
            ) : null}

            {queryResult?.suggestions?.alternatives && queryResult.suggestions.alternatives.length > 0 && (
              <div style={styles.suggestionsSection}>
                <h4 style={styles.suggestionsTitle}>
                  <Search size={16} />
                  {queryResult.documents?.length ? t('review.similarClients') : t('review.didYouMean')}
                </h4>
                <p style={styles.suggestionsSubtitle}>
                  {queryResult.documents?.length
                    ? t('review.speechMisheard')
                    : t('review.selectClientBelow', { client: queryResult.suggestions.searchedFor })}
                </p>
                <div style={styles.suggestionsList}>
                  {queryResult.suggestions.alternatives.map((suggestion) => {
                    const match = getMatchLabel(suggestion.similarity, t);
                    return (
                      <button
                        key={suggestion.id}
                        style={styles.suggestionBtn}
                        onClick={() => onSelectClient(suggestion.name)}
                      >
                        <span style={styles.suggestionName}>{suggestion.name}</span>
                        <span style={{ ...styles.suggestionMatch, ...match.style }}>{match.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        <div style={styles.queryActions}>
          <button
            style={{ ...styles.btn, ...styles.btnSecondary, flex: '1' }}
            onClick={() => navigateTo('/dashboard/documents')}
          >
            <FileText size={18} />
            View All Documents
          </button>
          <button
            style={{ ...styles.btn, ...styles.btnPrimary, flex: '1' }}
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

const keyframes = `
@keyframes qrfSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.qrf-spinning { animation: qrfSpin 1s linear infinite; color: var(--blu-primary, #0066ff); }
.query-doc-item-hover:hover {
  background: var(--gray-100);
  border-color: #cbd5e1;
  transform: translateY(-1px);
}
.suggestion-btn-hover:hover {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.3);
  transform: translateY(-1px);
}
`;

const styles: Record<string, Record<string, string>> = {
  content: {
    flex: '1',
    padding: 'var(--page-padding-x)',
    maxWidth: 'var(--page-max-width)',
    margin: '0 auto',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--section-gap)',
  },
  queryLoading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '60px var(--page-padding-x, 20px)',
    color: 'var(--gray-500)',
  },
  queryAnswerCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px',
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '14px',
  },
  answerIcon: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(16, 185, 129, 0.15)',
    borderRadius: '10px',
    color: '#34d399',
    flexShrink: '0',
  },
  answerText: {
    fontSize: '15px',
    lineHeight: '1.5',
    color: 'var(--gray-900)',
    margin: '0',
    paddingTop: '6px',
  },
  queryStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginTop: '16px',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '18px 14px',
    background: 'transparent',
    border: '1px solid var(--gray-200)',
    borderRadius: '14px',
  },
  statValue: {
    fontSize: '22px',
    fontWeight: '700',
    color: 'var(--gray-900)',
  },
  statLabel: {
    fontSize: '12px',
    color: 'var(--gray-500)',
  },
  breakdownSection: {
    marginTop: '16px',
  },
  breakdownTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--gray-500)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: '0 0 10px',
  },
  breakdownChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  breakdownChip: {
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  queryResultsSection: {
    marginTop: '20px',
  },
  resultsTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--gray-600)',
    margin: '0 0 12px',
  },
  queryDocList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  queryDocItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    background: 'transparent',
    border: '1px solid var(--gray-200)',
    borderRadius: '14px',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
  },
  queryDocIcon: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    flexShrink: '0',
  },
  queryDocInfo: {
    flex: '1',
    minWidth: '0',
  },
  queryDocTitle: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--gray-900)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  queryDocMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: 'var(--gray-500)',
    marginTop: '2px',
  },
  queryDocType: {
    padding: '2px 6px',
    background: 'var(--gray-100)',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  queryDocEnd: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
  },
  queryDocAmount: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--data-green)',
  },
  queryDocStatus: {
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '10px',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  noResults: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '40px 20px',
    color: 'var(--gray-500)',
    textAlign: 'center',
  },
  queryActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid var(--gray-200)',
  },
  suggestionsSection: {
    marginTop: '20px',
    padding: '16px',
    background: 'rgba(245, 158, 11, 0.08)',
    border: '1px solid rgba(245, 158, 11, 0.2)',
    borderRadius: '14px',
  },
  suggestionsTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#fbbf24',
    margin: '0 0 6px',
  },
  suggestionsSubtitle: {
    fontSize: '13px',
    color: 'var(--gray-500)',
    margin: '0 0 14px',
  },
  suggestionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  suggestionBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 14px',
    background: 'transparent',
    border: '1px solid var(--gray-200)',
    borderRadius: '10px',
    transition: 'all 0.2s ease',
    textAlign: 'left',
    cursor: 'pointer',
  },
  suggestionName: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--gray-900)',
  },
  suggestionMatch: {
    fontSize: '10px',
    fontWeight: '600',
    textTransform: 'uppercase',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 20px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #0066ff, #0052cc)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(0, 102, 255, 0.25)',
  },
  btnSecondary: {
    background: 'var(--gray-100)',
    color: 'var(--gray-600)',
    border: '1px solid var(--gray-200)',
  },
};
