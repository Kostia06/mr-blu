import { Sparkles, FileText, Receipt, AlertCircle, Loader2 } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import type { SourceDocument } from '@/lib/review/review-types';
import { navigateTo } from '@/lib/navigation';

interface CloneClientSuggestion {
  name: string;
  similarity: number;
}

interface CloneData {
  sourceClient: string;
  summary: string;
}

interface CloneDocumentFlowProps {
  cloneData: CloneData | null;
  sourceDocuments: SourceDocument[];
  isSearching: boolean;
  clientSuggestions: CloneClientSuggestion[];
  onSelectDocument: (doc: SourceDocument) => void;
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

function getSuggestionMatchStyle(
  similarity: number,
  t: (key: string) => string
): { label: string; style: Record<string, string> } {
  if (similarity >= 0.7) {
    return { label: t('review.highMatch'), style: { background: 'rgba(16, 185, 129, 0.2)', color: 'var(--data-green)' } };
  }
  if (similarity >= 0.5) {
    return { label: t('review.goodMatch'), style: { background: 'rgba(14, 165, 233, 0.2)', color: '#38bdf8' } };
  }
  return { label: t('review.possibleMatch'), style: { background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' } };
}

export function CloneDocumentFlow({
  cloneData,
  sourceDocuments,
  isSearching,
  clientSuggestions,
  onSelectDocument,
  onSelectClient,
}: CloneDocumentFlowProps) {
  const { t } = useI18nStore();

  return (
    <>
      <style>{keyframes}</style>
      <div style={styles.content}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryHeader}>
            <Sparkles size={16} style={{ flexShrink: '0' }} />
            <span>{t('review.cloningDocument')}</span>
          </div>
          <p style={styles.summaryText}>{cloneData?.summary || 'Finding document to clone...'}</p>
        </div>

        {isSearching && (
          <div style={styles.queryLoading}>
            <Loader2 size={24} class="cdf-spinning" />
            <span style={{ fontSize: '14px' }}>{t('review.searchingFor', { client: cloneData?.sourceClient })}</span>
          </div>
        )}

        {!isSearching && sourceDocuments.length > 0 && (
          <div style={styles.docSelection}>
            <h3 style={styles.selectionTitle}>{t('review.selectDocumentToClone')}</h3>
            <p style={styles.selectionSubtitle}>
              {t('review.foundDocuments', {
                n: sourceDocuments.length,
                client: cloneData?.sourceClient,
              })}
            </p>

            <div style={styles.sourceDocList}>
              {sourceDocuments.map((doc) => (
                <button key={doc.id} style={styles.sourceDocCard} onClick={() => onSelectDocument(doc)}>
                  <div
                    style={{
                      ...styles.sourceDocIcon,
                      ...(doc.type === 'invoice'
                        ? { background: 'rgba(16, 185, 129, 0.15)', color: 'var(--data-green)' }
                        : { background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }),
                    }}
                  >
                    {doc.type === 'invoice' ? <Receipt size={20} /> : <FileText size={20} />}
                  </div>
                  <div style={styles.sourceDocInfo}>
                    <span style={styles.sourceDocTitle}>{doc.title}</span>
                    <span style={styles.sourceDocMeta}>
                      {doc.client} &bull; {formatQueryDate(doc.date)}
                    </span>
                  </div>
                  <div style={styles.sourceDocAmount}>{formatQueryAmount(doc.amount)}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {!isSearching && sourceDocuments.length === 0 && (
          <div style={styles.noDocsFound}>
            <AlertCircle size={32} />
            <p style={{ margin: '12px 0 20px', fontSize: '14px' }}>
              {t('review.noDocumentsFor', { client: cloneData?.sourceClient })}
            </p>

            {clientSuggestions.length > 0 ? (
              <div style={styles.cloneSuggestions}>
                <p style={styles.cloneSuggestionsLabel}>{t('review.speechMisheard')}</p>
                <div style={styles.cloneSuggestionsList}>
                  {clientSuggestions.map((suggestion, index) => {
                    const match = getSuggestionMatchStyle(suggestion.similarity, t);
                    return (
                      <button
                        key={index}
                        style={styles.cloneSuggestionBtn}
                        onClick={() => onSelectClient(suggestion.name)}
                      >
                        <span style={styles.suggestName}>{suggestion.name}</span>
                        <span style={{ ...styles.suggestMatch, ...match.style }}>{match.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <button
                style={{ ...styles.btn, ...styles.btnSecondary }}
                onClick={() => navigateTo('/dashboard')}
              >
                Back to Dashboard
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

const keyframes = `
@keyframes cdfSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.cdf-spinning { animation: cdfSpin 1s linear infinite; color: var(--blu-primary, #0066ff); }
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
  summaryCard: {
    borderColor: 'rgba(168, 85, 247, 0.2)',
    background: 'rgba(168, 85, 247, 0.05)',
    borderRadius: 'var(--radius-card)',
    padding: 'var(--space-5)',
    border: '1px solid rgba(168, 85, 247, 0.2)',
  },
  summaryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    marginBottom: 'var(--space-2-5)',
    color: '#a855f7',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
  },
  summaryText: {
    fontSize: 'var(--text-base)',
    lineHeight: '1.5',
    color: 'var(--gray-700)',
    margin: '0',
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
  docSelection: {
    marginTop: '20px',
  },
  selectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--gray-900)',
    margin: '0 0 6px',
  },
  selectionSubtitle: {
    fontSize: '13px',
    color: 'var(--gray-500)',
    margin: '0 0 16px',
  },
  sourceDocList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  sourceDocCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 16px',
    background: 'transparent',
    border: '1px solid var(--gray-200)',
    borderRadius: '14px',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  },
  sourceDocIcon: {
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    flexShrink: '0',
  },
  sourceDocInfo: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: '0',
  },
  sourceDocTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--gray-900)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  sourceDocMeta: {
    fontSize: '12px',
    color: 'var(--gray-500)',
  },
  sourceDocAmount: {
    fontSize: '15px',
    fontWeight: '600',
    color: 'var(--data-green)',
  },
  noDocsFound: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px',
    textAlign: 'center',
    color: 'var(--gray-500)',
  },
  cloneSuggestions: {
    marginTop: '16px',
    width: '100%',
    maxWidth: '320px',
  },
  cloneSuggestionsLabel: {
    fontSize: '13px',
    color: 'var(--gray-500)',
    marginBottom: '12px',
    textAlign: 'center',
  },
  cloneSuggestionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  cloneSuggestionBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'transparent',
    border: '1px solid var(--gray-200)',
    borderRadius: '12px',
    color: 'var(--gray-900)',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  },
  suggestName: {
    flex: '1',
    textAlign: 'left',
  },
  suggestMatch: {
    fontSize: '10px',
    fontWeight: '600',
    padding: '3px 8px',
    borderRadius: '6px',
    textTransform: 'uppercase',
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
  btnSecondary: {
    background: 'var(--gray-100)',
    color: 'var(--gray-600)',
    border: '1px solid var(--gray-200)',
  },
};
