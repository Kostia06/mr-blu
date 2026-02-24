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
      <style>{keyframes}</style>
      <div style={styles.transformReview}>
        {/* Source Document Card */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>{t('review.sourceDocument')}</h2>
          <div style={styles.sourceCard}>
            <div style={styles.sourceIcon}>
              {sourceDocument.type === 'invoice' ? (
                <FileText size={24} strokeWidth={1.5} />
              ) : (
                <ClipboardList size={24} strokeWidth={1.5} />
              )}
            </div>
            <div style={styles.sourceInfo}>
              <p style={styles.sourceType}>
                {sourceDocument.type === 'invoice' ? t('review.invoice') : t('review.estimate')} #{sourceDocument.number}
              </p>
              <p style={styles.sourceClient}>{sourceDocument.clientName}</p>
            </div>
            <div style={styles.sourceTotal}>{formatCurrency(sourceDocument.total)}</div>
          </div>
        </section>

        {/* Conversion Section */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionHeaderLeft}>
              <div style={styles.sectionIcon}>
                <ArrowLeftRight size={18} />
              </div>
              <h2 style={styles.sectionTitleInline}>{t('review.convertType')}</h2>
            </div>
          </div>

          <div style={styles.conversionContent}>
            <div style={styles.typeToggle}>
              <button
                style={{
                  ...styles.typeBtn,
                  ...(targetType === 'estimate' ? styles.typeBtnActive : {}),
                  ...(sourceDocument.type === 'estimate' && targetType === 'estimate' ? styles.typeBtnSourceActive : {}),
                }}
                onClick={() => setTargetType('estimate')}
                type="button"
              >
                <ClipboardList size={18} />
                {t('review.estimate')}
                {sourceDocument.type === 'estimate' && (
                  <span style={styles.currentBadge}>{t('review.current')}</span>
                )}
              </button>
              <div style={styles.toggleArrow}>
                <ArrowRight size={16} />
              </div>
              <button
                style={{
                  ...styles.typeBtn,
                  ...(targetType === 'invoice' ? styles.typeBtnActive : {}),
                  ...(sourceDocument.type === 'invoice' && targetType === 'invoice' ? styles.typeBtnSourceActive : {}),
                }}
                onClick={() => setTargetType('invoice')}
                type="button"
              >
                <FileText size={18} />
                {t('review.invoice')}
                {sourceDocument.type === 'invoice' && (
                  <span style={styles.currentBadge}>{t('review.current')}</span>
                )}
              </button>
            </div>
            <p style={styles.conversionNote}>
              {sourceDocument.type === targetType
                ? t('review.selectDifferentType')
                : t('review.convertFromTo', { from: sourceDocument.type, to: targetType })}
            </p>
          </div>
        </section>

        {/* Preview Section */}
        <section style={{ ...styles.section, background: 'rgba(255, 255, 255, 0.7)' }}>
          <h2 style={styles.sectionTitle}>{t('recording.preview')}</h2>
          <p style={styles.summaryTextBox}>{summaryText}</p>

          <div style={styles.previewCard}>
            <div style={styles.previewIcon}>
              {effectiveType === 'invoice' ? (
                <FileText size={18} strokeWidth={1.5} />
              ) : (
                <ClipboardList size={18} strokeWidth={1.5} />
              )}
            </div>
            <div style={styles.previewInfo}>
              <p style={styles.previewLabel}>
                {effectiveType === 'invoice' ? t('review.invoice') : t('review.estimate')}
              </p>
              <p style={styles.previewStatus}>
                {t('review.forClient', { client: sourceDocument.clientName })}
              </p>
            </div>
            <div style={styles.previewAmount}>{formatCurrency(sourceDocument.total)}</div>
          </div>
        </section>

        {/* Action Buttons */}
        <div style={styles.actions}>
          <button
            style={{
              ...styles.backBtn,
              ...(isProcessing ? { opacity: '0.5', cursor: 'not-allowed' } : {}),
            }}
            onClick={onBack}
            type="button"
            disabled={isProcessing}
          >
            <ArrowLeft size={18} />
            {t('review.back')}
          </button>

          <button
            style={{
              ...styles.executeBtn,
              ...(!isValid || isProcessing ? styles.executeBtnDisabled : {}),
            }}
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

const keyframes = `
@keyframes trSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.tr-spinning { animation: trSpin 1s linear infinite; }
@media (prefers-reduced-motion: reduce) {
  .tr-spinning { animation: none; }
}
`;

const styles: Record<string, Record<string, string>> = {
  transformReview: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    paddingBottom: '100px',
  },
  section: {
    background: 'rgba(255, 255, 255, 0.5)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '16px',
    padding: '20px',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--gray-500, #64748b)',
    margin: '0 0 16px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  sectionIcon: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 102, 255, 0.1)',
    color: 'var(--blu-primary, #0066ff)',
    borderRadius: '10px',
  },
  sectionTitleInline: {
    fontSize: '15px',
    fontWeight: '600',
    color: 'var(--gray-900, #0f172a)',
    margin: '0',
  },
  sourceCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.6)',
    borderRadius: '12px',
  },
  sourceIcon: {
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 102, 255, 0.1)',
    color: 'var(--blu-primary, #0066ff)',
    borderRadius: '12px',
    flexShrink: '0',
  },
  sourceInfo: {
    flex: '1',
    minWidth: '0',
  },
  sourceType: {
    fontSize: '15px',
    fontWeight: '600',
    color: 'var(--gray-900, #0f172a)',
    margin: '0 0 2px',
  },
  sourceClient: {
    fontSize: '13px',
    color: 'var(--gray-500, #64748b)',
    margin: '0',
  },
  sourceTotal: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--gray-900, #0f172a)',
    flexShrink: '0',
  },
  conversionContent: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(0, 0, 0, 0.06)',
  },
  typeToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  typeBtn: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '18px 14px',
    background: 'rgba(255, 255, 255, 0.6)',
    border: '2px solid transparent',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--gray-600, #475569)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    minHeight: '80px',
    position: 'relative',
  },
  typeBtnActive: {
    borderColor: 'var(--blu-primary, #0066ff)',
    background: 'rgba(0, 102, 255, 0.08)',
    color: 'var(--blu-primary, #0066ff)',
  },
  typeBtnSourceActive: {
    borderColor: 'var(--gray-300, #d1d5db)',
    background: 'rgba(0, 0, 0, 0.03)',
    color: 'var(--gray-500, #64748b)',
  },
  currentBadge: {
    fontSize: '10px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--gray-400, #94a3b8)',
    padding: '2px 6px',
    background: 'rgba(0, 0, 0, 0.05)',
    borderRadius: '4px',
  },
  toggleArrow: {
    color: 'var(--gray-400, #94a3b8)',
    flexShrink: '0',
  },
  conversionNote: {
    fontSize: '13px',
    color: 'var(--gray-500, #64748b)',
    textAlign: 'center',
    margin: '16px 0 0',
  },
  summaryTextBox: {
    fontSize: '14px',
    color: 'var(--gray-600, #475569)',
    margin: '0 0 16px',
    padding: '12px 14px',
    background: 'rgba(0, 102, 255, 0.05)',
    borderRadius: '10px',
  },
  previewCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px',
    background: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '12px',
  },
  previewIcon: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 102, 255, 0.1)',
    color: 'var(--blu-primary, #0066ff)',
    borderRadius: '10px',
    flexShrink: '0',
  },
  previewInfo: {
    flex: '1',
    minWidth: '0',
  },
  previewLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--gray-900, #0f172a)',
    margin: '0 0 2px',
  },
  previewStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: 'var(--gray-500, #64748b)',
    margin: '0',
  },
  previewAmount: {
    fontSize: '15px',
    fontWeight: '700',
    color: 'var(--gray-900, #0f172a)',
    flexShrink: '0',
  },
  actions: {
    position: 'fixed',
    bottom: '0',
    left: '0',
    right: '0',
    display: 'flex',
    gap: '12px',
    padding: '16px 20px',
    paddingBottom: 'calc(16px + var(--safe-area-bottom, 0px))',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderTop: '1px solid rgba(0, 0, 0, 0.06)',
    zIndex: '100',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '16px 24px',
    background: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '14px',
    fontSize: '15px',
    fontWeight: '600',
    color: 'var(--gray-700, #334155)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    minHeight: '56px',
  },
  executeBtn: {
    flex: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '16px 24px',
    background: 'var(--blu-primary, #0066ff)',
    color: 'white',
    border: 'none',
    borderRadius: '14px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minHeight: '56px',
  },
  executeBtnDisabled: {
    background: 'var(--gray-300, #d1d5db)',
    color: 'var(--gray-500, #64748b)',
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
};
