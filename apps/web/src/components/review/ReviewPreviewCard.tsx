import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { cn } from '@/lib/utils';
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

  useEffect(() => {
    if (exactClientMatch?.id && !selectedClientId) {
      setSelectedClientId(exactClientMatch.id);
    }
  }, [exactClientMatch?.id]);

  useEffect(() => {
    if (isEditingDocNumber && docNumberRef.current) {
      docNumberRef.current.focus();
    }
  }, [isEditingDocNumber]);

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
      <style>{`
        .rpc-due-date-input::-webkit-calendar-picker-indicator { display: none !important; -webkit-appearance: none; }
        .rpc-due-date-input::-webkit-inner-spin-button, .rpc-due-date-input::-webkit-clear-button { display: none !important; }
        @keyframes rpcSpin { to { transform: rotate(360deg); } }
        .rpc-spinning { animation: rpcSpin 1s linear infinite; }
      `}</style>
      <div class="bg-[var(--white)] border border-[var(--gray-200)] rounded-[var(--radius-card)] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)]">
        <div class="flex items-center justify-between px-[var(--space-5)] py-[var(--space-4)] border-b border-[var(--gray-100)]">
          <div
            class={cn(
              'flex items-center gap-[var(--space-1-5)] px-[var(--space-3)] py-[var(--space-1-5)] rounded-[var(--radius-input)] text-[var(--text-xs)] font-[var(--font-semibold)] uppercase',
              data.documentType === 'estimate'
                ? 'bg-[var(--glass-amber-10)] text-[var(--data-amber)]'
                : 'bg-[var(--glass-primary-10)] text-[var(--blu-primary)]'
            )}
          >
            {data.documentType === 'estimate' ? (
              <FileText size={14} />
            ) : (
              <Receipt size={14} />
            )}
            <span>{data.documentType === 'estimate' ? 'Estimate' : 'Invoice'}</span>
          </div>

          {isEditingDocNumber ? (
            <input
              ref={docNumberRef}
              class="px-2 py-1 border border-[var(--blu-primary,#0066ff)] rounded-md text-xs font-mono text-[var(--gray-900)] bg-[var(--white)] outline-none w-[120px] shadow-[0_0_0_3px_rgba(0,102,255,0.1)]"
              type="text"
              value={editableDocNumber}
              onInput={(e) => setEditableDocNumber((e.target as HTMLInputElement).value)}
              onBlur={handleDocNumberBlur}
              onKeyDown={handleDocNumberKeyDown}
            />
          ) : (
            <button
              class="flex items-center gap-1.5 px-2 py-1 bg-transparent border border-transparent rounded-md cursor-pointer transition-all duration-200 hover:bg-[var(--gray-100)] hover:border-slate-200 group"
              onClick={() => {
                setEditableDocNumber(documentNumber);
                setIsEditingDocNumber(true);
              }}
            >
              <span class="text-[var(--text-xs)] font-[var(--font-mono)] text-[var(--gray-500)]">
                #{documentNumber}
              </span>
              <Pencil size={12} class="text-[var(--gray-400)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 touch-device:opacity-50" />
            </button>
          )}
        </div>

        <div class="p-4 flex flex-col gap-3">
          <div class="flex gap-4 items-start max-[480px]:flex-col max-[480px]:gap-3">
            {/* Client Side (left) */}
            <div class="flex-1 min-w-0">
              <div class="relative">
                <button
                  class={cn(
                    'flex items-center gap-3 w-full bg-transparent border-none cursor-pointer text-left transition-all duration-200 rounded-[10px] hover:bg-[var(--gray-50,#f8fafc)] active:scale-[0.99]',
                    !clientFullName && 'bg-amber-500/[0.04] -mx-3 -my-2 px-3 py-2 rounded-lg'
                  )}
                  onClick={() => {
                    setEditableClientName(clientFullName || '');
                    setIsEditingClientName(true);
                  }}
                >
                  <User size={16} class="text-[var(--gray-500)]" />
                  <div class="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span class="text-[11px] text-[var(--gray-500)] uppercase tracking-wider">
                      {t('review.client')}
                    </span>
                    <span
                      class={cn(
                        'text-[15px] text-[var(--gray-900)] font-medium bg-[var(--gray-50)] border border-[var(--gray-200)] rounded-[10px] px-3 py-1.5 inline-block transition-all duration-200',
                        !clientFullName && 'text-red-400/80 italic'
                      )}
                    >
                      {clientFullName || 'Tap to select'}
                    </span>
                    {data.client.email && (
                      <span class="text-xs text-[var(--gray-400)]">{data.client.email}</span>
                    )}
                    {data.client.phone && (
                      <span class="text-xs text-[var(--gray-400)]">{data.client.phone}</span>
                    )}
                  </div>
                  {!clientFullName ? (
                    <div class="flex items-center justify-center w-7 h-7 bg-amber-500/[0.12] rounded-lg text-[var(--data-amber)] shrink-0 ml-auto" title="Client name is required">
                      <AlertTriangle size={16} />
                    </div>
                  ) : !data.client.email ? (
                    <div class="flex items-center justify-center w-7 h-7 bg-amber-500/[0.12] rounded-lg text-[var(--data-amber)] shrink-0 ml-auto" title="Email is missing">
                      <AlertTriangle size={16} />
                    </div>
                  ) : (
                    <div class="flex items-center justify-center w-7 h-7 bg-emerald-500/[0.12] rounded-lg text-[var(--data-green)] shrink-0 ml-auto" title="Client set">
                      <Check size={16} />
                    </div>
                  )}
                </button>
              </div>

              {/* Client Suggestions for document creation (auto-shown) */}
              {!showClientDropdown &&
                showClientSuggestions &&
                clientSuggestions.length > 0 && (
                  <div class="p-3 bg-sky-500/[0.06] border border-sky-500/15 rounded-[10px] mx-[-4px] my-1">
                    <div class="flex items-center gap-1.5 mb-2.5 text-xs font-medium text-sky-600">
                      <Search size={14} />
                      <span>{t('review.didYouMean')}</span>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      {clientSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          class="flex items-center gap-1.5 px-3.5 py-2 bg-[var(--white)] border border-sky-500/30 rounded-full text-[13px] text-[var(--gray-900)] cursor-pointer transition-all duration-200 hover:bg-sky-500/10 hover:border-sky-500"
                          onClick={() => onApplyClientSuggestion(suggestion)}
                        >
                          <span class="font-medium">{suggestion.name}</span>
                          {suggestion.similarity >= 0.8 ? (
                            <span class="flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-600">{'\u2713'}</span>
                          ) : suggestion.similarity >= 0.6 ? (
                            <span class="flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-600">~</span>
                          ) : null}
                        </button>
                      ))}
                      <button
                        class="flex items-center gap-1.5 px-3.5 py-2 bg-transparent border border-[var(--gray-300)] rounded-full text-[13px] text-[var(--gray-500)] cursor-pointer transition-all duration-200 hover:bg-[var(--gray-100)] hover:border-[var(--gray-400)] hover:text-[var(--gray-700)]"
                        onClick={() => onShowClientSuggestionsChange(false)}
                      >
                        Keep "{clientFullName}"
                      </button>
                    </div>
                  </div>
                )}

              {/* Due Date (left, under client) */}
              <div class="flex items-center gap-3 mt-4">
                <Calendar size={16} class="text-[var(--gray-500)]" />
                <div class="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span class="text-[11px] text-[var(--gray-500)] uppercase tracking-wider">
                    {t('review.dueDate')}
                  </span>
                  <input
                    type="date"
                    class="rpc-due-date-input bg-[var(--gray-50)] border border-[var(--gray-200)] rounded-[10px] px-3 py-2 text-sm font-medium text-[var(--gray-900)] font-inherit cursor-pointer transition-all duration-200 appearance-none w-[160px] overflow-hidden hover:border-[var(--gray-300)] hover:bg-white focus:outline-none focus:border-[var(--blu-primary,#0066ff)] focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,102,255,0.1)]"
                    value={data.dueDate || ''}
                    onInput={(e) =>
                      handleDueDateChange((e.target as HTMLInputElement).value)
                    }
                  />
                </div>
              </div>
            </div>

            {/* Total Side (right) */}
            <div class="shrink-0 flex flex-col gap-2 items-end text-right max-[480px]:items-start max-[480px]:text-left max-[480px]:w-full">
              <div class={cn('flex items-center gap-2', calculatedTotal <= 0 && 'text-[var(--data-amber)]')}>
                <DollarSign size={16} class="text-[var(--gray-500)]" />
                <div class="flex flex-col gap-0.5 flex-1 min-w-0 max-[480px]:items-start">
                  <span class="text-[11px] text-[var(--gray-500)] uppercase tracking-wider">
                    {t('review.total')}{' '}
                    <span class="font-normal text-[11px] text-[var(--gray-400)]">{t('review.fromLineItems')}</span>
                  </span>
                  <span
                    class={cn(
                      'text-lg font-bold text-[var(--data-green)]',
                      calculatedTotal <= 0 && 'text-[var(--data-amber)]'
                    )}
                  >
                    {formatCurrency(calculatedTotal)}
                  </span>
                </div>
                {calculatedTotal <= 0 ? (
                  <div class="flex items-center justify-center w-7 h-7 bg-amber-500/[0.12] rounded-lg text-[var(--data-amber)] shrink-0 ml-auto" title="Total must be greater than $0">
                    <AlertTriangle size={16} />
                  </div>
                ) : (
                  <div class="flex items-center justify-center w-7 h-7 bg-emerald-500/[0.12] rounded-lg text-[var(--data-green)] shrink-0 ml-auto" title="Valid amount">
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
        <div class="flex flex-col gap-3.5 pt-1">
          <div class="flex flex-col gap-1">
            <label for="edit-client-name" class="text-[11px] font-semibold text-[var(--gray-500)] uppercase tracking-wider">
              <User size={12} class="inline align-[-2px] mr-1" />
              {t('review.client')}
            </label>
            <div class="relative">
              <input
                ref={clientNameRef}
                id="edit-client-name"
                class="text-sm text-[var(--gray-900)] border border-[var(--gray-200)] rounded-[10px] px-3 py-2.5 pr-9 bg-white w-full font-inherit transition-all duration-200 focus:outline-none focus:border-[var(--blu-primary,#0066ff)] focus:shadow-[0_0_0_3px_rgba(0,102,255,0.1)] placeholder:text-[var(--gray-400)]"
                type="text"
                value={editableClientName}
                onInput={(e) =>
                  handleClientNameInput((e.target as HTMLInputElement).value)
                }
                onKeyDown={handleClientNameKeyDown}
                onFocus={handleClientNameFocus}
                placeholder={t('review.selectDifferentClient')}
              />
              <Search size={14} class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gray-400)] pointer-events-none" />
            </div>

            {showClientDropdown &&
              (isSearchingClients || clientDropdownResults.length > 0) && (
                <div class="flex flex-col border border-[var(--gray-200)] rounded-[10px] overflow-hidden bg-white max-h-[180px] overflow-y-auto">
                  {isSearchingClients ? (
                    <div class="p-5 text-center text-[var(--gray-500)] text-sm flex items-center justify-center gap-2">
                      <Loader2 size={16} class="rpc-spinning" />
                      <span>{t('review.searching')}</span>
                    </div>
                  ) : (
                    clientDropdownResults.map((client) => (
                      <button
                        key={client.id}
                        class="flex items-center justify-between w-full px-3.5 py-3 bg-transparent border-none border-b border-[var(--gray-100)] cursor-pointer text-left transition-[background] duration-200 hover:bg-[var(--gray-50,#f8fafc)] active:bg-[var(--gray-100,#f1f5f9)] last:border-b-0 rounded-none"
                        onClick={() => handleDropdownSelect(client)}
                      >
                        <div class="flex flex-col gap-0.5">
                          <span class="text-sm font-medium text-[var(--gray-900)]">{client.name}</span>
                          {client.email && (
                            <span class="text-xs text-[var(--gray-500)]">{client.email}</span>
                          )}
                          {client.phone && (
                            <span class="text-xs text-[var(--gray-500)]">{client.phone}</span>
                          )}
                          {client.address && (
                            <span class="text-xs text-[var(--gray-500)]">
                              {client.address.length > 40
                                ? `${client.address.slice(0, 40)}...`
                                : client.address}
                            </span>
                          )}
                        </div>
                        {client.similarity >= 0.8 ? (
                          <span class="px-2 py-1 rounded-md text-[11px] font-medium bg-emerald-500/[0.12] text-[var(--data-green)]">
                            {t('review.highMatch')}
                          </span>
                        ) : client.similarity >= 0.6 ? (
                          <span class="px-2 py-1 rounded-md text-[11px] font-medium bg-amber-500/[0.12] text-[var(--data-amber)]">
                            {t('review.goodMatch')}
                          </span>
                        ) : null}
                      </button>
                    ))
                  )}
                </div>
              )}
          </div>

          <div class="flex flex-col gap-1">
            <label for="edit-client-email" class="text-[11px] font-semibold text-[var(--gray-500)] uppercase tracking-wider">
              <Mail size={12} class="inline align-[-2px] mr-1" />
              {t('review.email')}
            </label>
            <input
              id="edit-client-email"
              class="text-sm text-[var(--gray-900)] border border-[var(--gray-200)] rounded-[10px] px-3 py-2.5 bg-white w-full font-inherit transition-all duration-200 focus:outline-none focus:border-[var(--blu-primary,#0066ff)] focus:shadow-[0_0_0_3px_rgba(0,102,255,0.1)] placeholder:text-[var(--gray-400)]"
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

          <div class="flex flex-col gap-1">
            <label for="edit-client-phone" class="text-[11px] font-semibold text-[var(--gray-500)] uppercase tracking-wider">
              <Phone size={12} class="inline align-[-2px] mr-1" />
              Phone
            </label>
            <input
              id="edit-client-phone"
              class="text-sm text-[var(--gray-900)] border border-[var(--gray-200)] rounded-[10px] px-3 py-2.5 bg-white w-full font-inherit transition-all duration-200 focus:outline-none focus:border-[var(--blu-primary,#0066ff)] focus:shadow-[0_0_0_3px_rgba(0,102,255,0.1)] placeholder:text-[var(--gray-400)]"
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

          <div class="flex flex-col gap-1">
            <label for="edit-client-address" class="text-[11px] font-semibold text-[var(--gray-500)] uppercase tracking-wider">
              <MapPin size={12} class="inline align-[-2px] mr-1" />
              Address
            </label>
            <input
              id="edit-client-address"
              class="text-sm text-[var(--gray-900)] border border-[var(--gray-200)] rounded-[10px] px-3 py-2.5 bg-white w-full font-inherit transition-all duration-200 focus:outline-none focus:border-[var(--blu-primary,#0066ff)] focus:shadow-[0_0_0_3px_rgba(0,102,255,0.1)] placeholder:text-[var(--gray-400)]"
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

          <button
            class="flex items-center justify-center gap-1.5 px-5 py-3 border-none rounded-xl bg-[var(--blu-primary,#0066ff)] text-white text-sm font-semibold cursor-pointer transition-all duration-150 shadow-[0_2px_8px_rgba(0,102,255,0.25)] mt-1 hover:bg-[#0055dd] hover:shadow-[0_4px_12px_rgba(0,102,255,0.3)] active:scale-[0.98]"
            onClick={handleDoneEditClient}
          >
            <Check size={14} />
            {t('common.done')}
          </button>
        </div>
      </ReviewModal>
    </>
  );
}
