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
import { cn } from '@/lib/utils';
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
      <style>{`@keyframes sdfSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .sdf-spinning { animation: sdfSpin 1s linear infinite; }`}</style>
      <div class="flex-1 px-[var(--page-padding-x)] max-w-[var(--page-max-width)] mx-auto w-full flex flex-col gap-[var(--section-gap)]">
        {/* Summary Card */}
        <div class="bg-violet-500/[0.08] border border-violet-500/30 rounded-[var(--radius-card)] p-[var(--space-5)]">
          <div class="flex items-center gap-[var(--space-2)] mb-[var(--space-2-5)] text-violet-400 text-[var(--text-sm)] font-[var(--font-medium)]">
            <Mail size={16} class="shrink-0" />
            <span>{t('review.sendingDocument')}</span>
          </div>
          <p class="text-[var(--text-base)] leading-relaxed text-[var(--gray-700)] m-0">
            {sendData?.summary || 'Finding document to send...'}
          </p>
        </div>

        {/* Loading State */}
        {isSendingDocument && !sendDocument && (
          <ReviewLoadingState
            message={`Searching for ${sendData?.clientName}'s ${sendData?.documentType || 'document'}...`}
          />
        )}

        {/* Error State */}
        {sendError && (
          <div class="flex flex-col items-center gap-3 py-10 px-6 bg-red-500/[0.08] border border-red-500/20 rounded-2xl text-center">
            <AlertCircle size={24} class="text-red-400" />
            <p class="text-[var(--gray-600)] text-sm m-0">{sendError}</p>
            <div class="flex gap-3 mt-2">
              <button
                class="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 bg-[var(--gray-100)] text-[var(--gray-600)] border border-[var(--gray-200)]"
                onClick={() => navigateTo('/dashboard')}
              >
                Back to Dashboard
              </button>
              <button
                class="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 bg-[var(--gray-100)] text-[var(--gray-600)] border border-[var(--gray-200)]"
                onClick={() => navigateTo('/dashboard/documents')}
              >
                Browse Documents
              </button>
            </div>
          </div>
        )}

        {/* Success State */}
        {sendSuccess && (
          <div class="flex flex-col items-center gap-4 py-12 px-6 text-center">
            <div class="flex items-center justify-center w-20 h-20 bg-green-500/15 rounded-full text-green-500">
              <Check size={48} strokeWidth={2} />
            </div>
            <h2 class="text-2xl font-semibold text-[var(--gray-900)] m-0">
              {t('review.sent')}
            </h2>
            <p class="text-[var(--gray-500)] text-sm m-0">
              {sendDocument?.title} has been sent via {sendData?.deliveryMethod}
              {sendData?.deliveryMethod === 'email'
                ? ` to ${editableSendEmail || sendClientInfo?.email}`
                : ` to ${editableSendPhone || sendClientInfo?.phone}`}
            </p>
            <div class="flex gap-3 mt-2">
              <button
                class="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 border-none bg-gradient-to-br from-[#0066ff] to-[#0052cc] text-white shadow-[0_4px_12px_rgba(0,102,255,0.25)]"
                onClick={() => navigateTo('/dashboard/documents')}
              >
                {t('review.viewDocuments')}
              </button>
              <button
                class="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 bg-[var(--gray-100)] text-[var(--gray-600)] border border-[var(--gray-200)]"
                onClick={() => navigateTo('/dashboard/record')}
              >
                {t('review.newRecording')}
              </button>
            </div>
          </div>
        )}

        {/* Document Found - Ready to Send */}
        {!sendError && !sendSuccess && sendDocument && (
          <div class="py-5">
            {isEditingSendDocument ? (
              /* Editing Mode */
              <>
                <h3 class="text-sm font-medium text-[var(--gray-500)] m-0 mb-4">
                  {t('review.editDocument')}
                </h3>

                <div class="bg-[var(--white)] border border-[var(--gray-200)] rounded-2xl overflow-hidden mb-5">
                  <div class="flex items-center gap-4 p-5 border-b border-[var(--gray-200)]">
                    <div
                      class={cn(
                        'flex items-center justify-center w-[52px] h-[52px] rounded-xl shrink-0',
                        sendDocument.type === 'invoice'
                          ? 'bg-sky-500/15 text-sky-400'
                          : sendDocument.type === 'estimate'
                            ? 'bg-green-500/15 text-green-500'
                            : 'bg-violet-500/15 text-violet-400'
                      )}
                    >
                      {sendDocument.type === 'invoice' ? <Receipt size={24} /> : <FileText size={24} />}
                    </div>
                    <div class="flex flex-col gap-1 flex-1 min-w-0">
                      <span class="text-base font-semibold text-[var(--gray-900)]">{sendDocument.title}</span>
                      <span class="text-sm text-[var(--gray-600)]">{sendDocument.client}</span>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div class="p-4">
                    <div class="flex items-center justify-between mb-3 text-[13px] font-medium text-[var(--gray-500)]">
                      <span>
                        {sendDocumentItems.length !== 1
                          ? t('review.lineItemsCount').replace('{n}', String(sendDocumentItems.length))
                          : t('review.lineItemCount').replace('{n}', String(sendDocumentItems.length))}
                      </span>
                    </div>

                    {sendDocumentItems.length > 0 && (
                      <div class="flex flex-col gap-2 mb-3">
                        {sendDocumentItems.map((item, index) => {
                          const isExpanded = expandedSendItemId === item.id;
                          return (
                            <div
                              key={item.id}
                              class={cn(
                                'border border-[var(--gray-200)] rounded-xl overflow-hidden transition-all duration-200',
                                isExpanded && 'border-[#0066ff] shadow-[0_0_0_3px_rgba(0,102,255,0.1)]'
                              )}
                            >
                              <button
                                class="flex items-center gap-3 w-full px-4 py-3.5 bg-transparent border-none cursor-pointer text-left"
                                onClick={() => setExpandedSendItemId(isExpanded ? null : item.id)}
                              >
                                <span
                                  class={cn(
                                    'flex items-center justify-center w-6 h-6 bg-[var(--gray-200)] rounded-md text-xs font-semibold text-[var(--gray-500)] shrink-0',
                                    isExpanded && 'bg-[#0066ff] text-white'
                                  )}
                                >
                                  {index + 1}
                                </span>
                                <div class="flex-1 flex flex-col gap-0.5 min-w-0">
                                  <span class="text-sm font-medium text-[var(--gray-900)] whitespace-nowrap overflow-hidden text-ellipsis">
                                    {item.description || 'Untitled item'}
                                  </span>
                                  <span class="text-xs text-[var(--gray-500)]">
                                    {item.quantity} {item.unit} x {formatCurrency(item.rate)}
                                  </span>
                                </div>
                                <span class="text-sm font-semibold text-[var(--gray-900)]">
                                  {formatCurrency(item.total)}
                                </span>
                                {isExpanded ? (
                                  <ChevronUp size={16} class="text-[var(--gray-400)] shrink-0" />
                                ) : (
                                  <ChevronDown size={16} class="text-[var(--gray-400)] shrink-0" />
                                )}
                              </button>

                              {isExpanded && (
                                <div class="p-4 bg-[var(--white)] border-t border-[var(--gray-200)]">
                                  <div class="flex flex-col gap-1.5 mb-3">
                                    <label
                                      for={`send-item-desc-${item.id}`}
                                      class="text-xs font-medium text-[var(--gray-500)]"
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
                                      class="w-full px-3 py-2.5 bg-[var(--gray-50)] border border-[var(--gray-200)] rounded-lg text-sm text-[var(--gray-900)] box-border"
                                    />
                                  </div>
                                  <div class="grid grid-cols-3 gap-2.5 mb-3">
                                    <div class="flex flex-col gap-1.5">
                                      <label
                                        for={`send-item-qty-${item.id}`}
                                        class="text-xs font-medium text-[var(--gray-500)]"
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
                                        class="w-full px-3 py-2.5 bg-[var(--gray-50)] border border-[var(--gray-200)] rounded-lg text-sm text-[var(--gray-900)] box-border"
                                      />
                                    </div>
                                    <div class="flex flex-col gap-1.5">
                                      <label
                                        for={`send-item-unit-${item.id}`}
                                        class="text-xs font-medium text-[var(--gray-500)]"
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
                                        class="w-full px-3 py-2.5 bg-[var(--gray-50)] border border-[var(--gray-200)] rounded-lg text-sm text-[var(--gray-900)] box-border"
                                      />
                                    </div>
                                    <div class="flex flex-col gap-1.5">
                                      <label
                                        for={`send-item-rate-${item.id}`}
                                        class="text-xs font-medium text-[var(--gray-500)]"
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
                                        class="w-full px-3 py-2.5 bg-[var(--gray-50)] border border-[var(--gray-200)] rounded-lg text-sm text-[var(--gray-900)] box-border"
                                      />
                                    </div>
                                  </div>
                                  <div class="flex justify-end">
                                    <button
                                      class="flex items-center gap-1.5 px-3 py-2 bg-transparent border border-red-500/20 rounded-lg text-red-400 text-[13px] cursor-pointer transition-all duration-200 hover:bg-red-500/[0.08]"
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

                    <button
                      class="flex items-center justify-center gap-2 w-full p-3 bg-transparent border border-dashed border-[var(--gray-300)] rounded-[10px] text-[var(--gray-500)] text-sm cursor-pointer transition-all duration-200 hover:bg-[var(--gray-50)] hover:text-[var(--gray-700)]"
                      onClick={addSendItem}
                    >
                      <Plus size={16} />
                      {t('review.addLineItem')}
                    </button>
                  </div>

                  {/* Totals */}
                  <div class="p-4 border-t border-[var(--gray-200)] bg-[var(--gray-50)]">
                    <div class="flex items-center justify-between py-2 text-sm text-[var(--gray-500)]">
                      <span>{t('review.subtotal')}</span>
                      <span>{formatCurrency(sendDocumentSubtotal)}</span>
                    </div>
                    <div class="flex items-center justify-between py-2 text-sm text-[var(--gray-500)] gap-3">
                      <span class="flex-1">{t('review.tax')}</span>
                      <div class="flex items-center gap-1">
                        <input
                          type="number"
                          class="w-[60px] px-2 py-1.5 bg-[var(--white)] border border-[var(--gray-200)] rounded-md text-sm text-[var(--gray-900)] text-right"
                          value={sendDocumentTaxRate}
                          onInput={(e) =>
                            setSendDocumentTaxRate(parseFloat((e.currentTarget as HTMLInputElement).value) || 0)
                          }
                          min="0"
                          max="100"
                          step="0.1"
                        />
                        <span class="text-sm text-[var(--gray-500)]">%</span>
                      </div>
                      <span>{formatCurrency(sendDocumentTaxAmount)}</span>
                    </div>
                    <div class="flex items-center justify-between pt-3 mt-2 border-t border-[var(--gray-200)] text-base font-semibold text-[var(--gray-900)]">
                      <span>{t('review.total')}</span>
                      <span>{formatCurrency(sendDocumentTotal)}</span>
                    </div>
                  </div>
                </div>

                <div class="flex gap-3">
                  <button
                    class={cn(
                      'flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 border-none bg-gradient-to-br from-[#0066ff] to-[#0052cc] text-white shadow-[0_4px_12px_rgba(0,102,255,0.25)]',
                      isSavingSendDocument && 'opacity-70'
                    )}
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
                    class="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 bg-[var(--gray-100)] text-[var(--gray-600)] border border-[var(--gray-200)]"
                    onClick={cancelSendDocumentEditing}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              /* Preview Mode */
              <>
                <h3 class="text-sm font-medium text-[var(--gray-500)] m-0 mb-4">
                  {t('review.readyToSend')}
                </h3>

                <div class="flex items-center gap-4 p-5 border border-[var(--gray-200)] rounded-2xl mb-5">
                  <div
                    class={cn(
                      'flex items-center justify-center w-[52px] h-[52px] rounded-xl shrink-0',
                      sendDocument.type === 'invoice'
                        ? 'bg-sky-500/15 text-sky-400'
                        : sendDocument.type === 'estimate'
                          ? 'bg-green-500/15 text-green-500'
                          : 'bg-violet-500/15 text-violet-400'
                    )}
                  >
                    {sendDocument.type === 'invoice' ? <Receipt size={24} /> : <FileText size={24} />}
                  </div>
                  <div class="flex flex-col gap-1 flex-1 min-w-0">
                    <span class="text-base font-semibold text-[var(--gray-900)]">{sendDocument.title}</span>
                    <span class="text-sm text-[var(--gray-600)]">{sendDocument.client}</span>
                    <span class="text-[13px] text-[var(--gray-500)]">
                      {formatQueryDate(sendDocument.date)} &bull; {formatQueryAmount(sendDocument.amount)}
                    </span>
                  </div>
                  <button
                    class="flex items-center justify-center w-10 h-10 bg-[rgba(0,102,255,0.1)] border-none rounded-[10px] text-[#0066ff] cursor-pointer transition-all duration-200 shrink-0 hover:bg-[rgba(0,102,255,0.2)]"
                    onClick={loadSendDocumentForEditing}
                    title="Edit document values"
                  >
                    <Pencil size={16} />
                  </button>
                </div>

                {/* Editable Contact Info */}
                <div class="mb-6">
                  <div class="flex items-center gap-2 text-violet-400 font-medium text-sm mb-2.5">
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
                        class="w-full px-4 py-3.5 bg-transparent border border-[var(--gray-200)] rounded-xl text-[var(--gray-900)] text-[15px] outline-none transition-all duration-200 box-border focus:border-[var(--blu-primary,#0066ff)] focus:shadow-[0_0_0_3px_rgba(0,102,255,0.1)]"
                        placeholder={t('placeholder.email')}
                        value={editableSendEmail}
                        onInput={(e) => setEditableSendEmail((e.currentTarget as HTMLInputElement).value)}
                      />
                      {!editableSendEmail && !sendClientInfo?.email && (
                        <p class="mt-2 text-[13px] text-[var(--gray-500)]">
                          {t('review.noEmailOnFile', { name: sendDocument.client })}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <input
                        type="tel"
                        class="w-full px-4 py-3.5 bg-transparent border border-[var(--gray-200)] rounded-xl text-[var(--gray-900)] text-[15px] outline-none transition-all duration-200 box-border focus:border-[var(--blu-primary,#0066ff)] focus:shadow-[0_0_0_3px_rgba(0,102,255,0.1)]"
                        placeholder={t('placeholder.phone')}
                        value={editableSendPhone}
                        onInput={(e) => setEditableSendPhone((e.currentTarget as HTMLInputElement).value)}
                      />
                      {!editableSendPhone && !sendClientInfo?.phone && (
                        <p class="mt-2 text-[13px] text-[var(--gray-500)]">
                          {t('review.noPhoneOnFile', { name: sendDocument.client })}
                        </p>
                      )}
                    </>
                  )}

                  {sendDocument.clientId &&
                    ((editableSendEmail && editableSendEmail !== sendClientInfo?.email) ||
                      (editableSendPhone && editableSendPhone !== sendClientInfo?.phone)) && (
                      <p class="flex items-center gap-1.5 mt-2.5 text-xs text-green-500">
                        <Check size={14} />
                        {t('review.savedToProfile')}
                      </p>
                    )}
                </div>

                <div class="flex gap-3">
                  <button
                    class={cn(
                      'flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 border-none bg-gradient-to-br from-[#0066ff] to-[#0052cc] text-white shadow-[0_4px_12px_rgba(0,102,255,0.25)]',
                      (isSendingDocument || isUpdatingClientInfo) && 'opacity-70'
                    )}
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
                    class="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 bg-[var(--gray-100)] text-[var(--gray-600)] border border-[var(--gray-200)]"
                    onClick={() => navigateTo(`/dashboard/documents/${sendDocument?.id}?from=review`)}
                  >
                    {t('review.viewDocument')}
                  </button>
                  <button
                    class="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 bg-[var(--gray-100)] text-[var(--gray-600)] border border-[var(--gray-200)]"
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
