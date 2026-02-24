import { useState, useEffect, useRef } from 'preact/hooks';
import { cn } from '@/lib/utils';
import type { LucideIcon } from '@/lib/types/lucide';
import { useI18nStore } from '@/lib/i18n';
import {
  FileText,
  Receipt,
  Mail,
  Check,
  Play,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Pencil,
  Plus,
  X,
  Download,
  Database,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { ReviewModal } from '@/components/review/ReviewModal';
import { navigateTo } from '@/lib/navigation';

interface ActionStep {
  id: string;
  type: 'create_document' | 'send_email';
  order: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  details: {
    recipient?: string;
    frequency?: string;
    message?: string;
  };
  error?: string;
}

interface ParsedData {
  documentType: 'invoice' | 'estimate';
  client: {
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  actions: ActionStep[];
  [key: string]: unknown;
}

interface ActionConfig {
  icon: LucideIcon;
  labelKey: string;
  color: string;
}

interface ReviewActionsProps {
  data: ParsedData;
  onDataChange: (data: ParsedData) => void;
  actions: ActionStep[];
  onActionsChange: (actions: ActionStep[]) => void;
  actionConfig: Record<string, ActionConfig>;
  isExecuting: boolean;
  hasValidationErrors: boolean;
  calculatedTotal: number;
  formatCurrency: (amount: number) => string;
  showProfileWarning: boolean;
  onShowProfileWarningChange: (show: boolean) => void;
  profileMissingFields: string[];
  copyLinkStatus: 'idle' | 'loading' | 'copied' | 'error';
  sortedActions: ActionStep[];
  onExecuteAction: (action: ActionStep) => void;
  onAddAction: (type: ActionStep['type']) => void;
  onHandleDownloadPDF: () => Promise<void>;
  onSaveDocument: (actionId: string) => Promise<void>;
  onOpenViewLinkModal: () => void;
  onGetActionDescription: (action: ActionStep) => string;
  onActionHasEditableData: (action: ActionStep) => boolean;
  onUpdateActionRecipient: (action: ActionStep, value: string) => void;
  onUpdateActionFrequency: (action: ActionStep, frequency: string) => void;
  onRetryAction: (action: ActionStep) => void;
  onDismissProfileWarning?: () => void;
  reviewSessionId?: string | null;
  onSaveSession?: () => Promise<void>;
}

const DEFAULT_CONFIG: ActionConfig = {
  icon: FileText,
  labelKey: 'review.createDocument',
  color: '#94a3b8',
};

export function ReviewActions({
  data,
  onDataChange,
  actions,
  onActionsChange,
  actionConfig,
  isExecuting,
  hasValidationErrors,
  calculatedTotal,
  formatCurrency,
  showProfileWarning,
  onShowProfileWarningChange,
  profileMissingFields,
  copyLinkStatus,
  sortedActions,
  onExecuteAction,
  onAddAction,
  onHandleDownloadPDF,
  onSaveDocument,
  onOpenViewLinkModal,
  onGetActionDescription,
  onActionHasEditableData,
  onUpdateActionRecipient,
  onUpdateActionFrequency,
  onRetryAction,
  onDismissProfileWarning,
  reviewSessionId,
  onSaveSession,
}: ReviewActionsProps) {
  const { t } = useI18nStore();

  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [showActionTypePicker, setShowActionTypePicker] = useState(false);
  const warningRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showProfileWarning && warningRef.current) {
      warningRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showProfileWarning]);

  function toggleActionEdit(actionId: string) {
    setEditingActionId(editingActionId === actionId ? null : actionId);
  }

  function handleSendAnywayClick() {
    onShowProfileWarningChange(false);
    onDismissProfileWarning?.();
    const sendAction = data.actions.find(
      (a) => a.type === 'send_email' && a.status === 'pending'
    );
    if (sendAction) onExecuteAction(sendAction);
  }

  async function handleGoToProfileClick() {
    await onSaveSession?.();
    navigateTo(`/dashboard/settings/business?from=review${reviewSessionId ? `&session=${reviewSessionId}` : ''}`);
  }

  function handleDocumentTypeChange(docType: 'invoice' | 'estimate') {
    onDataChange({ ...data, documentType: docType });
  }

  function handleClientFieldChange(field: string, value: string) {
    onDataChange({
      ...data,
      client: { ...data.client, [field]: value },
    });
  }

  function handleActionMessageChange(actionId: string, message: string) {
    const updatedActions = data.actions.map((a) =>
      a.id === actionId ? { ...a, details: { ...a.details, message } } : a
    );
    onDataChange({ ...data, actions: updatedActions });
  }

  function renderActionIcon(action: ActionStep, config: ActionConfig) {
    if (action.status === 'in_progress') {
      return <Loader2 size={20} class="animate-spin" />;
    }
    if (action.status === 'completed') {
      return <Check size={20} />;
    }
    if (action.status === 'failed') {
      return <AlertCircle size={20} />;
    }
    const IconComponent = config.icon;
    return <IconComponent size={20} />;
  }

  function renderActionButtons(action: ActionStep, isEditing: boolean) {
    return (
      <div class="flex items-center gap-2">
        {onActionHasEditableData(action) && action.status === 'pending' && !isExecuting && (
          <button
            class={cn(
              'w-10 h-10 flex items-center justify-center bg-[var(--gray-200)] border-none rounded-lg text-[var(--gray-500)] cursor-pointer transition-all duration-200 hover:bg-[var(--gray-300)] hover:text-[var(--gray-900)]',
              isEditing && 'bg-sky-500/20 text-sky-400'
            )}
            onClick={() => toggleActionEdit(action.id)}
            aria-label="Edit action"
          >
            <Pencil size={14} />
          </button>
        )}

        {action.status === 'pending' && !isExecuting && (
          <button
            class="w-10 h-10 flex items-center justify-center bg-sky-500/15 rounded-[10px] text-sky-500 border-none cursor-pointer transition-all duration-200 hover:bg-sky-500/25 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() => onExecuteAction(action)}
            disabled={hasValidationErrors}
            aria-label="Execute action"
          >
            <Play size={16} />
          </button>
        )}

        {action.status === 'failed' && !isExecuting && (
          <>
            <button
              class={cn(
                'w-10 h-10 flex items-center justify-center bg-[var(--gray-200)] border-none rounded-lg text-[var(--gray-500)] cursor-pointer transition-all duration-200 hover:bg-[var(--gray-300)] hover:text-[var(--gray-900)]',
                isEditing && 'bg-sky-500/20 text-sky-400'
              )}
              onClick={() => toggleActionEdit(action.id)}
              aria-label="Edit and retry action"
            >
              <Pencil size={14} />
            </button>
            <button
              class="w-10 h-10 flex items-center justify-center bg-red-500/15 border-none rounded-[10px] text-red-500 cursor-pointer transition-all duration-200 hover:bg-red-500/25 hover:scale-105"
              onClick={() => onRetryAction(action)}
              aria-label="Retry action"
            >
              <RotateCcw size={16} />
            </button>
          </>
        )}

        {action.status === 'completed' && (
          <div class="w-10 h-10 flex items-center justify-center bg-emerald-500/15 rounded-[10px] text-emerald-400">
            <Check size={16} />
          </div>
        )}
      </div>
    );
  }

  function renderEditForm(action: ActionStep) {
    if (action.type === 'create_document') {
      return (
        <>
          <div class="mt-3">
            <span class="block text-[11px] font-medium text-[var(--gray-500)] uppercase tracking-wide mb-1.5">
              {t('review.documentType')}
            </span>
            <div class="flex gap-2">
              <button
                class={cn(
                  'flex-1 flex items-center justify-center gap-2 p-3 bg-transparent border border-[var(--gray-200)] rounded-[10px] text-[var(--gray-500)] text-[13px] font-medium cursor-pointer transition-all duration-200 hover:bg-[var(--gray-100)] hover:text-[var(--gray-900)]',
                  data.documentType === 'invoice' && 'bg-sky-500/15 border-sky-500/30 text-sky-400'
                )}
                onClick={() => handleDocumentTypeChange('invoice')}
              >
                <Receipt size={16} />
                Invoice
              </button>
              <button
                class={cn(
                  'flex-1 flex items-center justify-center gap-2 p-3 bg-transparent border border-[var(--gray-200)] rounded-[10px] text-[var(--gray-500)] text-[13px] font-medium cursor-pointer transition-all duration-200 hover:bg-[var(--gray-100)] hover:text-[var(--gray-900)]',
                  data.documentType === 'estimate' && 'bg-sky-500/15 border-sky-500/30 text-sky-400'
                )}
                onClick={() => handleDocumentTypeChange('estimate')}
              >
                <FileText size={16} />
                Estimate
              </button>
            </div>
          </div>

          <div class="flex gap-3 mt-3">
            <div class="flex-1 mt-0">
              <label for={`action-client-firstname-${action.id}`} class="block text-[11px] font-medium text-[var(--gray-500)] uppercase tracking-wide mb-1.5">
                {t('profile.firstName')}
              </label>
              <input
                id={`action-client-firstname-${action.id}`}
                type="text"
                value={data.client.firstName || ''}
                onInput={(e) =>
                  handleClientFieldChange('firstName', (e.target as HTMLInputElement).value)
                }
                placeholder={t('placeholder.firstName')}
                class="w-full px-3 py-2.5 bg-[var(--white)] border border-[var(--gray-200)] rounded-[10px] text-[var(--gray-900)] text-sm font-inherit transition-all duration-200 focus:outline-none focus:border-[var(--blu-primary,#0066ff)] focus:shadow-[0_0_0_3px_rgba(0,102,255,0.08)]"
              />
            </div>
            <div class="flex-1 mt-0">
              <label for={`action-client-lastname-${action.id}`} class="block text-[11px] font-medium text-[var(--gray-500)] uppercase tracking-wide mb-1.5">
                {t('profile.lastName')}
              </label>
              <input
                id={`action-client-lastname-${action.id}`}
                type="text"
                value={data.client.lastName || ''}
                onInput={(e) =>
                  handleClientFieldChange('lastName', (e.target as HTMLInputElement).value)
                }
                placeholder={t('placeholder.lastName')}
                class="w-full px-3 py-2.5 bg-[var(--white)] border border-[var(--gray-200)] rounded-[10px] text-[var(--gray-900)] text-sm font-inherit transition-all duration-200 focus:outline-none focus:border-[var(--blu-primary,#0066ff)] focus:shadow-[0_0_0_3px_rgba(0,102,255,0.08)]"
              />
            </div>
          </div>

          <div class="mt-3">
            <span class="block text-[11px] font-medium text-[var(--gray-500)] uppercase tracking-wide mb-1.5">
              {t('review.totalAmountLabel')}
            </span>
            <div class="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-lg font-bold text-center">
              {formatCurrency(calculatedTotal)}
            </div>
            <span class="block mt-1.5 text-[11px] text-[var(--gray-500)]">
              {t('review.totalAmountHint')}
            </span>
          </div>

          <div class="mt-3">
            <span class="block text-[11px] font-medium text-[var(--gray-500)] uppercase tracking-wide mb-1.5">
              {t('review.saveShareOptions')}
            </span>
            <div class="flex flex-col gap-2.5">
              <button
                class="flex-1 flex flex-col items-center gap-1 px-3 py-3.5 bg-transparent border border-[var(--gray-200)] rounded-xl text-[var(--gray-600)] text-[13px] font-medium cursor-pointer transition-all duration-200 hover:bg-[var(--gray-100)] hover:border-slate-300 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={async () => {
                  await onHandleDownloadPDF();
                  setEditingActionId(null);
                }}
                disabled={hasValidationErrors}
              >
                <Download size={16} />
                <span>{t('review.download')}</span>
                <span class="text-[10px] font-normal text-[var(--gray-400)]">{t('review.saveAsPdf')}</span>
              </button>
              <button
                class="flex-1 flex flex-col items-center gap-1 px-3 py-3.5 bg-transparent border border-[var(--gray-200)] rounded-xl text-[var(--gray-600)] text-[13px] font-medium cursor-pointer transition-all duration-200 hover:bg-[var(--gray-100)] hover:border-slate-300 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={onOpenViewLinkModal}
                disabled={hasValidationErrors || copyLinkStatus === 'loading'}
              >
                {copyLinkStatus === 'loading' ? (
                  <Loader2 size={16} class="animate-spin" />
                ) : (
                  <Eye size={16} />
                )}
                <span>{t('review.viewLink')}</span>
                <span class="text-[10px] font-normal text-[var(--gray-400)]">{t('review.getShareableLink')}</span>
              </button>
              <button
                class="flex-1 flex flex-col items-center gap-1 px-3 py-3.5 bg-sky-500/15 border border-sky-500/30 rounded-xl text-sky-400 text-[13px] font-medium cursor-pointer transition-all duration-200 hover:bg-sky-500/25 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={async () => {
                  await onSaveDocument(action.id);
                  setEditingActionId(null);
                }}
                disabled={hasValidationErrors}
              >
                <Database size={16} />
                <span>{t('review.save')}</span>
                <span class="text-[10px] font-normal text-sky-400/60">{t('review.storeInDatabase')}</span>
              </button>
            </div>
          </div>
        </>
      );
    }

    if (action.type === 'send_email') {
      return (
        <>
          <div class="mt-3">
            <label for={`action-email-${action.id}`} class="block text-[11px] font-medium text-[var(--gray-500)] uppercase tracking-wide mb-1.5">
              {t('review.recipientEmail')}
            </label>
            <input
              id={`action-email-${action.id}`}
              type="email"
              value={action.details.recipient || data.client.email || ''}
              onInput={(e) =>
                onUpdateActionRecipient(action, (e.target as HTMLInputElement).value)
              }
              placeholder={t('placeholder.email')}
              class="w-full px-3 py-2.5 bg-[var(--white)] border border-[var(--gray-200)] rounded-[10px] text-[var(--gray-900)] text-sm font-inherit transition-all duration-200 focus:outline-none focus:border-[var(--blu-primary,#0066ff)] focus:shadow-[0_0_0_3px_rgba(0,102,255,0.08)]"
            />
            {data.client.email && action.details.recipient !== data.client.email && (
              <button
                class="mt-2 px-2.5 py-1.5 bg-sky-500/10 border-none rounded-md text-sky-400 text-[11px] cursor-pointer transition-all duration-200 hover:bg-sky-500/20"
                onClick={() => onUpdateActionRecipient(action, data.client.email || '')}
              >
                Use client email ({data.client.email})
              </button>
            )}
          </div>
          <div class="mt-3">
            <label for={`action-email-msg-${action.id}`} class="block text-[11px] font-medium text-[var(--gray-500)] uppercase tracking-wide mb-1.5">
              {t('review.customMessage')}
            </label>
            <input
              id={`action-email-msg-${action.id}`}
              type="text"
              value={action.details.message || ''}
              onInput={(e) =>
                handleActionMessageChange(action.id, (e.target as HTMLInputElement).value)
              }
              placeholder={t('placeholder.addNote')}
              class="w-full px-3 py-2.5 bg-[var(--white)] border border-[var(--gray-200)] rounded-[10px] text-[var(--gray-900)] text-sm font-inherit transition-all duration-200 focus:outline-none focus:border-[var(--blu-primary,#0066ff)] focus:shadow-[0_0_0_3px_rgba(0,102,255,0.08)]"
            />
          </div>
        </>
      );
    }

    return null;
  }

  return (
    <div class="bg-gradient-to-br from-emerald-500/[0.06] to-emerald-600/[0.04] p-4 rounded-[var(--radius-card)]">
      <h3 class="text-sm font-semibold text-[var(--gray-500)] uppercase tracking-wider m-0 mb-3">
        {t('review.actions')}
      </h3>

      {/* Profile Completeness Warning */}
      {showProfileWarning && profileMissingFields.length > 0 && (
        <div class="bg-gradient-to-br from-amber-100 to-amber-200 border border-amber-500 rounded-xl p-4 mb-4" ref={warningRef}>
          <div class="flex gap-3 text-amber-900">
            <AlertTriangle size={20} />
            <div class="flex-1">
              <p class="font-semibold m-0 mb-2 text-sm">{t('review.completeProfile')}</p>
              <ul class="m-0 pl-5 text-[13px] text-amber-700">
                {profileMissingFields.map((field) => (
                  <li key={field} class="my-0.5">{field}</li>
                ))}
              </ul>
            </div>
          </div>
          <div class="flex gap-2 mt-3 pl-8">
            <button
              class="px-4 py-3 rounded-[10px] text-sm font-semibold cursor-pointer transition-all duration-150 active:scale-[0.97] bg-transparent border border-amber-600 text-amber-900 hover:bg-amber-600/10"
              onClick={handleSendAnywayClick}
            >
              {t('review.sendAnyway')}
            </button>
            <button
              class="px-4 py-3 rounded-[10px] text-sm font-semibold cursor-pointer transition-all duration-150 active:scale-[0.97] bg-amber-500 border-none text-white hover:bg-amber-600"
              onClick={handleGoToProfileClick}
            >
              {t('review.goToProfile')}
            </button>
          </div>
        </div>
      )}

      <div class="flex flex-col gap-2.5">
        {sortedActions.map((action, index) => {
          const config = actionConfig[action.type] || DEFAULT_CONFIG;
          const isEditing = editingActionId === action.id;

          return (
            <div
              key={action.id}
              class={cn(
                'flex flex-col bg-[var(--white,#fff)] border border-[var(--gray-200)] rounded-[14px] transition-all duration-200 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
                action.status !== 'completed' && action.status !== 'in_progress' && action.status !== 'failed' && 'hover:border-[var(--gray-300,#cbd5e1)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]',
                action.status === 'completed' && 'bg-emerald-500/[0.08] border-emerald-500/20',
                action.status === 'in_progress' && 'bg-sky-500/[0.08] border-sky-500/30',
                action.status === 'failed' && 'bg-red-500/[0.08] border-red-500/20'
              )}
            >
              <div class="flex items-center gap-3 px-4 py-3.5">
                <div
                  class={cn(
                    'w-6 h-6 flex items-center justify-center bg-[var(--gray-200)] rounded-lg text-xs font-bold text-[var(--gray-500)]',
                    action.status === 'completed' && 'bg-emerald-500/20 text-emerald-400'
                  )}
                >
                  {index + 1}
                </div>

                <div
                  class={cn(
                    'w-10 h-10 flex items-center justify-center rounded-xl',
                    action.status === 'completed'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : ''
                  )}
                  style={action.status !== 'completed' ? {
                    '--action-color': config.color,
                    background: `color-mix(in srgb, ${config.color} 15%, transparent)`,
                    color: config.color,
                  } as Record<string, string> : undefined}
                >
                  {renderActionIcon(action, config)}
                </div>

                <div class="flex-1 min-w-0">
                  <span class="block text-sm font-semibold text-[var(--gray-900)]">
                    {t(config.labelKey)}
                  </span>
                  <span class="block text-xs text-[var(--gray-500)] overflow-hidden text-ellipsis whitespace-nowrap">
                    {onGetActionDescription(action)}
                  </span>
                  {action.status === 'failed' && action.error && (
                    <span class="block text-[11px] text-red-500 mt-0.5">{action.error}</span>
                  )}
                </div>

                {renderActionButtons(action, isEditing)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action edit modal */}
      {(() => {
        const editAction = editingActionId
          ? sortedActions.find((a) => a.id === editingActionId)
          : undefined;
        if (!editAction) return null;
        const editConfig = actionConfig[editAction.type] || DEFAULT_CONFIG;
        return (
          <ReviewModal
            open={true}
            title={t(editConfig.labelKey)}
            onClose={() => setEditingActionId(null)}
          >
            <div class="flex flex-col pt-1">
              {renderEditForm(editAction)}
              <button
                class="flex items-center justify-center gap-1.5 w-full mt-4 p-3 bg-[var(--blu-primary,#0066ff)] border-none rounded-xl text-white text-sm font-semibold cursor-pointer transition-all duration-150 shadow-[0_2px_8px_rgba(0,102,255,0.25)] hover:bg-[#0055dd] hover:shadow-[0_4px_12px_rgba(0,102,255,0.3)] active:scale-[0.98]"
                onClick={() => setEditingActionId(null)}
              >
                <Check size={14} />
                {t('common.done')}
              </button>
            </div>
          </ReviewModal>
        );
      })()}

      {!showActionTypePicker ? (
        <button
          class="flex items-center justify-center gap-2 w-full p-3 mt-3 border-2 border-dashed border-emerald-500/40 rounded-[10px] bg-transparent text-emerald-500 text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-emerald-500/[0.08] hover:border-emerald-500 active:scale-[0.98] active:bg-emerald-500/[0.12]"
          onClick={() => setShowActionTypePicker(true)}
        >
          <Plus size={16} />
          {t('review.addAction')}
        </button>
      ) : (
        <div class="mt-3 bg-white border border-[var(--gray-200)] rounded-[14px] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
          <div class="flex items-center justify-between mb-3">
            <span class="text-[13px] font-semibold text-[var(--gray-500)] uppercase tracking-wider">
              {t('review.chooseActionType')}
            </span>
            <button
              class="bg-transparent border-none text-[var(--gray-400)] cursor-pointer p-1 rounded-md hover:bg-[var(--gray-100)] hover:text-[var(--gray-600)]"
              onClick={() => setShowActionTypePicker(false)}
            >
              <X size={16} />
            </button>
          </div>
          <div class="flex flex-col gap-1.5">
            {Object.entries(actionConfig).map(([type, config]) => {
              const IconComponent = config.icon;
              return (
                <button
                  key={type}
                  class="flex items-center gap-3 px-4 py-3.5 border border-[#eee] rounded-[10px] bg-white cursor-pointer text-sm font-medium text-[var(--gray-700)] transition-all duration-150 hover:bg-[var(--gray-50)] hover:border-[var(--gray-300)]"
                  onClick={() => onAddAction(type as ActionStep['type'])}
                >
                  <div
                    class="flex items-center justify-center w-[34px] h-[34px] rounded-lg shrink-0"
                    style={{
                      color: config.color,
                      background: `${config.color}1a`,
                    }}
                  >
                    <IconComponent size={18} />
                  </div>
                  <span>{t(config.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
