import { useState, useMemo, useEffect, useCallback } from 'preact/hooks';
import {
  FileText,
  Receipt,
  Search,
  ChevronLeft,
  Calculator,
  X,
  Mic,
  Trash2,
  Pencil,
  ChevronDown,
  Send,
  Share2,
  Check as CheckIcon,
} from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import { useToastStore } from '@/stores/toastStore';
import { useAppStateStore } from '@/stores/appStateStore';
import { groupDocumentsByMonth, formatSmartTime } from '@/lib/utils/format';
import { DocumentListSkeleton } from '@/components/documents/DocumentListSkeleton';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { QuickSendModal } from '@/components/modals/QuickSendModal';
import { ShareWithAccountantModal } from '@/components/modals/ShareWithAccountantModal';
import { SwipeableCard } from '@/components/gestures/SwipeableCard';
import { navigateTo } from '@/lib/navigation';
import { deleteDocument, sendDocument } from '@/lib/api/documents';
import { cn } from '@/lib/utils';

/* ─── Types ─── */

interface LineItem {
  description?: string;
  quantity?: number;
  rate?: number;
  total?: number;
}

interface Document {
  id: string;
  type: 'invoice' | 'estimate' | 'contract';
  documentType: string;
  documentNumber?: string | null;
  title: string;
  client: string;
  clientEmail?: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
  [key: string]: unknown;
  amount?: number;
  status: string;
  lineItems?: LineItem[];
}

interface Summaries {
  totalInvoices: number;
  totalEstimates: number;
  totalContracts: number;
  clients: string[];
}

interface DocumentListProps {
  documents: Document[];
  summaries: Summaries;
  activeType: string;
  initialStatusFilter: string | null;
  initialClientFilter: string | null;
}

/* ─── Helpers ─── */

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getDocNumber(doc: Document): string {
  if (doc.documentNumber) return doc.documentNumber;
  const prefix = doc.type === 'invoice' ? 'INV' : doc.type === 'estimate' ? 'EST' : 'CON';
  const year = new Date(doc.date).getFullYear();
  const suffix = doc.id.slice(-4).toUpperCase();
  return `${prefix}-${year}-${suffix}`;
}

function parseSearchQuery(query: string) {
  const lowerQuery = query.toLowerCase();
  let parsedType: string | null = null;
  let parsedClient: string | null = null;
  let parsedStatus: string | null = null;
  let remainingQuery = query;

  if (lowerQuery.includes('estimate') || lowerQuery.includes('presupuesto')) {
    parsedType = 'estimate';
    remainingQuery = remainingQuery.replace(/estimates?|presupuestos?/gi, '').trim();
  } else if (lowerQuery.includes('invoice') || lowerQuery.includes('factura')) {
    parsedType = 'invoice';
    remainingQuery = remainingQuery.replace(/invoices?|facturas?/gi, '').trim();
  } else if (lowerQuery.includes('contract') || lowerQuery.includes('contrato')) {
    parsedType = 'contract';
    remainingQuery = remainingQuery.replace(/contracts?|contratos?/gi, '').trim();
  }

  const statusKeywords = [
    'draft', 'sent', 'paid', 'pending', 'overdue', 'signed',
    'borrador', 'enviado', 'pagado', 'pendiente', 'vencido', 'firmado',
  ];
  const statusMap: Record<string, string> = {
    borrador: 'draft',
    enviado: 'sent',
    pagado: 'paid',
    pendiente: 'pending',
    vencido: 'overdue',
    firmado: 'signed',
  };
  for (const status of statusKeywords) {
    if (lowerQuery.includes(status)) {
      parsedStatus = statusMap[status] || status;
      remainingQuery = remainingQuery.replace(new RegExp(status, 'gi'), '').trim();
      break;
    }
  }

  const clientPatterns = [
    /(?:to|for|from|para|de)\s+(\w+)/i,
    /client[:\s]+(\w+)/i,
    /cliente[:\s]+(\w+)/i,
  ];
  for (const pattern of clientPatterns) {
    const match = remainingQuery.match(pattern);
    if (match) {
      parsedClient = match[1];
      remainingQuery = remainingQuery.replace(match[0], '').trim();
      break;
    }
  }

  remainingQuery = remainingQuery
    .replace(/\b(sent|was|were|that|the|all|show|find|get|buscar|mostrar|todos|enviados?)\b/gi, '')
    .trim();

  return { type: parsedType, client: parsedClient, status: parsedStatus, textQuery: remainingQuery };
}

