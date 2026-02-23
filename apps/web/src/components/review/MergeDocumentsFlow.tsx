import { useMemo } from 'preact/hooks';
import { Sparkles, FileText, Receipt, AlertCircle, Loader2, Check, Plus } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import type { SourceDocument, MergeSourceSelection } from '@/lib/review/review-types';
import { navigateTo } from '@/lib/navigation';

interface MergeData {
  summary: string;
}

interface MergeDocumentsFlowProps {
  mergeData: MergeData | null;
  mergeSourceSelections: MergeSourceSelection[];
  onSelectDocument: (index: number, doc: SourceDocument) => void;
  onConfirmMerge: () => void;
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

export function MergeDocumentsFlow({
  mergeData,
  mergeSourceSelections,
  onSelectDocument,
  onConfirmMerge,
}: MergeDocumentsFlowProps) {
  const { t } = useI18nStore();

  const allMergeSourcesSelected = useMemo(
    () => mergeSourceSelections.length > 0 && mergeSourceSelections.every((s) => s.selectedDoc !== null),
    [mergeSourceSelections]
  );

  const selectedCount = useMemo(
    () => mergeSourceSelections.filter((s) => s.selectedDoc).length,
    [mergeSourceSelections]
  );

  return (
    <>
      <style>{keyframes}</style>
      <div style={styles.content}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryHeader}>
            <Sparkles size={16} style={{ flexShrink: '0' }} />
            <span>{t('review.mergingDocuments')}</span>
          </div>
          <p style={styles.summaryText}>{mergeData?.summary || t('review.mergingDocuments')}</p>
        </div>

        <div style={styles.mergeSelection}>
          <h3 style={styles.selectionTitle}>{t('review.selectDocsToMerge')}</h3>
          <p style={styles.selectionSubtitle}>{t('review.chooseFromEachClient')}</p>

          {mergeSourceSelections.map((sel, index) => (
            <div key={index} style={styles.mergeSourceSection}>
              <h4 style={styles.mergeSourceTitle}>
                <span style={styles.mergeSourceNumber}>{index + 1}</span>
                Documents from {sel.clientName}
              </h4>

              {sel.isSearching && (
                <div style={styles.mergeSourceLoading}>
                  <Loader2 size={18} class="mdf-spinning" />
                  <span>{t('review.searching')}</span>
                </div>
              )}

              {!sel.isSearching && sel.documents.length > 0 && (
                <div style={styles.mergeDocOptions}>
                  {sel.documents.map((doc) => {
                    const isSelected = sel.selectedDoc?.id === doc.id;
                    return (
                      <button
                        key={doc.id}
                        style={{
                          ...styles.mergeDocOption,
                          ...(isSelected ? styles.mergeDocOptionSelected : {}),
                        }}
                        onClick={() => onSelectDocument(index, doc)}
                      >
                        <div
                          style={{
                            ...styles.mergeDocIcon,
                            ...(doc.type === 'invoice'
                              ? { background: 'rgba(16, 185, 129, 0.15)', color: 'var(--data-green)' }
                              : doc.type === 'estimate'
                                ? { background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }
                                : {}),
                          }}
                        >
                          {doc.type === 'invoice' ? <Receipt size={16} /> : <FileText size={16} />}
                        </div>
                        <div style={styles.mergeDocInfo}>
                          <span style={styles.mergeDocTitle}>{doc.title}</span>
                          <span style={styles.mergeDocMeta}>{formatQueryDate(doc.date)}</span>
                        </div>
                        <div style={styles.mergeDocAmount}>{formatQueryAmount(doc.amount)}</div>
                        {isSelected && <Check size={16} style={{ color: '#38bdf8', flexShrink: '0' }} />}
                      </button>
                    );
                  })}
                </div>
              )}

              {!sel.isSearching && sel.documents.length === 0 && (
                <div style={styles.mergeNoDocs}>
                  <AlertCircle size={18} />
                  <span>{t('review.noDocsForClient', { client: sel.clientName })}</span>
                </div>
              )}
            </div>
          ))}

          <div style={styles.mergeActions}>
            <button
              style={{
                ...styles.btn,
                ...styles.btnPrimary,
                flex: '1',
                ...(allMergeSourcesSelected ? {} : styles.btnDisabled),
              }}
              disabled={!allMergeSourcesSelected}
              onClick={onConfirmMerge}
            >
              <Plus size={18} />
              Merge {selectedCount} Document{selectedCount !== 1 ? 's' : ''}
            </button>
            <button
              style={{ ...styles.btn, ...styles.btnSecondary, flex: '1' }}
              onClick={() => navigateTo('/dashboard')}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const keyframes = `
@keyframes mdfSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.mdf-spinning { animation: mdfSpin 1s linear infinite; }
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
    background: 'rgba(14, 165, 233, 0.05)',
    border: '1px solid rgba(14, 165, 233, 0.2)',
    borderRadius: 'var(--radius-card)',
    padding: 'var(--space-5)',
  },
  summaryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    marginBottom: 'var(--space-2-5)',
    color: '#38bdf8',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
  },
  summaryText: {
    fontSize: 'var(--text-base)',
    lineHeight: '1.5',
    color: 'var(--gray-700)',
    margin: '0',
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
  mergeSelection: {
    marginTop: '20px',
  },
  mergeSourceSection: {
    marginBottom: '24px',
    padding: '16px',
    background: 'transparent',
    border: '1px solid var(--gray-200)',
    borderRadius: '14px',
  },
  mergeSourceTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--gray-900)',
    margin: '0 0 14px',
  },
  mergeSourceNumber: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(14, 165, 233, 0.2)',
    color: '#38bdf8',
    borderRadius: '50%',
    fontSize: '12px',
    fontWeight: '700',
  },
  mergeSourceLoading: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '16px',
    color: 'var(--gray-500)',
    fontSize: '13px',
  },
  mergeDocOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  mergeDocOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    background: 'var(--white)',
    border: '1px solid var(--gray-200)',
    borderRadius: '12px',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  },
  mergeDocOptionSelected: {
    background: 'rgba(14, 165, 233, 0.15)',
    borderColor: 'rgba(14, 165, 233, 0.4)',
  },
  mergeDocIcon: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(14, 165, 233, 0.15)',
    borderRadius: '10px',
    color: '#38bdf8',
    flexShrink: '0',
  },
  mergeDocInfo: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: '0',
  },
  mergeDocTitle: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--gray-900)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  mergeDocMeta: {
    fontSize: '11px',
    color: 'var(--gray-500)',
  },
  mergeDocAmount: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--data-green)',
  },
  mergeNoDocs: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '16px',
    color: 'var(--gray-500)',
    fontSize: '13px',
  },
  mergeActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
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
  btnDisabled: {
    opacity: '0.5',
    cursor: 'not-allowed',
  },
};
