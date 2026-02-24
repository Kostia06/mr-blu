import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
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
      return <Loader2 size={20} class="spinning" />;
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
      <div class="action-buttons">
        {onActionHasEditableData(action) && action.status === 'pending' && !isExecuting && (
          <button
            class={`action-edit${isEditing ? ' active' : ''}`}
            onClick={() => toggleActionEdit(action.id)}
            aria-label="Edit action"
          >
            <Pencil size={14} />
          </button>
        )}

        {action.status === 'pending' && !isExecuting && (
          <button
            class="action-play"
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
              class={`action-edit${isEditing ? ' active' : ''}`}
              onClick={() => toggleActionEdit(action.id)}
              aria-label="Edit and retry action"
            >
              <Pencil size={14} />
            </button>
            <button
              class="action-retry"
              onClick={() => onRetryAction(action)}
              aria-label="Retry action"
            >
              <RotateCcw size={16} />
            </button>
          </>
        )}

        {action.status === 'completed' && (
          <div class="action-done">
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
          <div class="edit-form-field">
            <span class="edit-form-label">{t('review.documentType')}</span>
            <div class="doc-type-toggle">
              <button
                class={`doc-type-btn${data.documentType === 'invoice' ? ' active' : ''}`}
                onClick={() => handleDocumentTypeChange('invoice')}
              >
                <Receipt size={16} />
                Invoice
              </button>
              <button
                class={`doc-type-btn${data.documentType === 'estimate' ? ' active' : ''}`}
                onClick={() => handleDocumentTypeChange('estimate')}
              >
                <FileText size={16} />
                Estimate
              </button>
            </div>
          </div>

          <div class="edit-form-field-row">
            <div class="edit-form-field half">
              <label for={`action-client-firstname-${action.id}`}>
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
              />
            </div>
            <div class="edit-form-field half">
              <label for={`action-client-lastname-${action.id}`}>
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
              />
            </div>
          </div>

          <div class="edit-form-field">
            <span class="edit-form-label">{t('review.totalAmountLabel')}</span>
            <div class="amount-display">{formatCurrency(calculatedTotal)}</div>
            <span class="field-hint">{t('review.totalAmountHint')}</span>
          </div>

          <div class="edit-form-field">
            <span class="edit-form-label">{t('review.saveShareOptions')}</span>
            <div class="save-options">
              <button
                class="save-option-btn"
                onClick={async () => {
                  await onHandleDownloadPDF();
                  setEditingActionId(null);
                }}
                disabled={hasValidationErrors}
              >
                <Download size={16} />
                <span>{t('review.download')}</span>
                <span class="save-hint">{t('review.saveAsPdf')}</span>
              </button>
              <button
                class="save-option-btn view-link"
                onClick={onOpenViewLinkModal}
                disabled={hasValidationErrors || copyLinkStatus === 'loading'}
              >
                {copyLinkStatus === 'loading' ? (
                  <Loader2 size={16} class="animate-spin" />
                ) : (
                  <Eye size={16} />
                )}
                <span>{t('review.viewLink')}</span>
                <span class="save-hint">{t('review.getShareableLink')}</span>
              </button>
              <button
                class="save-option-btn primary"
                onClick={async () => {
                  await onSaveDocument(action.id);
                  setEditingActionId(null);
                }}
                disabled={hasValidationErrors}
              >
                <Database size={16} />
                <span>{t('review.save')}</span>
                <span class="save-hint">{t('review.storeInDatabase')}</span>
              </button>
            </div>
          </div>
        </>
      );
    }

    if (action.type === 'send_email') {
      return (
        <>
          <div class="edit-form-field">
            <label for={`action-email-${action.id}`}>{t('review.recipientEmail')}</label>
            <input
              id={`action-email-${action.id}`}
              type="email"
              value={action.details.recipient || data.client.email || ''}
              onInput={(e) =>
                onUpdateActionRecipient(action, (e.target as HTMLInputElement).value)
              }
              placeholder={t('placeholder.email')}
            />
            {data.client.email && action.details.recipient !== data.client.email && (
              <button
                class="use-client-btn"
                onClick={() => onUpdateActionRecipient(action, data.client.email || '')}
              >
                Use client email ({data.client.email})
              </button>
            )}
          </div>
          <div class="edit-form-field">
            <label for={`action-email-msg-${action.id}`}>{t('review.customMessage')}</label>
            <input
              id={`action-email-msg-${action.id}`}
              type="text"
              value={action.details.message || ''}
              onInput={(e) =>
                handleActionMessageChange(action.id, (e.target as HTMLInputElement).value)
              }
              placeholder={t('placeholder.addNote')}
            />
          </div>
        </>
      );
    }

    return null;
  }

  return (
    <>
      <style>{componentStyles}</style>
      <div class="actions-section">
        <h3 class="section-title">{t('review.actions')}</h3>

        {/* Profile Completeness Warning */}
        {showProfileWarning && profileMissingFields.length > 0 && (
          <div class="profile-warning" ref={warningRef}>
            <div class="warning-content">
              <AlertTriangle size={20} />
              <div class="warning-text">
                <p class="warning-title">{t('review.completeProfile')}</p>
                <ul class="missing-fields">
                  {profileMissingFields.map((field) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div class="warning-actions">
              <button class="warning-btn secondary" onClick={handleSendAnywayClick}>
                {t('review.sendAnyway')}
              </button>
              <button class="warning-btn primary" onClick={handleGoToProfileClick}>
                {t('review.goToProfile')}
              </button>
            </div>
          </div>
        )}

        <div class="action-list">
          {sortedActions.map((action, index) => {
            const config = actionConfig[action.type] || DEFAULT_CONFIG;
            const isEditing = editingActionId === action.id;

            return (
              <div
                key={action.id}
                class={`action-card${action.status === 'completed' ? ' completed' : ''}${action.status === 'in_progress' ? ' in-progress' : ''}${action.status === 'failed' ? ' failed' : ''}`}
              >
                <div class="action-main">
                  <div class="action-number">{index + 1}</div>

                  <div
                    class="action-icon"
                    style={{ '--action-color': config.color } as Record<string, string>}
                  >
                    {renderActionIcon(action, config)}
                  </div>

                  <div class="action-content">
                    <span class="action-label">{t(config.labelKey)}</span>
                    <span class="action-desc">{onGetActionDescription(action)}</span>
                    {action.status === 'failed' && action.error && (
                      <span class="action-error">{action.error}</span>
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
              <div class="action-edit-form">
                {renderEditForm(editAction)}
                <button
                  class="done-edit-btn"
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
            class="add-action-btn"
            onClick={() => setShowActionTypePicker(true)}
          >
            <Plus size={16} />
            {t('review.addAction')}
          </button>
        ) : (
          <div class="action-type-picker">
            <div class="picker-header">
              <span class="picker-title">{t('review.chooseActionType')}</span>
              <button
                class="picker-close"
                onClick={() => setShowActionTypePicker(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div class="picker-options">
              {Object.entries(actionConfig).map(([type, config]) => {
                const IconComponent = config.icon;
                return (
                  <button
                    key={type}
                    class="picker-option"
                    onClick={() => onAddAction(type as ActionStep['type'])}
                  >
                    <div
                      class="picker-icon"
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
    </>
  );
}

const componentStyles = `
  .actions-section {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.06), rgba(5, 150, 105, 0.04));
    padding: 16px;
    border-radius: var(--radius-card);
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--gray-500);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 12px;
  }

  .profile-warning {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border: 1px solid #f59e0b;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .warning-content {
    display: flex;
    gap: 12px;
    color: #92400e;
  }

  .warning-text {
    flex: 1;
  }

  .warning-title {
    font-weight: 600;
    margin: 0 0 8px;
    font-size: 14px;
  }

  .missing-fields {
    margin: 0;
    padding-left: 20px;
    font-size: 13px;
    color: #b45309;
  }

  .missing-fields li {
    margin: 2px 0;
  }

  .warning-actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    padding-left: 32px;
  }

  .warning-btn {
    padding: 12px 16px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .warning-btn:active {
    transform: scale(0.97);
  }

  .warning-btn.secondary {
    background: transparent;
    border: 1px solid #d97706;
    color: #92400e;
  }

  .warning-btn.secondary:hover {
    background: rgba(217, 119, 6, 0.1);
  }

  .warning-btn.primary {
    background: #f59e0b;
    border: none;
    color: white;
  }

  .warning-btn.primary:hover {
    background: #d97706;
  }

  .action-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .action-card {
    display: flex;
    flex-direction: column;
    background: var(--white, #fff);
    border: 1px solid var(--gray-200);
    border-radius: 14px;
    transition: all 0.2s ease;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }

  .action-card:hover:not(.completed):not(.in-progress):not(.failed) {
    border-color: var(--gray-300, #cbd5e1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .action-main {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
  }

  .action-card.completed {
    background: rgba(16, 185, 129, 0.08);
    border-color: rgba(16, 185, 129, 0.2);
  }

  .action-card.in-progress {
    background: rgba(14, 165, 233, 0.08);
    border-color: rgba(14, 165, 233, 0.3);
  }

  .action-card.failed {
    background: rgba(239, 68, 68, 0.08);
    border-color: rgba(239, 68, 68, 0.2);
  }

  .action-number {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--gray-200);
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    color: var(--gray-500);
  }

  .action-card.completed .action-number {
    background: rgba(16, 185, 129, 0.2);
    color: #34d399;
  }

  .action-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--action-color) 15%, transparent);
    border-radius: 12px;
    color: var(--action-color);
  }

  .action-card.completed .action-icon {
    background: rgba(16, 185, 129, 0.15);
    color: #34d399;
  }

  .action-content {
    flex: 1;
    min-width: 0;
  }

  .action-label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: var(--gray-900);
  }

  .action-desc {
    display: block;
    font-size: 12px;
    color: var(--gray-500);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .action-play {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(14, 165, 233, 0.15);
    border-radius: 10px;
    color: #0ea5e9;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-play:hover:not(:disabled) {
    background: rgba(14, 165, 233, 0.25);
    transform: scale(1.05);
  }

  .action-play:active:not(:disabled) {
    transform: scale(0.95);
  }

  .action-play:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .action-done {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(16, 185, 129, 0.15);
    border-radius: 10px;
    color: #34d399;
  }

  .action-buttons {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .action-edit {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--gray-200);
    border: none;
    border-radius: 8px;
    color: var(--gray-500);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-edit:hover {
    background: var(--gray-300);
    color: var(--gray-900);
  }

  .action-edit.active {
    background: rgba(14, 165, 233, 0.2);
    color: #38bdf8;
  }

  .action-edit-form {
    display: flex;
    flex-direction: column;
    padding: 4px 0 0;
  }

  .edit-form-field-row {
    display: flex;
    gap: 12px;
    margin-top: 12px;
  }

  .edit-form-field-row .edit-form-field.half {
    flex: 1;
    margin-top: 0;
  }

  .edit-form-field {
    margin-top: 12px;
  }

  .edit-form-field label,
  .edit-form-field .edit-form-label {
    display: block;
    font-size: 11px;
    font-weight: 500;
    color: var(--gray-500);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin-bottom: 6px;
  }

  .edit-form-field input {
    width: 100%;
    padding: 10px 12px;
    background: var(--white);
    border: 1px solid var(--gray-200);
    border-radius: 10px;
    color: var(--gray-900);
    font-size: 14px;
    font-family: inherit;
    transition: all 0.2s ease;
  }

  .edit-form-field input:focus {
    outline: none;
    border-color: var(--blu-primary, #0066ff);
    box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.08);
  }

  .use-client-btn {
    margin-top: 8px;
    padding: 6px 10px;
    background: rgba(14, 165, 233, 0.1);
    border: none;
    border-radius: 6px;
    color: #38bdf8;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .use-client-btn:hover {
    background: rgba(14, 165, 233, 0.2);
  }

  .done-edit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    margin-top: 16px;
    padding: 12px;
    background: var(--blu-primary, #0066ff);
    border: none;
    border-radius: 12px;
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    box-shadow: 0 2px 8px rgba(0, 102, 255, 0.25);
  }

  .done-edit-btn:hover {
    background: #0055dd;
    box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);
  }

  .done-edit-btn:active {
    transform: scale(0.98);
  }

  .doc-type-toggle {
    display: flex;
    gap: 8px;
  }

  .doc-type-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    background: transparent;
    border: 1px solid var(--gray-200);
    border-radius: 10px;
    color: var(--gray-500);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .doc-type-btn.active {
    background: rgba(14, 165, 233, 0.15);
    border-color: rgba(14, 165, 233, 0.3);
    color: #38bdf8;
  }

  .doc-type-btn:hover:not(.active) {
    background: var(--gray-100);
    color: var(--gray-900);
  }

  .amount-display {
    padding: 12px;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: 8px;
    color: #34d399;
    font-size: 18px;
    font-weight: 700;
    text-align: center;
  }

  .field-hint {
    display: block;
    margin-top: 6px;
    font-size: 11px;
    color: var(--gray-500);
  }

  .save-options {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .save-option-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 14px 12px;
    background: transparent;
    border: 1px solid var(--gray-200);
    border-radius: 12px;
    color: var(--gray-600);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .save-option-btn:hover:not(:disabled) {
    background: var(--gray-100);
    border-color: #cbd5e1;
  }

  .save-option-btn:active:not(:disabled) {
    transform: scale(0.98);
  }

  .save-option-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .save-option-btn.primary {
    background: rgba(14, 165, 233, 0.15);
    border-color: rgba(14, 165, 233, 0.3);
    color: #38bdf8;
  }

  .save-option-btn.primary:hover:not(:disabled) {
    background: rgba(14, 165, 233, 0.25);
  }

  .save-hint {
    font-size: 10px;
    font-weight: 400;
    color: var(--gray-400);
  }

  .save-option-btn.primary .save-hint {
    color: rgba(56, 189, 248, 0.6);
  }

  .add-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 12px;
    margin-top: 12px;
    border: 2px dashed rgba(16, 185, 129, 0.4);
    border-radius: 10px;
    background: transparent;
    color: #10b981;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .add-action-btn:hover {
    background: rgba(16, 185, 129, 0.08);
    border-color: #10b981;
  }

  .add-action-btn:active {
    transform: scale(0.98);
    background: rgba(16, 185, 129, 0.12);
  }

  .action-type-picker {
    margin-top: 12px;
    background: white;
    border: 1px solid var(--gray-200);
    border-radius: 14px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .picker-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--gray-500);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .picker-close {
    background: none;
    border: none;
    color: var(--gray-400);
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
  }

  .picker-close:hover {
    background: var(--gray-100);
    color: var(--gray-600);
  }

  .picker-options {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .picker-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border: 1px solid var(--gray-150, #eee);
    border-radius: 10px;
    background: white;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: var(--gray-700);
    transition: all 0.15s ease;
  }

  .picker-option:hover {
    background: var(--gray-50);
    border-color: var(--gray-300);
  }

  .picker-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 8px;
    flex-shrink: 0;
  }

  .action-retry {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(239, 68, 68, 0.15);
    border: none;
    border-radius: 10px;
    color: #ef4444;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-retry:hover {
    background: rgba(239, 68, 68, 0.25);
    transform: scale(1.05);
  }

  .action-error {
    display: block;
    font-size: 11px;
    color: #ef4444;
    margin-top: 2px;
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