/* ─── Tabs sub-component ─── */

interface TabItem {
  id: string;
  label: string;
}

function TypeTabs({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
}) {
  return (
    <div class="flex gap-1 p-[3px] bg-white/70 backdrop-blur-[16px] rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          class={cn(
            'flex-1 py-2 px-3 border-none rounded-[10px] text-sm font-medium text-[var(--gray-500,#64748b)] bg-transparent cursor-pointer transition-all duration-200 ease-in-out',
            activeTab === tab.id && 'bg-white/80 text-[var(--gray-900,#0f172a)] font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.08)]',
          )}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Main component ─── */

export function DocumentList({
  documents,
  summaries,
  activeType,
  initialStatusFilter,
  initialClientFilter,
}: DocumentListProps) {
  const { t, locale } = useI18nStore();
  const toast = useToastStore();
  const { setSelectMode: setGlobalSelectMode } = useAppStateStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState(activeType || 'all');
  const [statusFilter, setStatusFilter] = useState<string | null>(initialStatusFilter);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'client' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
  const [isDesktop, setIsDesktop] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  // Multi-select state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [showBatchSendConfirm, setShowBatchSendConfirm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const typeTabs: TabItem[] = useMemo(
    () => [
      { id: 'all', label: t('documents.allTab') },
      { id: 'invoice', label: t('documents.invoicesTab') },
      { id: 'estimate', label: t('documents.estimatesTab') },
    ],
    [t],
  );

  const handleTypeChange = useCallback((tabId: string) => {
    setTypeFilter(tabId);
    const url = tabId === 'all'
      ? '/dashboard/documents'
      : `/dashboard/documents?type=${tabId}`;
    window.history.replaceState(null, '', url);
  }, []);

  const toggleMonth = useCallback((month: string) => {
    setCollapsedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(month)) {
        next.delete(month);
      } else {
        next.add(month);
      }
      return next;
    });
  }, []);

  const filteredDocs = useMemo(() => {
    const parsed = parseSearchQuery(searchQuery);

    const filtered = documents.filter((doc) => {
      const effectiveType = parsed.type || (typeFilter !== 'all' ? typeFilter : null);
      const matchesTab = !effectiveType || doc.type === effectiveType;
      const effectiveStatus = parsed.status || statusFilter;
      const matchesStatus = !effectiveStatus || doc.status === effectiveStatus;
      const matchesClient =
        !parsed.client || doc.client.toLowerCase().includes(parsed.client.toLowerCase());

      if (parsed.textQuery) {
        const query = parsed.textQuery.toLowerCase();
        const matchesTitle = doc.title.toLowerCase().includes(query);
        const matchesClientText = doc.client.toLowerCase().includes(query);
        const docNumber = getDocNumber(doc).toLowerCase();
        const matchesDocNumber = docNumber.includes(query);
        const amountStr = doc.amount ? doc.amount.toString() : '';
        const matchesAmount = amountStr.includes(query.replace(/[$,]/g, ''));

        const dateObj = new Date(doc.date);
        const dateFormats = [
          dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toLowerCase(),
          dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase(),
          dateObj.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toLowerCase(),
          dateObj.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }).toLowerCase(),
          dateObj.getFullYear().toString(),
          (dateObj.getMonth() + 1).toString().padStart(2, '0'),
          dateObj.getDate().toString(),
        ];
        const matchesDate = dateFormats.some((fmt) => fmt.includes(query));

        const matchesLineItems = doc.lineItems?.some(
          (item) => item.description && item.description.toLowerCase().includes(query),
        );

        const matchesText =
          matchesTitle || matchesClientText || matchesDocNumber || matchesAmount || matchesDate || matchesLineItems;

        if (!matchesText) return false;
      }

      return matchesTab && matchesStatus && matchesClient;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.date).getTime() - new Date(a.date).getTime();
          break;
        case 'amount':
          comparison = (b.amount || 0) - (a.amount || 0);
          break;
        case 'client':
          comparison = a.client.localeCompare(b.client);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === 'desc' ? comparison : -comparison;
    });
  }, [documents, searchQuery, typeFilter, statusFilter, sortBy, sortOrder]);

  const groupedDocs = useMemo(
    () => groupDocumentsByMonth(filteredDocs, locale),
    [filteredDocs, locale],
  );

  const selectedCount = selectedIds.size;
  const isAllSelected = selectedCount > 0 && selectedCount === filteredDocs.length;
  const sendableSelected = useMemo(
    () =>
      filteredDocs.filter(
        (d) => selectedIds.has(d.id) && d.clientEmail && !['sent', 'paid'].includes(d.status),
      ),
    [filteredDocs, selectedIds],
  );

  const hasActiveFilters = statusFilter !== null || searchQuery !== '';

  const clearFilters = useCallback(() => {
    setStatusFilter(null);
    setSearchQuery('');
  }, []);

  const enterSelectMode = useCallback(() => {
    setSelectMode(true);
    setSelectedIds(new Set());
    setGlobalSelectMode(true);
  }, [setGlobalSelectMode]);

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
    setGlobalSelectMode(false);
  }, [setGlobalSelectMode]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDocs.map((d) => d.id)));
    }
  }, [filteredDocs, isAllSelected]);

  const toggleSelectMonth = useCallback(
    (monthDocs: Document[]) => {
      setSelectedIds((prev) => {
        const monthIds = monthDocs.map((d) => d.id);
        const allSelected = monthIds.every((id) => prev.has(id));
        const next = new Set(prev);
        if (allSelected) {
          monthIds.forEach((id) => next.delete(id));
        } else {
          monthIds.forEach((id) => next.add(id));
        }
        return next;
      });
    },
    [],
  );

  const handleBatchDelete = useCallback(async () => {
    setIsBatchProcessing(true);
    const selected = filteredDocs.filter((d) => selectedIds.has(d.id));
    try {
      const results = await Promise.allSettled(selected.map((d) => deleteDocument(d.id, d.type)));
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed > 0) {
        toast.error(t('documents.deleteFailed', { n: String(failed) }));
      } else {
        toast.success(t('documents.deleted', { n: String(selected.length) }));
      }
      setShowBatchDeleteConfirm(false);
      exitSelectMode();
      window.location.reload();
    } catch {
      toast.error(t('documents.deleteError'));
      setIsBatchProcessing(false);
    }
  }, [filteredDocs, selectedIds, toast, exitSelectMode]);

  const handleBatchSend = useCallback(async () => {
    if (sendableSelected.length === 0) return;
    setIsBatchProcessing(true);
    try {
      const results = await Promise.allSettled(
        sendableSelected.map((d) =>
          sendDocument(d.id, d.type, 'email', { email: d.clientEmail!, name: d.client }),
        ),
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed > 0) {
        toast.error(t('documents.sendFailed', { n: String(failed) }));
      } else {
        toast.success(t('documents.sentCount', { n: String(sendableSelected.length) }));
      }
      setShowBatchSendConfirm(false);
      exitSelectMode();
      window.location.reload();
    } catch {
      toast.error(t('documents.sendError'));
      setIsBatchProcessing(false);
    }
  }, [sendableSelected, toast, exitSelectMode]);

  const openDeleteModal = useCallback((doc: Document) => {
    setSelectedDocument(doc);
    setShowDeleteModal(true);
  }, []);

  const openSendModal = useCallback((doc: Document) => {
    if (['sent', 'paid'].includes(doc.status)) return;
    setSelectedDocument(doc);
    setShowSendModal(true);
  }, []);

  const handleDelete = useCallback(async (documentId: string, documentType: string) => {
    await deleteDocument(documentId, documentType);
    window.location.reload();
  }, []);

  const handleSendSuccess = useCallback(() => {
    window.location.reload();
  }, []);

  const resultsCountText = useMemo(() => {
    const count = filteredDocs.length;
    const base = count === 1
      ? t('documents.documentCount', { n: '1' })
      : t('documents.documentsCount', { n: String(count) });
    return base;
  }, [filteredDocs.length, t]);

  return (
    <div class="h-screen flex flex-col bg-transparent overflow-hidden px-[var(--page-padding-x,20px)] pt-[calc(12px+var(--safe-area-top,0px))] pb-0 box-border">

      {/* Header */}
      <header class="flex items-center justify-between mb-5 shrink-0 max-w-[var(--page-max-width,600px)] mx-auto w-full">
        {selectMode ? (
          <>
            <button class="w-[var(--btn-height-md,44px)] h-[var(--btn-height-md,44px)] flex items-center justify-center bg-[var(--glass-white-50,rgba(255,255,255,0.5))] backdrop-blur-[12px] border-none rounded-[var(--radius-button,14px)] text-[var(--gray-600,#475569)] cursor-pointer" onClick={exitSelectMode} aria-label="Cancel selection">
              <X size={22} strokeWidth={2} />
            </button>
            <h1 class="font-[var(--font-display,system-ui)] text-lg font-bold text-[var(--gray-900,#0f172a)] m-0 tracking-[-0.02em]">{t('common.selected', { n: String(selectedCount) })}</h1>
            <button class="w-16 h-11 flex items-center justify-center bg-transparent border-none text-sm font-semibold text-[var(--blu-primary,#0066ff)] cursor-pointer" onClick={toggleSelectAll}>
              {isAllSelected ? t('common.deselect') : t('common.all')}
            </button>
          </>
        ) : (
          <>
            <button
              class="w-[var(--btn-height-md,44px)] h-[var(--btn-height-md,44px)] flex items-center justify-center bg-[var(--glass-white-50,rgba(255,255,255,0.5))] backdrop-blur-[12px] border-none rounded-[var(--radius-button,14px)] text-[var(--gray-600,#475569)] cursor-pointer"
              onClick={() => navigateTo('/dashboard')}
              aria-label={t('common.back')}
            >
              <ChevronLeft size={22} strokeWidth={2} />
            </button>
            <h1 class="font-[var(--font-display,system-ui)] text-lg font-bold text-[var(--gray-900,#0f172a)] m-0 tracking-[-0.02em]">{t('documents.title')}</h1>
            {filteredDocs.length > 0 && (
              <button class="w-11 h-11 flex items-center justify-center bg-transparent border-none text-sm font-semibold text-[var(--blu-primary,#0066ff)] cursor-pointer" onClick={enterSelectMode}>
                {t('common.select')}
              </button>
            )}
          </>
        )}
      </header>

      {/* Search */}
      <div class="relative w-full max-w-[var(--page-max-width,600px)] mx-auto flex items-center mb-3 shrink-0">
        <span class="absolute left-3.5 text-[var(--gray-400,#94a3b8)] pointer-events-none flex items-center">
          <Search size={16} strokeWidth={2} />
        </span>
        <input
          type="text"
          placeholder={t('documents.searchPlaceholder')}
          value={searchQuery}
          onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
          class="w-full py-3 pr-10 pl-[42px] bg-white/70 backdrop-blur-[16px] border-none rounded-[var(--radius-input,12px)] text-[var(--gray-900,#0f172a)] text-[15px] outline-none box-border shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
        />
        {searchQuery && (
          <button
            class="absolute right-3 w-6 h-6 flex items-center justify-center bg-[var(--gray-200,#e2e8f0)] border-none rounded-full text-[var(--gray-500,#64748b)] cursor-pointer"
            onClick={() => setSearchQuery('')}
            aria-label={t('documents.clearSearch')}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Type Filter Tabs */}
      <div class="mb-3 shrink-0 max-w-[var(--page-max-width,600px)] mx-auto w-full">
        <TypeTabs tabs={typeTabs} activeTab={typeFilter} onChange={handleTypeChange} />
      </div>

      {/* Document List */}
      <div class="flex-1 overflow-y-auto overflow-x-hidden [-webkit-overflow-scrolling:touch] pb-[calc(100px+var(--safe-area-bottom,0px))] max-w-[var(--page-max-width,600px)] w-full mx-auto scrollbar-hide">
        {isLoading ? (
          <DocumentListSkeleton count={5} />
        ) : filteredDocs.length === 0 ? (
          <div class="flex flex-col items-center justify-center px-5 py-20 text-center">
            <div class="w-24 h-24 flex items-center justify-center bg-white/60 backdrop-blur-[20px] border-none rounded-full text-[var(--blu-primary,#0066ff)] mb-6 shadow-[0_8px_32px_rgba(0,102,255,0.1)]">
              <FileText size={48} strokeWidth={1.5} />
            </div>
            <h3 class="font-[var(--font-display,system-ui)] text-xl font-bold text-[var(--gray-900,#0f172a)] m-0 mb-2">
              {hasActiveFilters ? t('documents.emptyFiltered') : t('documents.emptyTitle')}
            </h3>
            <p class="text-[15px] text-[var(--gray-500,#64748b)] m-0 mb-7 max-w-[260px] leading-relaxed">
              {hasActiveFilters ? t('documents.tryAdjusting') : t('documents.emptyDescription')}
            </p>
            {hasActiveFilters ? (
              <button class="flex items-center gap-2 py-3.5 px-6 border-none rounded-[var(--radius-button,14px)] text-[15px] font-semibold cursor-pointer bg-[var(--gray-100,#f1f5f9)] text-[var(--gray-600,#475569)]" onClick={clearFilters}>
                <X size={18} strokeWidth={2} />
                {t('documents.clearFilters')}
              </button>
            ) : (
              <button
                class="flex items-center gap-2 py-3.5 px-6 border-none rounded-[var(--radius-button,14px)] text-[15px] font-semibold cursor-pointer bg-[var(--blu-primary,#0066ff)] text-white shadow-[0_4px_24px_rgba(0,102,255,0.35)]"
                onClick={() => navigateTo('/dashboard')}
              >
                <Mic size={18} strokeWidth={2} />
                {t('documents.createDocument')}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Results header */}
            <div class="flex items-center justify-between mb-2">
              <span class="text-[13px] text-[var(--gray-500,#64748b)]">
                {resultsCountText}
                {hasActiveFilters && (
                  <span class="text-[var(--blu-primary,#0066ff)]"> ({t('documents.filtered')})</span>
                )}
              </span>
            </div>

            {/* Grouped Document List */}
            <div class="flex flex-col gap-6">
              {[...groupedDocs.entries()].map(([month, docs]) => (
                <div key={month} class="flex flex-col gap-2">
                  {/* Month header */}
                  <div class="flex items-center gap-2">
                    {selectMode && (
                      <button
                        class="flex items-center justify-center p-1 bg-transparent border-none cursor-pointer shrink-0"
                        onClick={() => toggleSelectMonth(docs)}
                        aria-label={`Select all in ${month}`}
                      >
                        <div
                          class={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-150 ease-in-out',
                            docs.every((d: Document) => selectedIds.has(d.id))
                              ? 'border-2 border-[var(--blu-primary,#0066ff)] bg-[var(--blu-primary,#0066ff)] text-white'
                              : 'border-2 border-[var(--gray-300,#cbd5e1)]',
                          )}
                        >
                          {docs.every((d: Document) => selectedIds.has(d.id)) && (
                            <CheckIcon size={14} strokeWidth={3} />
                          )}
                        </div>
                      </button>
                    )}
                    <button class="flex items-center gap-2 p-1 bg-transparent border-none cursor-pointer w-fit" onClick={() => toggleMonth(month)}>
                      <span class="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--gray-500,#64748b)]">{month}</span>
                      <span class="text-[11px] font-medium text-[var(--gray-400,#94a3b8)] bg-[rgba(148,163,184,0.15)] px-2 py-0.5 rounded-[10px]">{docs.length}</span>
                      <span
                        class="flex items-center justify-center text-[var(--gray-400,#94a3b8)] transition-transform duration-200 ease-in-out"
                        style={{
                          transform: collapsedMonths.has(month) ? 'rotate(-90deg)' : 'rotate(0deg)',
                        }}
                      >
                        <ChevronDown size={16} />
                      </span>
                    </button>
                  </div>

                  {!collapsedMonths.has(month) && (
                    <div class="flex flex-col bg-white/70 backdrop-blur-[16px] border border-white/60 rounded-[var(--radius-card,20px)] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                      {docs.map((doc: Document, i: number) => (
                        <div
                          key={doc.id}
                          class={cn(
                            i < docs.length - 1 && 'border-b border-black/[0.04]',
                          )}
                        >
                          {selectMode ? (
                            <SelectableDocCard
                              doc={doc}
                              locale={locale}
                              selected={selectedIds.has(doc.id)}
                              onToggle={() => toggleSelection(doc.id)}
                            />
                          ) : isDesktop ? (
                            <DesktopDocCard
                              doc={doc}
                              locale={locale}
                              t={t}
                              onEdit={(d) =>
                                navigateTo(`/dashboard/documents/${d.id}?type=${d.type}&edit=true`)
                              }
                              onDelete={openDeleteModal}
                            />
                          ) : (
                            <SwipeableCard
                              onSwipeLeft={() => openDeleteModal(doc)}
                              onSwipeRight={() => openSendModal(doc)}
                              rightDisabled={['sent', 'paid'].includes(doc.status)}
                            >
                              <MobileDocCard
                                doc={doc}
                                locale={locale}
                                t={t}
                                onDelete={openDeleteModal}
                                onSend={openSendModal}
                              />
                            </SwipeableCard>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <DeleteConfirmModal
        open={showDeleteModal}
        document={
          selectedDocument
            ? {
                id: selectedDocument.id,
                type: selectedDocument.type,
                title: selectedDocument.title,
                client: selectedDocument.client,
                amount: selectedDocument.amount,
              }
            : null
        }
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedDocument(null);
        }}
        onConfirm={handleDelete}
      />

      <QuickSendModal
        open={showSendModal}
        document={
          selectedDocument
            ? {
                id: selectedDocument.id,
                type: selectedDocument.type,
                title: selectedDocument.title,
                client: selectedDocument.client,
                clientEmail: selectedDocument.clientEmail,
                amount: selectedDocument.amount,
              }
            : null
        }
        onClose={() => {
          setShowSendModal(false);
          setSelectedDocument(null);
        }}
        onSuccess={handleSendSuccess}
      />

      <ShareWithAccountantModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        onSuccess={() => {
          setShowShareModal(false);
          exitSelectMode();
        }}
        selectedDocumentIds={[...selectedIds]}
      />

      {/* Batch action bar */}
      {selectMode && selectedCount > 0 && (
        <div class="fixed bottom-0 left-0 right-0 px-[var(--page-padding-x,20px)] pt-3 pb-[calc(12px+var(--safe-area-bottom,0px))] bg-white/[0.92] backdrop-blur-[20px] border-t border-black/[0.06] z-[100]">
          <div class="flex gap-3 max-w-[var(--page-max-width,600px)] mx-auto">
            <button
              class="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 border-none rounded-[var(--radius-button,14px)] text-[15px] font-semibold cursor-pointer bg-red-500/10 text-red-500"
              onClick={() => setShowBatchDeleteConfirm(true)}
            >
              <Trash2 size={18} />
              {t('common.delete')} ({selectedCount})
            </button>
            <button
              class="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 border-none rounded-[var(--radius-button,14px)] text-[15px] font-semibold cursor-pointer bg-[rgba(0,102,255,0.06)] text-[var(--blu-primary,#0066ff)]"
              onClick={() => setShowShareModal(true)}
            >
              <Share2 size={18} />
              {t('accountant.share')} ({selectedCount})
            </button>
            {sendableSelected.length > 0 && (
              <button
                class="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 border-none rounded-[var(--radius-button,14px)] text-[15px] font-semibold cursor-pointer bg-[rgba(0,102,255,0.1)] text-[var(--blu-primary,#0066ff)]"
                onClick={() => setShowBatchSendConfirm(true)}
              >
                <Send size={18} />
                {t('common.send')} ({sendableSelected.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Batch delete confirmation */}
      {showBatchDeleteConfirm && (
        <BatchConfirmModal
          icon={<Trash2 size={32} />}
          iconVariant="warning"
          title={t('documents.deleteCount', { n: String(selectedCount) })}
          subtitle={t('common.cannotUndo')}
          confirmLabel={isBatchProcessing ? t('common.deleting') : t('documents.deleteConfirm', { n: String(selectedCount) })}
          confirmVariant="danger"
          isProcessing={isBatchProcessing}
          onConfirm={handleBatchDelete}
          onCancel={() => setShowBatchDeleteConfirm(false)}
        />
      )}

      {/* Batch send confirmation */}
      {showBatchSendConfirm && (
        <BatchConfirmModal
          icon={<Send size={32} />}
          iconVariant="send"
          title={t('documents.sendCount', { n: String(sendableSelected.length) })}
          subtitle={`${t('documents.sendToClients')}${selectedCount > sendableSelected.length ? ` ${t('documents.sendSkipped', { n: String(selectedCount - sendableSelected.length) })}` : ''}`}
          confirmLabel={isBatchProcessing ? t('common.sending') : t('documents.sendConfirm', { n: String(sendableSelected.length) })}
          confirmVariant="primary"
          isProcessing={isBatchProcessing}
          onConfirm={handleBatchSend}
          onCancel={() => setShowBatchSendConfirm(false)}
        />
      )}
    </div>
  );
}

/* ─── Desktop doc card ─── */

function DesktopDocCard({
  doc,
  locale,
  t,
  onEdit,
  onDelete,
}: {
  doc: Document;
  locale: string;
  t: (key: string) => string;
  onEdit: (doc: Document) => void;
  onDelete: (doc: Document) => void;
}) {
  return (
    <div class="flex items-center gap-3.5 py-3.5 px-4 bg-transparent border-none no-underline">
      <a href={`/dashboard/documents/${doc.id}?type=${doc.type}`} class="flex items-center gap-3.5 flex-1 min-w-0 no-underline">
        <DocIcon type={doc.type} />
        <div class="flex-1 flex flex-col gap-1 min-w-0">
          <span class="text-base font-semibold text-[var(--gray-900,#0f172a)] whitespace-nowrap overflow-hidden text-ellipsis">{doc.client}</span>
          <span class="text-[13px] text-[var(--gray-500,#64748b)]">
            {getDocNumber(doc)} · {formatSmartTime(doc.date, locale)}
          </span>
        </div>
      </a>
      <div class="flex items-center gap-1.5 shrink-0">
        <button
          class="w-9 h-9 flex items-center justify-center bg-[var(--glass-white-50,rgba(255,255,255,0.5))] border-none rounded-[10px] cursor-pointer text-[var(--gray-500,#64748b)]"
          onClick={() => onEdit(doc)}
          aria-label={t('common.edit')}
        >
          <Pencil size={16} />
        </button>
        <button
          class="w-9 h-9 flex items-center justify-center bg-[var(--glass-white-50,rgba(255,255,255,0.5))] border-none rounded-[10px] cursor-pointer text-[var(--gray-400,#94a3b8)]"
          onClick={() => onDelete(doc)}
          aria-label={t('common.delete')}
        >
          <Trash2 size={16} />
        </button>
      </div>
      <DocAmount doc={doc} />
    </div>
  );
}

/* ─── Mobile doc card ─── */

function MobileDocCard({
  doc,
  locale,
  t,
  onDelete,
  onSend,
}: {
  doc: Document;
  locale: string;
  t: (key: string) => string;
  onDelete: (doc: Document) => void;
  onSend: (doc: Document) => void;
}) {
  return (
    <div class="flex items-center gap-3.5 py-3.5 px-4 bg-transparent border-none no-underline">
      <a href={`/dashboard/documents/${doc.id}?type=${doc.type}`} class="flex items-center gap-3.5 flex-1 min-w-0 no-underline">
        <DocIcon type={doc.type} />
        <div class="flex-1 flex flex-col gap-1 min-w-0">
          <span class="text-base font-semibold text-[var(--gray-900,#0f172a)] whitespace-nowrap overflow-hidden text-ellipsis">{doc.client}</span>
          <span class="text-[13px] text-[var(--gray-500,#64748b)]">
            {getDocNumber(doc)} · {formatSmartTime(doc.date, locale)}
          </span>
        </div>
      </a>
      <div class="flex items-center gap-1.5 shrink-0">
        {!['sent', 'paid'].includes(doc.status) && (
          <button
            class="w-9 h-9 flex items-center justify-center bg-[var(--glass-white-50,rgba(255,255,255,0.5))] border-none rounded-[10px] cursor-pointer text-[var(--gray-500,#64748b)]"
            onClick={() => onSend(doc)}
            aria-label="Send"
          >
            <FileText size={16} />
          </button>
        )}
        <button
          class="w-9 h-9 flex items-center justify-center bg-[var(--glass-white-50,rgba(255,255,255,0.5))] border-none rounded-[10px] cursor-pointer text-[var(--gray-400,#94a3b8)]"
          onClick={() => onDelete(doc)}
          aria-label={t('common.delete')}
        >
          <Trash2 size={16} />
        </button>
      </div>
      <DocAmount doc={doc} />
    </div>
  );
}

/* ─── Shared sub-components ─── */

function DocIcon({ type }: { type: Document['type'] }) {
  const iconClass = cn(
    'w-12 h-12 flex items-center justify-center rounded-[var(--radius-button,14px)] shrink-0',
    type === 'invoice' && 'bg-[rgba(52,199,89,0.12)] text-[#34C759]',
    type === 'estimate' && 'bg-[rgba(0,102,255,0.1)] text-[#0066FF]',
    type === 'contract' && 'bg-[rgba(0,102,255,0.08)] text-[var(--blu-primary,#0066ff)]',
  );

  return (
    <div class={iconClass}>
      {type === 'invoice' ? (
        <Receipt size={20} strokeWidth={1.5} />
      ) : type === 'estimate' ? (
        <Calculator size={20} strokeWidth={1.5} />
      ) : (
        <FileText size={20} strokeWidth={1.5} />
      )}
    </div>
  );
}

function DocAmount({ doc }: { doc: Document }) {
  if ((doc.type !== 'invoice' && doc.type !== 'estimate') || !doc.amount) return null;
  return (
    <div class="flex items-center shrink-0 ml-auto">
      <span class="text-base font-semibold text-[var(--data-green,#10b981)]">{formatAmount(doc.amount)}</span>
    </div>
  );
}

/* ─── Selectable doc card (multi-select mode) ─── */

function SelectableDocCard({
  doc,
  locale,
  selected,
  onToggle,
}: {
  doc: Document;
  locale: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      class="flex items-center gap-3 py-3.5 px-4 bg-transparent border-none w-full text-left cursor-pointer"
      onClick={onToggle}
      role="checkbox"
      aria-checked={selected}
    >
      <div
        class={cn(
          'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-150 ease-in-out',
          selected
            ? 'border-2 border-[var(--blu-primary,#0066ff)] bg-[var(--blu-primary,#0066ff)] text-white'
            : 'border-2 border-[var(--gray-300,#cbd5e1)]',
        )}
      >
        {selected && <CheckIcon size={14} strokeWidth={3} />}
      </div>
      <DocIcon type={doc.type} />
      <div class="flex-1 flex flex-col gap-1 min-w-0">
        <span class="text-base font-semibold text-[var(--gray-900,#0f172a)] whitespace-nowrap overflow-hidden text-ellipsis">{doc.client}</span>
        <span class="text-[13px] text-[var(--gray-500,#64748b)]">
          {getDocNumber(doc)} · {formatSmartTime(doc.date, locale)}
        </span>
      </div>
      <DocAmount doc={doc} />
    </button>
  );
}

/* ─── Batch confirm modal ─── */

function BatchConfirmModal({
  icon,
  iconVariant,
  title,
  subtitle,
  confirmLabel,
  confirmVariant,
  isProcessing,
  onConfirm,
  onCancel,
}: {
  icon: preact.JSX.Element;
  iconVariant: 'warning' | 'send';
  title: string;
  subtitle: string;
  confirmLabel: string;
  confirmVariant: 'danger' | 'primary';
  isProcessing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <style>{batchSpinKeyframes}</style>
      <button
        class="fixed inset-0 bg-black/50 backdrop-blur-[4px] z-[1100] border-none cursor-default"
        onClick={() => !isProcessing && onCancel()}
        aria-label="Close"
      />
      <div class="fixed inset-0 flex items-center justify-center z-[1101] p-5" role="dialog" aria-modal="true">
        <div class="relative bg-white/[0.98] backdrop-blur-[20px] rounded-[var(--radius-lg,20px)] pt-8 pb-6 px-6 max-w-[380px] w-full shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
          <div class="flex flex-col items-center text-center">
            <div
              class={cn(
                'w-[72px] h-[72px] flex items-center justify-center rounded-full mb-4',
                iconVariant === 'warning' && 'bg-red-500/10 text-red-500',
                iconVariant === 'send' && 'bg-[rgba(0,102,255,0.1)] text-[var(--blu-primary,#0066ff)]',
              )}
            >
              {icon}
            </div>
            <h2 class="font-[var(--font-display,system-ui)] text-xl font-bold text-[var(--gray-900,#0f172a)] m-0 mb-2">{title}</h2>
            <p class="text-sm text-[var(--gray-500,#64748b)] m-0 mb-6 leading-relaxed">{subtitle}</p>
            <div class="flex gap-3 w-full">
              <button
                class="flex-1 py-3.5 px-5 border-none rounded-xl text-[15px] font-semibold cursor-pointer flex items-center justify-center gap-2 bg-[var(--gray-100,#f1f5f9)] text-[var(--gray-700,#334155)]"
                onClick={onCancel}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                class={cn(
                  'flex-1 py-3.5 px-5 border-none rounded-xl text-[15px] font-semibold flex items-center justify-center gap-2',
                  confirmVariant === 'danger' && 'bg-red-500 text-white',
                  confirmVariant === 'primary' && 'bg-[var(--blu-primary,#0066ff)] text-white',
                  isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                )}
                onClick={onConfirm}
                disabled={isProcessing}
              >
                {isProcessing && <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block [animation:batchModalSpin_0.8s_linear_infinite]" />}
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const batchSpinKeyframes = `
@keyframes batchModalSpin {
  to { transform: rotate(360deg); }
}
`;
