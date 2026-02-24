import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { useI18nStore } from '@/lib/i18n';
import { suggestClients } from '@/lib/api/clients';
import {
  FileText,
  Receipt,
  User,
  DollarSign,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Pencil,
  Check,
  AlertTriangle,
  Search,
  Loader2,
} from 'lucide-react';
import { ReviewModal } from '@/components/review/ReviewModal';

interface ClientSuggestionFull {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  similarity: number;
}

interface ClientData {
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

interface ParsedData {
  documentType: 'invoice' | 'estimate';
  client: ClientData;
  dueDate: string | null;
  [key: string]: unknown;
}

interface ReviewPreviewCardProps {
  data: ParsedData;
  onDataChange: (data: ParsedData) => void;
  documentNumber: string;
  calculatedTotal: number;
  exactClientMatch: ClientSuggestionFull | null;
  clientSuggestions: ClientSuggestionFull[];
  showClientSuggestions: boolean;
  onShowClientSuggestionsChange: (show: boolean) => void;
  clientFullName: string;
  formatCurrency: (amount: number) => string;
  onSearchClients: (query: string) => void;
  onSelectClientFromDropdown: (client: ClientSuggestionFull) => void;
  onApplyClientSuggestion: (client: ClientSuggestionFull) => void;
  onParseClientName: (name: string) => { firstName: string; lastName: string };
  onDocNumberChange: (newNumber: string) => void;
  onSaveClientInfo?: (info: { clientId: string; email?: string; name?: string }) => void;
}

export function ReviewPreviewCard({
  data,
  onDataChange,
  documentNumber,
  calculatedTotal,
  exactClientMatch,
  clientSuggestions,
  showClientSuggestions,
  onShowClientSuggestionsChange,
  clientFullName,
  formatCurrency,
  onSearchClients,
  onSelectClientFromDropdown,
  onApplyClientSuggestion,
  onParseClientName,
  onDocNumberChange,
  onSaveClientInfo,
}: ReviewPreviewCardProps) {
  const { t } = useI18nStore();

  const [isEditingDocNumber, setIsEditingDocNumber] = useState(false);
  const [editableDocNumber, setEditableDocNumber] = useState('');
  const [isEditingClientName, setIsEditingClientName] = useState(false);
  const [editableClientName, setEditableClientName] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientDropdownResults, setClientDropdownResults] = useState<ClientSuggestionFull[]>([]);
  const [isSearchingClients, setIsSearchingClients] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const docNumberRef = useRef<HTMLInputElement>(null);
  const clientNameRef = useRef<HTMLInputElement>(null);

  // Sync selectedClientId when AI finds an exact client match
  useEffect(() => {
    if (exactClientMatch?.id && !selectedClientId) {
      setSelectedClientId(exactClientMatch.id);
    }
  }, [exactClientMatch?.id]);

  // Autofocus doc number input
  useEffect(() => {
    if (isEditingDocNumber && docNumberRef.current) {
      docNumberRef.current.focus();
    }
  }, [isEditingDocNumber]);

  // Autofocus client name input
  useEffect(() => {
    if (isEditingClientName && clientNameRef.current) {
      clientNameRef.current.focus();
    }
  }, [isEditingClientName]);

  const searchClients = useCallback(async (query: string) => {
    setIsSearchingClients(true);
    setClientDropdownResults([]);
    onSearchClients(query);
    try {
      const result = await suggestClients(query, 5);
      setClientDropdownResults(result.suggestions);
    } catch (error) {
      console.error('Client search error:', error);
    } finally {
      setIsSearchingClients(false);
    }
  }, [onSearchClients]);

  function selectClientFromDropdown(client: ClientSuggestionFull) {
    setSelectedClientId(client.id);
    onSelectClientFromDropdown(client);
  }

  function handleDocNumberBlur() {
    if (editableDocNumber.trim()) {
      onDocNumberChange(editableDocNumber.trim());
    }
    setIsEditingDocNumber(false);
  }

