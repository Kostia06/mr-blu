import { useState, useEffect, useMemo, useCallback } from 'preact/hooks';
import {
  Mail,
  MessageSquare,
  FileText,
  Receipt,
  AlertCircle,
  Loader2,
  Check,
  Pencil,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import { ReviewLoadingState } from './ReviewLoadingState';
import type { LineItem, SourceDocument, SendData } from '@/lib/review/review-types';
import { navigateTo } from '@/lib/navigation';

interface ClientInfo {
  email?: string;
  phone?: string;
}

interface SendDocumentFlowProps {
  sendData: SendData | null;
  sendDocument: SourceDocument | null;
  sendClientInfo: ClientInfo | null;
  isSendingDocument: boolean;
  sendError: string | null;
  sendSuccess: boolean;
  onExecuteSend: (email: string, phone: string) => void;
  onLoadDocumentForEditing: () => Promise<LineItem[] | void>;
  onSaveDocumentChanges: (items: LineItem[], taxRate: number) => Promise<boolean>;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
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

function formatQueryAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function SendDocumentFlow({
  sendData,
  sendDocument,
  sendClientInfo,
  isSendingDocument,
  sendError,
  sendSuccess,
  onExecuteSend,
  onLoadDocumentForEditing,
  onSaveDocumentChanges,
}: SendDocumentFlowProps) {
  const { t } = useI18nStore();

  const [editableSendEmail, setEditableSendEmail] = useState('');
  const [editableSendPhone, setEditableSendPhone] = useState('');
  const [isEditingSendDocument, setIsEditingSendDocument] = useState(false);
  const [sendDocumentItems, setSendDocumentItems] = useState<LineItem[]>([]);
  const [sendDocumentTaxRate, setSendDocumentTaxRate] = useState(0);
  const [expandedSendItemId, setExpandedSendItemId] = useState<string | null>(null);
  const [isSavingSendDocument, setIsSavingSendDocument] = useState(false);
  const [isUpdatingClientInfo, setIsUpdatingClientInfo] = useState(false);

  const sendDocumentSubtotal = useMemo(
    () => sendDocumentItems.reduce((sum, item) => sum + (item.total || 0), 0),
    [sendDocumentItems]
  );
  const sendDocumentTaxAmount = useMemo(
    () => sendDocumentSubtotal * (sendDocumentTaxRate / 100),
    [sendDocumentSubtotal, sendDocumentTaxRate]
  );
  const sendDocumentTotal = useMemo(
    () => sendDocumentSubtotal + sendDocumentTaxAmount,
    [sendDocumentSubtotal, sendDocumentTaxAmount]
  );

  useEffect(() => {
    if (sendClientInfo) {
      setEditableSendEmail(sendClientInfo.email || '');
      setEditableSendPhone(sendClientInfo.phone || '');
    }
  }, [sendClientInfo]);

  const loadSendDocumentForEditing = useCallback(async () => {
    const items = await onLoadDocumentForEditing();
    if (items) setSendDocumentItems(items);
    setIsEditingSendDocument(true);
  }, [onLoadDocumentForEditing]);

  function cancelSendDocumentEditing() {
    setIsEditingSendDocument(false);
    setSendDocumentItems([]);
    setExpandedSendItemId(null);
  }

  async function saveSendDocumentChanges() {
    setIsSavingSendDocument(true);
    const success = await onSaveDocumentChanges(sendDocumentItems, sendDocumentTaxRate);
    setIsSavingSendDocument(false);
    if (success) {
      setIsEditingSendDocument(false);
    }
  }

  function updateSendItemField(itemId: string, field: keyof LineItem, value: string | number) {
    setSendDocumentItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updated.total = (updated.quantity || 0) * (updated.rate || 0);
        }
        return updated;
      })
    );
  }

  function removeSendItem(itemId: string) {
    setSendDocumentItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  function addSendItem() {
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      description: '',
      quantity: 1,
      unit: 'ea',
      rate: 0,
      total: 0,
    };
    setSendDocumentItems((prev) => [...prev, newItem]);
    setExpandedSendItemId(newItem.id);
  }

  function handleSend() {
    onExecuteSend(editableSendEmail, editableSendPhone);
  }

  return (
    <>
      <style>{keyframes}</style>
      <div style={styles.content}>
        {/* Summary Card */}
        <div style={styles.summaryCard}>
          <div style={styles.summaryHeader}>
            <Mail size={16} style={{ flexShrink: '0' }} />
            <span>{t('review.sendingDocument')}</span>
          </div>
          <p style={styles.summaryText}>{sendData?.summary || 'Finding document to send...'}</p>
        </div>

        {/* Loading State */}
        {isSendingDocument && !sendDocument && (
          <ReviewLoadingState
            message={`Searching for ${sendData?.clientName}'s ${sendData?.documentType || 'document'}...`}
          />
        )}

        {/* Error State */}
        {sendError && (
          <div style={styles.sendErrorCard}>
            <AlertCircle size={24} style={{ color: '#f87171' }} />
            <p style={{ color: 'var(--gray-600)', fontSize: '14px', margin: '0' }}>{sendError}</p>
            <div style={styles.sendErrorActions}>
              <button
                style={{ ...styles.btn, ...styles.btnSecondary }}
                onClick={() => navigateTo('/dashboard')}
              >
                Back to Dashboard
              </button>
              <button
                style={{ ...styles.btn, ...styles.btnSecondary }}
                onClick={() => navigateTo('/dashboard/documents')}
              >
                Browse Documents
              </button>
            </div>
          </div>
        )}

        {/* Success State */}
        {sendSuccess && (
          <div style={styles.sendSuccessCard}>
            <div style={styles.sendSuccessIcon}>
              <Check size={48} strokeWidth={2} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
              {t('review.sent')}
            </h2>
            <p style={{ color: 'var(--gray-500)', fontSize: '14px', margin: '0' }}>
              {sendDocument?.title} has been sent via {sendData?.deliveryMethod}
              {sendData?.deliveryMethod === 'email'
                ? ` to ${editableSendEmail || sendClientInfo?.email}`
                : ` to ${editableSendPhone || sendClientInfo?.phone}`}
            </p>
            <div style={styles.sendSuccessActions}>
              <button
                style={{ ...styles.btn, ...styles.btnPrimary }}
                onClick={() => navigateTo('/dashboard/documents')}
              >
                {t('review.viewDocuments')}
              </button>
              <button
                style={{ ...styles.btn, ...styles.btnSecondary }}
                onClick={() => navigateTo('/dashboard/record')}
              >
                {t('review.newRecording')}
              </button>
            </div>
          </div>
        )}

        {/* Document Found - Ready to Send */}
        {!sendError && !sendSuccess && sendDocument && (
          <div style={styles.sendPreview}>
            {isEditingSendDocument ? (
              /* Editing Mode */
              <>
                <h3 style={styles.sendPreviewTitle}>{t('review.editDocument')}</h3>

                <div style={styles.sendEditCard}>
                  <div style={styles.sendDocHeader}>
                    <div
                      style={{
                        ...styles.sendDocIcon,
                        ...(sendDocument.type === 'invoice'
                          ? { background: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8' }
                          : sendDocument.type === 'estimate'
                            ? { background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }
                            : {}),
                      }}
                    >
                      {sendDocument.type === 'invoice' ? <Receipt size={24} /> : <FileText size={24} />}
                    </div>
                    <div style={styles.sendDocInfo}>
                      <span style={styles.sendDocTitle}>{sendDocument.title}</span>
                      <span style={styles.sendDocClient}>{sendDocument.client}</span>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div style={styles.sendLineItems}>
                    <div style={styles.sendItemsHeader}>
                      <span>
                        {sendDocumentItems.length !== 1
                          ? t('review.lineItemsCount').replace('{n}', String(sendDocumentItems.length))
                          : t('review.lineItemCount').replace('{n}', String(sendDocumentItems.length))}
                      </span>
                    </div>

                    {sendDocumentItems.length > 0 && (
                      <div style={styles.sendItemsList}>
                        {sendDocumentItems.map((item, index) => {
                          const isExpanded = expandedSendItemId === item.id;
                          return (
                            <div
                              key={item.id}
                              style={{
                                ...styles.sendItemCard,
                                ...(isExpanded ? styles.sendItemCardExpanded : {}),
                              }}
                            >
                              <button
                                style={styles.sendItemHeader}
                                onClick={() => setExpandedSendItemId(isExpanded ? null : item.id)}
                              >
                                <span
                                  style={{
                                    ...styles.sendItemNum,
                                    ...(isExpanded
                                      ? { background: '#0066ff', color: 'white' }
                                      : {}),
                                  }}
                                >
                                  {index + 1}
                                </span>
                                <div style={styles.sendItemSummary}>
                                  <span style={styles.sendItemDesc}>
                                    {item.description || 'Untitled item'}
                                  </span>
                                  <span style={styles.sendItemMeta}>
                                    {item.quantity} {item.unit} x {formatCurrency(item.rate)}
                                  </span>
                                </div>
                                <span style={styles.sendItemTotal}>{formatCurrency(item.total)}</span>
                                {isExpanded ? (
                                  <ChevronUp size={16} style={{ color: 'var(--gray-400)', flexShrink: '0' }} />
                                ) : (
                                  <ChevronDown size={16} style={{ color: 'var(--gray-400)', flexShrink: '0' }} />
                                )}
                              </button>

                              {isExpanded && (
                                <div style={styles.sendItemEdit}>
                                  <div style={styles.editFieldFull}>
                                    <label
                                      for={`send-item-desc-${item.id}`}
                                      style={styles.editLabel}
                                    >
                                      {t('review.description')}
                                    </label>
                                    <input
                                      id={`send-item-desc-${item.id}`}
                                      type="text"
                                      value={item.description}
                                      onInput={(e) =>
                                        updateSendItemField(item.id, 'description', (e.currentTarget as HTMLInputElement).value)
                                      }
                                      placeholder={t('placeholder.description')}
                                      style={styles.editInput}
                                    />
                                  </div>
                                  <div style={styles.editRow}>
                                    <div style={styles.editField}>
                                      <label
                                        for={`send-item-qty-${item.id}`}
                                        style={styles.editLabel}
                                      >
                                        {t('review.quantity')}
                                      </label>
                                      <input
                                        id={`send-item-qty-${item.id}`}
                                        type="number"
                                        value={item.quantity}
                                        onInput={(e) =>
                                          updateSendItemField(item.id, 'quantity', parseFloat((e.currentTarget as HTMLInputElement).value) || 0)
                                        }
                                        min="0"
                                        step="0.01"
                                        style={styles.editInput}
                                      />
                                    </div>
                                    <div style={styles.editField}>
                                      <label
                                        for={`send-item-unit-${item.id}`}
                                        style={styles.editLabel}
                                      >
                                        {t('review.unit')}
                                      </label>
                                      <input
                                        id={`send-item-unit-${item.id}`}
                                        type="text"
                                        value={item.unit}
                                        onInput={(e) =>
                                          updateSendItemField(item.id, 'unit', (e.currentTarget as HTMLInputElement).value)
                                        }
                                        placeholder={t('placeholder.unit')}
                                        style={styles.editInput}
                                      />
                                    </div>
                                    <div style={styles.editField}>
                                      <label
                                        for={`send-item-rate-${item.id}`}
                                        style={styles.editLabel}
                                      >
                                        {t('review.rate')}
                                      </label>
                                      <input
                                        id={`send-item-rate-${item.id}`}
                                        type="number"
                                        value={item.rate}
                                        onInput={(e) =>
                                          updateSendItemField(item.id, 'rate', parseFloat((e.currentTarget as HTMLInputElement).value) || 0)
                                        }
                                        min="0"
                                        step="0.01"
                                        style={styles.editInput}
                                      />
                                    </div>
                                  </div>
                                  <div style={styles.editActions}>
                                    <button
                                      style={styles.deleteItemBtn}
                                      onClick={() => removeSendItem(item.id)}
                                    >
                                      <Trash2 size={14} />
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <button style={styles.addItemBtn} onClick={addSendItem}>
                      <Plus size={16} />
                      {t('review.addLineItem')}
                    </button>
                  </div>

                  {/* Totals */}
                  <div style={styles.sendTotals}>
                    <div style={styles.sendTotalRow}>
                      <span>{t('review.subtotal')}</span>
                      <span>{formatCurrency(sendDocumentSubtotal)}</span>
                    </div>
                    <div style={{ ...styles.sendTotalRow, gap: '12px' }}>
                      <span style={{ flex: '1' }}>{t('review.tax')}</span>
                      <div style={styles.taxInputWrapper}>
                        <input
                          type="number"
                          style={styles.taxInput}
                          value={sendDocumentTaxRate}
                          onInput={(e) =>
                            setSendDocumentTaxRate(parseFloat((e.currentTarget as HTMLInputElement).value) || 0)
                          }
                          min="0"
                          max="100"
                          step="0.1"
                        />
                        <span style={{ fontSize: '14px', color: 'var(--gray-500)' }}>%</span>
                      </div>
                      <span>{formatCurrency(sendDocumentTaxAmount)}</span>
                    </div>
                    <div style={styles.sendTotalRowGrand}>
                      <span>{t('review.total')}</span>
                      <span>{formatCurrency(sendDocumentTotal)}</span>
                    </div>
                  </div>
                </div>

                <div style={styles.sendEditActions}>
                  <button
                    style={{
                      ...styles.btn,
                      ...styles.btnPrimary,
                      flex: '1',
                      ...(isSavingSendDocument ? { opacity: '0.7' } : {}),
                    }}
                    disabled={isSavingSendDocument}
                    onClick={saveSendDocumentChanges}
                  >
                    {isSavingSendDocument ? (
                      <>
                        <Loader2 size={18} class="sdf-spinning" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    style={{ ...styles.btn, ...styles.btnSecondary, flex: '1' }}
                    onClick={cancelSendDocumentEditing}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              /* Preview Mode */
              <>
                <h3 style={styles.sendPreviewTitle}>{t('review.readyToSend')}</h3>

                <div style={styles.sendDocCard}>
                  <div
                    style={{
                      ...styles.sendDocIcon,
                      ...(sendDocument.type === 'invoice'
                        ? { background: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8' }
                        : sendDocument.type === 'estimate'
                          ? { background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }
                          : {}),
                    }}
                  >
                    {sendDocument.type === 'invoice' ? <Receipt size={24} /> : <FileText size={24} />}
                  </div>
                  <div style={styles.sendDocInfo}>
                    <span style={styles.sendDocTitle}>{sendDocument.title}</span>
                    <span style={styles.sendDocClient}>{sendDocument.client}</span>
                    <span style={styles.sendDocMeta}>
                      {formatQueryDate(sendDocument.date)} &bull; {formatQueryAmount(sendDocument.amount)}
                    </span>
                  </div>
                  <button
                    style={styles.sendEditBtn}
                    onClick={loadSendDocumentForEditing}
                    title="Edit document values"
                  >
                    <Pencil size={16} />
                  </button>
                </div>

                {/* Editable Contact Info */}
                <div style={styles.sendContactForm}>
                  <div style={styles.sendMethodLabel}>
                    {sendData?.deliveryMethod === 'email' ? (
                      <>
                        <Mail size={18} />
                        <span>{t('review.sendViaEmailTo')}</span>
                      </>
                    ) : sendData?.deliveryMethod === 'sms' ? (
                      <>
                        <MessageSquare size={18} />
                        <span>{t('review.sendViaSmsTo')}</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare size={18} />
                        <span>{t('review.sendViaWhatsappTo')}</span>
                      </>
                    )}
                  </div>

                  {sendData?.deliveryMethod === 'email' ? (
                    <>
                      <input
                        type="email"
                        style={styles.sendContactInput}
                        placeholder={t('placeholder.email')}
                        value={editableSendEmail}
                        onInput={(e) => setEditableSendEmail((e.currentTarget as HTMLInputElement).value)}
                      />
                      {!editableSendEmail && !sendClientInfo?.email && (
                        <p style={styles.sendContactHint}>
                          {t('review.noEmailOnFile', { name: sendDocument.client })}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <input
                        type="tel"
                        style={styles.sendContactInput}
                        placeholder={t('placeholder.phone')}
                        value={editableSendPhone}
                        onInput={(e) => setEditableSendPhone((e.currentTarget as HTMLInputElement).value)}
                      />
                      {!editableSendPhone && !sendClientInfo?.phone && (
                        <p style={styles.sendContactHint}>
                          {t('review.noPhoneOnFile', { name: sendDocument.client })}
                        </p>
                      )}
                    </>
                  )}

                  {sendDocument.clientId &&
                    ((editableSendEmail && editableSendEmail !== sendClientInfo?.email) ||
                      (editableSendPhone && editableSendPhone !== sendClientInfo?.phone)) && (
                      <p style={styles.sendContactSaveNote}>
                        <Check size={14} />
                        {t('review.savedToProfile')}
                      </p>
                    )}
                </div>

                <div style={styles.sendActions}>
                  <button
                    style={{
                      ...styles.btn,
                      ...styles.btnPrimary,
                      flex: '1',
                      ...(isSendingDocument || isUpdatingClientInfo ? { opacity: '0.7' } : {}),
                    }}
                    disabled={isSendingDocument || isUpdatingClientInfo}
                    onClick={handleSend}
                  >
                    {isSendingDocument || isUpdatingClientInfo ? (
                      <>
                        <Loader2 size={18} class="sdf-spinning" />
                        {isUpdatingClientInfo ? t('review.updating') : t('review.sending')}
                      </>
                    ) : (
                      <>
                        <Mail size={18} />
                        {t('review.sendNow')}
                      </>
                    )}
                  </button>
                  <button
                    style={{ ...styles.btn, ...styles.btnSecondary, flex: '1' }}
                    onClick={() => navigateTo(`/dashboard/documents/${sendDocument?.id}?from=review`)}
                  >
                    {t('review.viewDocument')}
                  </button>
                  <button
                    style={{ ...styles.btn, ...styles.btnSecondary, flex: '1' }}
                    onClick={() => navigateTo('/dashboard')}
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

const keyframes = `
@keyframes sdfSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.sdf-spinning { animation: sdfSpin 1s linear infinite; }
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
    background: 'rgba(139, 92, 246, 0.08)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    borderRadius: 'var(--radius-card)',
    padding: 'var(--space-5)',
  },
  summaryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    marginBottom: 'var(--space-2-5)',
    color: '#a78bfa',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
  },
  summaryText: {
    fontSize: 'var(--text-base)',
    lineHeight: '1.5',
    color: 'var(--gray-700)',
    margin: '0',
  },
  sendErrorCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '40px 24px',
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '16px',
    textAlign: 'center',
  },
  sendErrorActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  sendSuccessCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '48px 24px',
    textAlign: 'center',
  },
  sendSuccessIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80px',
    height: '80px',
    background: 'rgba(34, 197, 94, 0.15)',
    borderRadius: '50%',
    color: '#22c55e',
  },
  sendSuccessActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  sendPreview: {
    padding: '20px 0',
  },
  sendPreviewTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--gray-500)',
    margin: '0 0 16px',
  },
  sendDocCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    background: 'transparent',
    border: '1px solid var(--gray-200)',
    borderRadius: '16px',
    marginBottom: '20px',
  },
  sendDocIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '52px',
    height: '52px',
    borderRadius: '12px',
    background: 'rgba(139, 92, 246, 0.15)',
    color: '#a78bfa',
    flexShrink: '0',
  },
  sendDocInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: '1',
    minWidth: '0',
  },
  sendDocTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--gray-900)',
  },
  sendDocClient: {
    fontSize: '14px',
    color: 'var(--gray-600)',
  },
  sendDocMeta: {
    fontSize: '13px',
    color: 'var(--gray-500)',
  },
  sendContactForm: {
    marginBottom: '24px',
  },
  sendMethodLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#a78bfa',
    fontWeight: '500',
    fontSize: '14px',
    marginBottom: '10px',
  },
  sendContactInput: {
    width: '100%',
    padding: '14px 16px',
    background: 'transparent',
    border: '1px solid var(--gray-200)',
    borderRadius: '12px',
    color: 'var(--gray-900)',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
  },
  sendContactHint: {
    marginTop: '8px',
    fontSize: '13px',
    color: 'var(--gray-500)',
  },
  sendContactSaveNote: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '10px',
    fontSize: '12px',
    color: '#22c55e',
  },
  sendEditBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    background: 'rgba(0, 102, 255, 0.1)',
    border: 'none',
    borderRadius: '10px',
    color: '#0066ff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    flexShrink: '0',
  },
  sendEditCard: {
    background: 'var(--white)',
    border: '1px solid var(--gray-200)',
    borderRadius: '16px',
    overflow: 'hidden',
    marginBottom: '20px',
  },
  sendDocHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    background: 'transparent',
    borderBottom: '1px solid var(--gray-200)',
  },
  sendLineItems: {
    padding: '16px',
  },
  sendItemsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--gray-500)',
  },
  sendItemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '12px',
  },
  sendItemCard: {
    background: 'transparent',
    border: '1px solid var(--gray-200)',
    borderRadius: '12px',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
  },
  sendItemCardExpanded: {
    borderColor: '#0066ff',
    boxShadow: '0 0 0 3px rgba(0, 102, 255, 0.1)',
  },
  sendItemHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '14px 16px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  },
  sendItemNum: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    background: 'var(--gray-200)',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--gray-500)',
    flexShrink: '0',
  },
  sendItemSummary: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: '0',
  },
  sendItemDesc: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--gray-900)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  sendItemMeta: {
    fontSize: '12px',
    color: 'var(--gray-500)',
  },
  sendItemTotal: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--gray-900)',
  },
  sendItemEdit: {
    padding: '16px',
    background: 'var(--white)',
    borderTop: '1px solid var(--gray-200)',
  },
  editField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  editFieldFull: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '12px',
  },
  editLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--gray-500)',
  },
  editInput: {
    width: '100%',
    padding: '10px 12px',
    background: 'var(--gray-50)',
    border: '1px solid var(--gray-200)',
    borderRadius: '8px',
    fontSize: '14px',
    color: 'var(--gray-900)',
    boxSizing: 'border-box',
  },
  editRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '10px',
    marginBottom: '12px',
  },
  editActions: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  deleteItemBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    background: 'transparent',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
    color: '#f87171',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  addItemBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '12px',
    background: 'transparent',
    border: '1px dashed var(--gray-300)',
    borderRadius: '10px',
    color: 'var(--gray-500)',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  sendTotals: {
    padding: '16px',
    borderTop: '1px solid var(--gray-200)',
    background: 'var(--gray-50)',
  },
  sendTotalRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '14px',
    color: 'var(--gray-500)',
  },
  sendTotalRowGrand: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '12px',
    marginTop: '8px',
    borderTop: '1px solid var(--gray-200)',
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--gray-900)',
  },
  taxInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  taxInput: {
    width: '60px',
    padding: '6px 8px',
    background: 'var(--white)',
    border: '1px solid var(--gray-200)',
    borderRadius: '6px',
    fontSize: '14px',
    color: 'var(--gray-900)',
    textAlign: 'right',
  },
  sendEditActions: {
    display: 'flex',
    gap: '12px',
  },
  sendActions: {
    display: 'flex',
    gap: '12px',
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