  function handleDocNumberKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      if (editableDocNumber.trim()) {
        onDocNumberChange(editableDocNumber.trim());
      }
      setIsEditingDocNumber(false);
    }
    if (e.key === 'Escape') {
      setEditableDocNumber(documentNumber);
      setIsEditingDocNumber(false);
    }
  }

  function handleClientNameInput(value: string) {
    setEditableClientName(value);
    if (value.length >= 2) {
      searchClients(value);
      setShowClientDropdown(true);
    } else {
      setShowClientDropdown(false);
    }
  }

  function handleClientNameKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      if (editableClientName.trim()) {
        const { firstName, lastName } = onParseClientName(editableClientName);
        onDataChange({
          ...data,
          client: {
            ...data.client,
            firstName,
            lastName,
            name: editableClientName.trim(),
          },
        });
      }
      setShowClientDropdown(false);
      setIsEditingClientName(false);
    }
    if (e.key === 'Escape') {
      setShowClientDropdown(false);
      setIsEditingClientName(false);
    }
  }

  function handleClientNameFocus() {
    if (editableClientName.length >= 2) {
      searchClients(editableClientName);
      setShowClientDropdown(true);
    }
  }

  function handleClientEmailInput(value: string) {
    onDataChange({
      ...data,
      client: { ...data.client, email: value || null },
    });
  }

  function handleClientEmailBlur(value: string) {
    const newEmail = value?.trim();
    if (newEmail && selectedClientId && onSaveClientInfo) {
      onSaveClientInfo({ clientId: selectedClientId, email: newEmail });
    }
  }

  function handleClientPhoneInput(value: string) {
    onDataChange({
      ...data,
      client: { ...data.client, phone: value || null },
    });
  }

  function handleClientPhoneBlur(value: string) {
    const newPhone = value?.trim();
    if (newPhone && selectedClientId && onSaveClientInfo) {
      onSaveClientInfo({ clientId: selectedClientId, name: clientFullName || undefined });
    }
  }

  function handleClientAddressInput(value: string) {
    onDataChange({
      ...data,
      client: { ...data.client, address: value || null },
    });
  }

  function handleClientAddressBlur(value: string) {
    const newAddress = value?.trim();
    if (newAddress && selectedClientId && onSaveClientInfo) {
      onSaveClientInfo({ clientId: selectedClientId, name: clientFullName || undefined });
    }
  }

  function handleClientEmailKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === 'Escape') {
      if (editableClientName.trim()) {
        const { firstName, lastName } = onParseClientName(editableClientName);
        onDataChange({
          ...data,
          client: {
            ...data.client,
            firstName,
            lastName,
            name: editableClientName.trim(),
          },
        });
      }
      setIsEditingClientName(false);
    }
  }

  function handleDoneEditClient() {
    if (editableClientName.trim()) {
      const { firstName, lastName } = onParseClientName(editableClientName);
      const updatedClient = {
        ...data.client,
        firstName,
        lastName,
        name: editableClientName.trim(),
      };
      onDataChange({ ...data, client: updatedClient });

      if (selectedClientId && onSaveClientInfo) {
        onSaveClientInfo({
          clientId: selectedClientId,
          email: updatedClient.email || undefined,
          name: updatedClient.name || undefined,
        });
      }
    }
    setShowClientDropdown(false);
    setIsEditingClientName(false);
  }

  function handleDropdownSelect(client: ClientSuggestionFull) {
    selectClientFromDropdown(client);
    setShowClientDropdown(false);
    setIsEditingClientName(false);
  }

  function handleDueDateChange(value: string) {
    onDataChange({ ...data, dueDate: value || null });
  }

  return (
    <>
      <style>{componentStyles}</style>
      <div class="preview-card">
        <div class="preview-header">
          <div class={`doc-type-badge${data.documentType === 'estimate' ? ' estimate' : ''}`}>
            {data.documentType === 'estimate' ? (
              <FileText size={16} />
            ) : (
              <Receipt size={16} />
            )}
            <span>{data.documentType === 'estimate' ? 'Estimate' : 'Invoice'}</span>
          </div>

          {isEditingDocNumber ? (
            <input
              ref={docNumberRef}
              class="doc-number-input"
              type="text"
              value={editableDocNumber}
              onInput={(e) => setEditableDocNumber((e.target as HTMLInputElement).value)}
              onBlur={handleDocNumberBlur}
              onKeyDown={handleDocNumberKeyDown}
            />
          ) : (
            <button
              class="doc-number-btn"
              onClick={() => {
                setEditableDocNumber(documentNumber);
                setIsEditingDocNumber(true);
              }}
            >
              <span class="doc-number">#{documentNumber}</span>
              <Pencil size={12} class="edit-icon" />
            </button>
          )}
        </div>

        <div class="preview-body">
          <div class="client-total-row">
            {/* Client Side (left) */}
            <div class="client-side">
              <div class="client-row-wrapper">
                <button
                  class={`preview-row client-row-btn${!clientFullName ? ' has-warning' : ''}`}
                  onClick={() => {
                    setEditableClientName(clientFullName || '');
                    setIsEditingClientName(true);
                  }}
                >
                  <User size={16} class="preview-icon" />
                  <div class="preview-info">
                    <span class="preview-label">{t('review.client')}</span>
                    <span class={`preview-value${!clientFullName ? ' missing' : ''}`}>
                      {clientFullName || 'Tap to select'}
                    </span>
                    {data.client.email && (
                      <span class="client-email-hint">{data.client.email}</span>
                    )}
                    {data.client.phone && (
                      <span class="client-phone-hint">{data.client.phone}</span>
                    )}
                  </div>
                  {!clientFullName ? (
                    <div class="inline-warning" title="Client name is required">
                      <AlertTriangle size={16} />
                    </div>
                  ) : !data.client.email ? (
                    <div class="inline-warning" title="Email is missing">
                      <AlertTriangle size={16} />
                    </div>
                  ) : (
                    <div class="inline-valid" title="Client set">
                      <Check size={16} />
                    </div>
                  )}
                </button>
              </div>

              {/* Client Suggestions for document creation (auto-shown) */}
              {!showClientDropdown &&
                showClientSuggestions &&
                clientSuggestions.length > 0 && (
                  <div class="client-suggestions-inline">
                    <div class="suggestions-header-inline">
                      <Search size={14} />
                      <span>{t('review.didYouMean')}</span>
                    </div>
                    <div class="suggestions-chips">
                      {clientSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          class="suggestion-chip"
                          onClick={() => onApplyClientSuggestion(suggestion)}
                        >
                          <span class="chip-name">{suggestion.name}</span>
                          {suggestion.similarity >= 0.8 ? (
                            <span class="chip-match high">{'\u2713'}</span>
                          ) : suggestion.similarity >= 0.6 ? (
                            <span class="chip-match medium">~</span>
                          ) : null}
                        </button>
                      ))}
                      <button
                        class="suggestion-chip dismiss"
                        onClick={() => onShowClientSuggestionsChange(false)}
                      >
                        Keep "{clientFullName}"
                      </button>
                    </div>
                  </div>
                )}

              {/* Due Date (left, under client) */}
              <div class="preview-row due-date-row">
                <Calendar size={16} class="preview-icon" />
                <div class="preview-info">
                  <span class="preview-label">{t('review.dueDate')}</span>
                  <input
                    type="date"
                    class="due-date-input"
                    value={data.dueDate || ''}
                    onInput={(e) =>
                      handleDueDateChange((e.target as HTMLInputElement).value)
                    }
                  />
                </div>
              </div>
            </div>

            {/* Total Side (right) */}
            <div class="total-side">
              <div class={`total-block${calculatedTotal <= 0 ? ' has-warning' : ''}`}>
                <DollarSign size={16} class="preview-icon" />
                <div class="preview-info">
                  <span class="preview-label">
                    {t('review.total')}{' '}
                    <span class="total-hint">{t('review.fromLineItems')}</span>
                  </span>
                  <span
                    class={`preview-value amount${calculatedTotal <= 0 ? ' warning-value' : ''}`}
                  >
                    {formatCurrency(calculatedTotal)}
                  </span>
                </div>
                {calculatedTotal <= 0 ? (
                  <div class="inline-warning" title="Total must be greater than $0">
                    <AlertTriangle size={16} />
                  </div>
                ) : (
                  <div class="inline-valid" title="Valid amount">
                    <Check size={16} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Client edit modal */}
      <ReviewModal
        open={isEditingClientName}
        title={t('review.client')}
        onClose={handleDoneEditClient}
      >
        <div class="client-editing-form">
          <div class="client-edit-field">
            <label for="edit-client-name">
              <User
                size={12}
                style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }}
              />
              {t('review.client')}
            </label>
            <div class="client-name-search-wrapper">
              <input
                ref={clientNameRef}
                id="edit-client-name"
                class="client-name-input"
                type="text"
                value={editableClientName}
                onInput={(e) =>
                  handleClientNameInput((e.target as HTMLInputElement).value)
                }
                onKeyDown={handleClientNameKeyDown}
                onFocus={handleClientNameFocus}
                placeholder={t('review.selectDifferentClient')}
              />
              <Search size={14} class="search-icon-inside" />
            </div>

            {showClientDropdown &&
              (isSearchingClients || clientDropdownResults.length > 0) && (
                <div class="client-search-results">
                  {isSearchingClients ? (
                    <div class="dropdown-loading">
                      <Loader2 size={16} class="spinning" />
                      <span>{t('review.searching')}</span>
                    </div>
                  ) : (
                    clientDropdownResults.map((client) => (
                      <button
                        key={client.id}
                        class="dropdown-item"
                        onClick={() => handleDropdownSelect(client)}
                      >
                        <div class="dropdown-item-info">
                          <span class="dropdown-item-name">{client.name}</span>
                          {client.email && (
                            <span class="dropdown-item-detail">{client.email}</span>
                          )}
                          {client.phone && (
                            <span class="dropdown-item-detail">{client.phone}</span>
                          )}
                          {client.address && (
                            <span class="dropdown-item-detail">
                              {client.address.length > 40
                                ? `${client.address.slice(0, 40)}...`
                                : client.address}
                            </span>
                          )}
                        </div>
                        {client.similarity >= 0.8 ? (
                          <span class="match-badge high">{t('review.highMatch')}</span>
                        ) : client.similarity >= 0.6 ? (
                          <span class="match-badge medium">
                            {t('review.goodMatch')}
                          </span>
                        ) : null}
                      </button>
                    ))
                  )}
                </div>
              )}
          </div>

          <div class="client-edit-field">
            <label for="edit-client-email">
              <Mail
                size={12}
                style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }}
              />
              {t('review.email')}
            </label>
            <input
              id="edit-client-email"
              class="client-email-input"
              type="email"
              value={data.client.email || ''}
              onInput={(e) =>
                handleClientEmailInput((e.target as HTMLInputElement).value)
              }
              placeholder="email@example.com"
              onBlur={(e) =>
                handleClientEmailBlur((e.target as HTMLInputElement).value)
              }
              onKeyDown={handleClientEmailKeyDown}
            />
          </div>

          <div class="client-edit-field">
            <label for="edit-client-phone">
              <Phone
                size={12}
                style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }}
              />
              Phone
            </label>
            <input
              id="edit-client-phone"
              class="client-email-input"
              type="tel"
              value={data.client.phone || ''}
              onInput={(e) =>
                handleClientPhoneInput((e.target as HTMLInputElement).value)
              }
              placeholder="(555) 123-4567"
              onBlur={(e) =>
                handleClientPhoneBlur((e.target as HTMLInputElement).value)
              }
            />
          </div>

          <div class="client-edit-field">
            <label for="edit-client-address">
              <MapPin
                size={12}
                style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }}
              />
              Address
            </label>
            <input
              id="edit-client-address"
              class="client-email-input"
              type="text"
              value={data.client.address || ''}
              onInput={(e) =>
                handleClientAddressInput((e.target as HTMLInputElement).value)
              }
              placeholder="123 Main St, City"
              onBlur={(e) =>
                handleClientAddressBlur((e.target as HTMLInputElement).value)
              }
            />
          </div>

          <button class="done-edit-client-btn" onClick={handleDoneEditClient}>
            <Check size={14} />
            {t('common.done')}
          </button>
        </div>
      </ReviewModal>
    </>
  );
}

const componentStyles = `
  .due-date-input::-webkit-calendar-picker-indicator {
    display: none !important;
    -webkit-appearance: none;
  }
  .due-date-input::-webkit-inner-spin-button,
  .due-date-input::-webkit-clear-button {
    display: none !important;
  }

  .preview-card {
    background: var(--white);
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-card);
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.03);
  }

  .preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 20px;
    border-bottom: 1px solid var(--gray-100);
  }

  .doc-type-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    background: var(--glass-primary-10);
    border-radius: var(--radius-input);
    color: var(--blu-primary);
    font-size: 15px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .doc-type-badge.estimate {
    background: var(--glass-amber-10);
    color: var(--data-amber);
  }

  .doc-number {
    font-size: 15px;
    font-family: var(--font-mono);
    color: var(--gray-500);
  }

  .doc-number-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .doc-number-btn:hover {
    background: var(--gray-100);
    border-color: #e2e8f0;
  }

  .doc-number-btn .edit-icon {
    color: var(--gray-400);
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .doc-number-btn:hover .edit-icon {
    opacity: 1;
  }

  @media (pointer: coarse) {
    .doc-number-btn .edit-icon {
      opacity: 0.5;
    }
  }

  .doc-number-input {
    padding: 4px 8px;
    border: 1px solid var(--blu-primary, #0066ff);
    border-radius: 6px;
    font-size: 12px;
    font-family: monospace;
    color: var(--gray-900);
    background: var(--white);
    outline: none;
    width: 120px;
    box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
  }

  .preview-body {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .client-total-row {
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }

  .client-side {
    flex: 1;
    min-width: 0;
  }

  .total-side {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
    text-align: right;
  }

  .total-block {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .total-block .preview-info {
    align-items: flex-end;
  }

  .due-date-row {
    margin-top: 16px;
  }

  .total-block.has-warning {
    color: var(--data-amber);
  }

  .client-editing-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 4px 0 0;
  }

  .client-edit-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .client-edit-field label {
    font-size: 11px;
    font-weight: 600;
    color: var(--gray-500);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .client-name-search-wrapper {
    position: relative;
  }

  .client-name-search-wrapper .search-icon-inside {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--gray-400);
    pointer-events: none;
  }

  .client-name-input,
  .client-email-input {
    font-size: 14px;
    color: var(--gray-900);
    border: 1px solid var(--gray-200);
    border-radius: 10px;
    padding: 10px 12px;
    background: white;
    width: 100%;
    font-family: inherit;
    transition: all 0.2s ease;
  }

  .client-name-input {
    padding-right: 36px;
  }

  .client-name-input:focus,
  .client-email-input:focus {
    outline: none;
    border-color: var(--blu-primary, #0066ff);
    box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
  }

  .client-name-input::placeholder,
  .client-email-input::placeholder {
    color: var(--gray-400);
  }

  .client-search-results {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--gray-200);
    border-radius: 10px;
    overflow: hidden;
    background: white;
    max-height: 180px;
    overflow-y: auto;
  }

  .client-search-results .dropdown-item {
    border-radius: 0;
    border: none;
    border-bottom: 1px solid var(--gray-100);
  }

  .client-search-results .dropdown-item:last-child {
    border-bottom: none;
  }

  .done-edit-client-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 12px 20px;
    border: none;
    border-radius: 12px;
    background: var(--blu-primary, #0066ff);
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    box-shadow: 0 2px 8px rgba(0, 102, 255, 0.25);
    margin-top: 4px;
  }

  .done-edit-client-btn:hover {
    background: #0055dd;
    box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);
  }

  .done-edit-client-btn:active {
    transform: scale(0.98);
  }

  .client-email-hint,
  .client-phone-hint {
    font-size: 12px;
    color: var(--gray-400);
  }

  @media (max-width: 480px) {
    .client-total-row {
      flex-direction: column;
      gap: 12px;
    }

    .total-side {
      align-items: flex-start;
      text-align: left;
      width: 100%;
    }

    .total-block .preview-info {
      align-items: flex-start;
    }
  }

  .preview-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .preview-row .preview-icon {
    color: var(--gray-500);
  }

  .preview-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  .preview-label {
    font-size: 11px;
    color: var(--gray-500);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .preview-value {
    font-size: 15px;
    color: var(--gray-900);
    font-weight: 500;
  }

  .preview-value.missing {
    color: rgba(248, 113, 113, 0.8);
    font-style: italic;
  }

  .preview-value.amount {
    color: var(--data-green);
    font-size: 18px;
    font-weight: 700;
  }

  .preview-value.warning-value {
    color: var(--data-amber);
  }

  .inline-warning {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: rgba(245, 158, 11, 0.12);
    border-radius: 8px;
    color: var(--data-amber);
    flex-shrink: 0;
    margin-left: auto;
  }

  .inline-valid {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: rgba(16, 185, 129, 0.12);
    border-radius: 8px;
    color: var(--data-green);
    flex-shrink: 0;
    margin-left: auto;
  }

  .preview-row.has-warning {
    background: rgba(245, 158, 11, 0.04);
    margin: -8px -12px;
    padding: 8px 12px;
    border-radius: 8px;
  }

  .client-row-wrapper {
    position: relative;
  }

  .client-row-btn {
    width: 100%;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s ease;
    border-radius: 10px;
  }

  .client-row-btn:hover {
    background: var(--gray-50, #f8fafc);
  }

  .client-row-btn:active {
    transform: scale(0.99);
  }

  .client-row-btn .preview-value {
    background: var(--gray-50);
    border: 1px solid var(--gray-200);
    border-radius: 10px;
    padding: 6px 12px;
    display: inline-block;
    transition: all 0.2s ease;
  }

  .client-row-btn:hover .preview-value {
    border-color: var(--gray-300);
    background: white;
  }

  .dropdown-loading {
    padding: 20px;
    text-align: center;
    color: var(--gray-500);
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 12px 14px;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--gray-100);
    cursor: pointer;
    text-align: left;
    transition: background 0.2s ease;
  }

  .dropdown-item:hover {
    background: var(--gray-50, #f8fafc);
  }

  .dropdown-item:active {
    background: var(--gray-100, #f1f5f9);
  }

  .dropdown-item:last-child {
    border-bottom: none;
  }

  .dropdown-item-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .dropdown-item-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--gray-900);
  }

  .dropdown-item-detail {
    font-size: 12px;
    color: var(--gray-500);
  }

  .match-badge {
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 500;
  }

  .match-badge.high {
    background: rgba(16, 185, 129, 0.12);
    color: var(--data-green);
  }

  .match-badge.medium {
    background: rgba(245, 158, 11, 0.12);
    color: var(--data-amber);
  }

  .due-date-input {
    background: var(--gray-50);
    border: 1px solid var(--gray-200);
    border-radius: 10px;
    padding: 8px 12px;
    font-size: 14px;
    font-weight: 500;
    color: var(--gray-900);
    font-family: inherit;
    cursor: pointer;
    transition: all 0.2s ease;
    -webkit-appearance: none;
    appearance: none;
    width: 160px;
    overflow: hidden;
  }

  .due-date-input:hover {
    border-color: var(--gray-300);
    background: white;
  }

  .due-date-input:focus {
    outline: none;
    border-color: var(--blu-primary, #0066ff);
    background: white;
    box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
  }

  .due-date-input:invalid,
  .due-date-input[value=''] {
    color: var(--gray-400);
  }

  .total-hint {
    font-weight: 400;
    font-size: 11px;
    color: var(--gray-400);
  }

  .client-suggestions-inline {
    padding: 12px;
    background: rgba(14, 165, 233, 0.06);
    border: 1px solid rgba(14, 165, 233, 0.15);
    border-radius: 10px;
    margin: 4px -4px;
  }

  .suggestions-header-inline {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 10px;
    font-size: 12px;
    font-weight: 500;
    color: #0284c7;
  }

  .suggestions-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .suggestion-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: var(--white);
    border: 1px solid rgba(14, 165, 233, 0.3);
    border-radius: 20px;
    font-size: 13px;
    color: var(--gray-900);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .suggestion-chip:hover {
    background: rgba(14, 165, 233, 0.1);
    border-color: #0ea5e9;
  }

  .suggestion-chip.dismiss {
    background: transparent;
    border-color: var(--gray-300);
    color: var(--gray-500);
  }

  .suggestion-chip.dismiss:hover {
    background: var(--gray-100);
    border-color: var(--gray-400);
    color: var(--gray-700);
  }

  .chip-name {
    font-weight: 500;
  }

  .chip-match {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    font-size: 10px;
    font-weight: 600;
  }

  .chip-match.high {
    background: rgba(16, 185, 129, 0.2);
    color: #059669;
  }

  .chip-match.medium {
    background: rgba(245, 158, 11, 0.2);
    color: #d97706;
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
