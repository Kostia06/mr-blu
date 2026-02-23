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
  Check as CheckIcon,
} from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import { useToastStore } from '@/stores/toastStore';
import { useAppStateStore } from '@/stores/appStateStore';
import { groupDocumentsByMonth, formatSmartTime } from '@/lib/utils/format';
import { DocumentListSkeleton } from '@/components/documents/DocumentListSkeleton';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { QuickSendModal } from '@/components/modals/QuickSendModal';
import { SwipeableCard } from '@/components/gestures/SwipeableCard';
import { navigateTo } from '@/lib/navigation';
import { deleteDocument, sendDocument } from '@/lib/api/documents';

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
    <div style={tabStyles.wrapper}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          style={{
            ...tabStyles.tab,
            ...(activeTab === tab.id ? tabStyles.tabActive : {}),
          }}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

const tabStyles: Record<string, Record<string, string>> = {
  wrapper: {
    display: 'flex',
    gap: '4px',
    padding: '3px',
    background: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '12px',
  },
  tab: {
    flex: '1',
    padding: '8px 12px',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--gray-500, #64748b)',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  tabActive: {
    background: 'rgba(255, 255, 255, 0.8)',
    color: 'var(--gray-900, #0f172a)',
    fontWeight: '600',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
  },
};

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
        toast.error(`Failed to delete ${failed} document(s)`);
      } else {
        toast.success(`Deleted ${selected.length} document(s)`);
      }
      setShowBatchDeleteConfirm(false);
      exitSelectMode();
      window.location.reload();
    } catch {
      toast.error('Failed to delete documents');
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
        toast.error(`Failed to send ${failed} document(s)`);
      } else {
        toast.success(`Sent ${sendableSelected.length} document(s)`);
      }
      setShowBatchSendConfirm(false);
      exitSelectMode();
      window.location.reload();
    } catch {
      toast.error('Failed to send documents');
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
    <div style={styles.page}>
      <style>{pageKeyframes}</style>

      {/* Header */}
      <header style={styles.header}>
        {selectMode ? (
          <>
            <button style={styles.backBtn} onClick={exitSelectMode} aria-label="Cancel selection">
              <X size={22} strokeWidth={2} />
            </button>
            <h1 style={styles.pageTitle}>{selectedCount} selected</h1>
            <button style={styles.selectAllBtn} onClick={toggleSelectAll}>
              {isAllSelected ? 'Deselect' : 'All'}
            </button>
          </>
        ) : (
          <>
            <button
              style={styles.backBtn}
              onClick={() => navigateTo('/dashboard')}
              aria-label={t('common.back')}
            >
              <ChevronLeft size={22} strokeWidth={2} />
            </button>
            <h1 style={styles.pageTitle}>{t('documents.title')}</h1>
            {filteredDocs.length > 0 ? (
              <button style={styles.selectBtn} onClick={enterSelectMode}>
                Select
              </button>
            ) : (
              <div style={styles.headerSpacer} />
            )}
          </>
        )}
      </header>

      {/* Search */}
      <div style={styles.searchWrapper}>
        <span style={styles.searchIcon}>
          <Search size={16} strokeWidth={2} />
        </span>
        <input
          type="text"
          placeholder={t('documents.searchPlaceholder')}
          value={searchQuery}
          onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
          style={styles.searchInput}
        />
        {searchQuery && (
          <button
            style={styles.clearSearch}
            onClick={() => setSearchQuery('')}
            aria-label={t('documents.clearSearch')}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Type Filter Tabs */}
      <div style={styles.typeTabsWrapper}>
        <TypeTabs tabs={typeTabs} activeTab={typeFilter} onChange={handleTypeChange} />
      </div>

      {/* Document List */}
      <div style={styles.contentScroll}>
        {isLoading ? (
          <DocumentListSkeleton count={5} />
        ) : filteredDocs.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <FileText size={48} strokeWidth={1.5} />
            </div>
            <h3 style={styles.emptyTitle}>
              {hasActiveFilters ? t('documents.emptyFiltered') : t('documents.emptyTitle')}
            </h3>
            <p style={styles.emptySubtitle}>
              {hasActiveFilters ? t('documents.tryAdjusting') : t('documents.emptyDescription')}
            </p>
            {hasActiveFilters ? (
              <button style={styles.actionBtnSecondary} onClick={clearFilters}>
                <X size={18} strokeWidth={2} />
                {t('documents.clearFilters')}
              </button>
            ) : (
              <button
                style={styles.actionBtnPrimary}
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
            <div style={styles.resultsHeader}>
              <span style={styles.resultsCount}>
                {resultsCountText}
                {hasActiveFilters && (
                  <span style={styles.filteredLabel}> ({t('documents.filtered')})</span>
                )}
              </span>
            </div>

            {/* Grouped Document List */}
            <div style={styles.docList}>
              {[...groupedDocs.entries()].map(([month, docs]) => (
                <div key={month} style={styles.monthGroup}>
                  {/* Month header */}
                  <div style={styles.monthHeaderRow}>
                    {selectMode && (
                      <button
                        style={styles.monthSelectBtn}
                        onClick={() => toggleSelectMonth(docs)}
                        aria-label={`Select all in ${month}`}
                      >
                        <div
                          style={
                            docs.every((d: Document) => selectedIds.has(d.id))
                              ? styles.checkboxSelected
                              : styles.checkboxEmpty
                          }
                        >
                          {docs.every((d: Document) => selectedIds.has(d.id)) && (
                            <CheckIcon size={14} strokeWidth={3} />
                          )}
                        </div>
                      </button>
                    )}
                    <button style={styles.monthHeaderBtn} onClick={() => toggleMonth(month)}>
                      <span style={styles.monthLabel}>{month}</span>
                      <span style={styles.monthCount}>{docs.length}</span>
                      <span
                        style={{
                          ...styles.monthChevron,
                          transform: collapsedMonths.has(month) ? 'rotate(-90deg)' : 'rotate(0deg)',
                        }}
                      >
                        <ChevronDown size={16} />
                      </span>
                    </button>
                  </div>

                  {!collapsedMonths.has(month) && (
                    <div style={styles.monthDocsContainer}>
                      {docs.map((doc: Document, i: number) => (
                        <div
                          key={doc.id}
                          style={{
                            ...styles.docCardWrapper,
                            borderBottom:
                              i < docs.length - 1 ? '1px solid rgba(0, 0, 0, 0.04)' : 'none',
                          }}
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

      {/* Batch action bar */}
      {selectMode && selectedCount > 0 && (
        <div style={styles.batchBar}>
          <div style={styles.batchBarInner}>
            <button
              style={styles.batchDeleteBtn}
              onClick={() => setShowBatchDeleteConfirm(true)}
            >
              <Trash2 size={18} />
              Delete ({selectedCount})
            </button>
            {sendableSelected.length > 0 && (
              <button
                style={styles.batchSendBtn}
                onClick={() => setShowBatchSendConfirm(true)}
              >
                <Send size={18} />
                Send ({sendableSelected.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Batch delete confirmation */}
      {showBatchDeleteConfirm && (
        <BatchConfirmModal
          icon={<Trash2 size={32} />}
          iconStyle={batchModalStyles.iconWarning}
          title={`Delete ${selectedCount} document${selectedCount > 1 ? 's' : ''}?`}
          subtitle="This action cannot be undone."
          confirmLabel={isBatchProcessing ? 'Deleting...' : `Delete ${selectedCount}`}
          confirmStyle={batchModalStyles.dangerBtn}
          isProcessing={isBatchProcessing}
          onConfirm={handleBatchDelete}
          onCancel={() => setShowBatchDeleteConfirm(false)}
        />
      )}

      {/* Batch send confirmation */}
      {showBatchSendConfirm && (
        <BatchConfirmModal
          icon={<Send size={32} />}
          iconStyle={batchModalStyles.iconSend}
          title={`Send ${sendableSelected.length} document${sendableSelected.length > 1 ? 's' : ''}?`}
          subtitle={`Email will be sent to each client's address.${selectedCount > sendableSelected.length ? ` ${selectedCount - sendableSelected.length} skipped (no email or already sent).` : ''}`}
          confirmLabel={isBatchProcessing ? 'Sending...' : `Send ${sendableSelected.length}`}
          confirmStyle={batchModalStyles.primaryBtn}
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
    <div style={styles.docCard}>
      <a href={`/dashboard/documents/${doc.id}?type=${doc.type}`} style={styles.docCardLink}>
        <DocIcon type={doc.type} />
        <div style={styles.docInfo}>
          <span style={styles.docClient}>{doc.client}</span>
          <span style={styles.docSubtitle}>
            {getDocNumber(doc)} · {formatSmartTime(doc.date, locale)}
          </span>
        </div>
      </a>
      <div style={styles.docActions}>
        <button
          style={styles.actionIconBtnEdit}
          onClick={() => onEdit(doc)}
          aria-label={t('common.edit')}
        >
          <Pencil size={16} />
        </button>
        <button
          style={styles.actionIconBtnDelete}
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
    <div style={styles.docCard}>
      <a href={`/dashboard/documents/${doc.id}?type=${doc.type}`} style={styles.docCardLink}>
        <DocIcon type={doc.type} />
        <div style={styles.docInfo}>
          <span style={styles.docClient}>{doc.client}</span>
          <span style={styles.docSubtitle}>
            {getDocNumber(doc)} · {formatSmartTime(doc.date, locale)}
          </span>
        </div>
      </a>
      <div style={styles.docActions}>
        {!['sent', 'paid'].includes(doc.status) && (
          <button
            style={styles.actionIconBtnEdit}
            onClick={() => onSend(doc)}
            aria-label="Send"
          >
            <FileText size={16} />
          </button>
        )}
        <button
          style={styles.actionIconBtnDelete}
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
  const iconStyle =
    type === 'invoice'
      ? styles.docIconInvoice
      : type === 'estimate'
        ? styles.docIconEstimate
        : styles.docIconContract;

  return (
    <div style={iconStyle}>
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
    <div style={styles.docEnd}>
      <span style={styles.docAmount}>{formatAmount(doc.amount)}</span>
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
      style={styles.selectableCard}
      onClick={onToggle}
      role="checkbox"
      aria-checked={selected}
    >
      <div
        style={selected ? styles.checkboxSelected : styles.checkboxEmpty}
      >
        {selected && <CheckIcon size={14} strokeWidth={3} />}
      </div>
      <DocIcon type={doc.type} />
      <div style={styles.docInfo}>
        <span style={styles.docClient}>{doc.client}</span>
        <span style={styles.docSubtitle}>
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
  iconStyle,
  title,
  subtitle,
  confirmLabel,
  confirmStyle,
  isProcessing,
  onConfirm,
  onCancel,
}: {
  icon: preact.JSX.Element;
  iconStyle: Record<string, string>;
  title: string;
  subtitle: string;
  confirmLabel: string;
  confirmStyle: Record<string, string>;
  isProcessing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <style>{batchSpinKeyframes}</style>
      <button
        style={batchModalStyles.backdrop}
        onClick={() => !isProcessing && onCancel()}
        aria-label="Close"
      />
      <div style={batchModalStyles.container} role="dialog" aria-modal="true">
        <div style={batchModalStyles.content}>
          <div style={batchModalStyles.step}>
            <div style={iconStyle}>{icon}</div>
            <h2 style={batchModalStyles.title}>{title}</h2>
            <p style={batchModalStyles.subtitle}>{subtitle}</p>
            <div style={batchModalStyles.actions}>
              <button
                style={batchModalStyles.cancelBtn}
                onClick={onCancel}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                style={{
                  ...confirmStyle,
                  opacity: isProcessing ? '0.5' : '1',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                }}
                onClick={onConfirm}
                disabled={isProcessing}
              >
                {isProcessing && <span style={batchModalStyles.spinner} />}
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

const batchModalStyles: Record<string, Record<string, string>> = {
  backdrop: {
    position: 'fixed',
    inset: '0',
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    zIndex: '1100',
    border: 'none',
    cursor: 'default',
  },
  container: {
    position: 'fixed',
    inset: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '1101',
    padding: '20px',
  },
  content: {
    position: 'relative',
    background: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: 'var(--radius-lg, 20px)',
    padding: '32px 24px 24px',
    maxWidth: '380px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
  },
  step: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  iconWarning: {
    width: '72px',
    height: '72px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    marginBottom: '16px',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
  },
  iconSend: {
    width: '72px',
    height: '72px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    marginBottom: '16px',
    background: 'rgba(0, 102, 255, 0.1)',
    color: 'var(--blu-primary, #0066ff)',
  },
  title: {
    fontFamily: 'var(--font-display, system-ui)',
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--gray-900, #0f172a)',
    margin: '0 0 8px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--gray-500, #64748b)',
    margin: '0 0 24px',
    lineHeight: '1.5',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    width: '100%',
  },
  cancelBtn: {
    flex: '1',
    padding: '14px 20px',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: 'var(--gray-100, #f1f5f9)',
    color: 'var(--gray-700, #334155)',
  },
  dangerBtn: {
    flex: '1',
    padding: '14px 20px',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: '#ef4444',
    color: 'white',
  },
  primaryBtn: {
    flex: '1',
    padding: '14px 20px',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: 'var(--blu-primary, #0066ff)',
    color: 'white',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'batchModalSpin 0.8s linear infinite',
    display: 'inline-block',
  },
};

/* ─── Keyframes ─── */

const pageKeyframes = `
.content-scroll::-webkit-scrollbar { display: none; }
`;

/* ─── Styles ─── */

const docIconBase: Record<string, string> = {
  width: '48px',
  height: '48px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'var(--radius-button, 14px)',
  flexShrink: '0',
};

const styles: Record<string, Record<string, string>> = {
  page: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'transparent',
    overflow: 'hidden',
    padding: 'var(--page-padding-x, 20px)',
    paddingTop: 'calc(12px + var(--safe-area-top, 0px))',
    paddingBottom: '0',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
    flexShrink: '0',
    maxWidth: 'var(--page-max-width, 600px)',
    marginLeft: 'auto',
    marginRight: 'auto',
    width: '100%',
  },
  backBtn: {
    width: 'var(--btn-height-md, 44px)',
    height: 'var(--btn-height-md, 44px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--glass-white-50, rgba(255, 255, 255, 0.5))',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: 'none',
    borderRadius: 'var(--radius-button, 14px)',
    color: 'var(--gray-600, #475569)',
    cursor: 'pointer',
  },
  pageTitle: {
    fontFamily: 'var(--font-display, system-ui)',
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--gray-900, #0f172a)',
    margin: '0',
    letterSpacing: '-0.02em',
  },
  headerSpacer: {
    width: '44px',
  },
  searchWrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: 'var(--page-max-width, 600px)',
    marginLeft: 'auto',
    marginRight: 'auto',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '12px',
    flexShrink: '0',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    color: 'var(--gray-400, #94a3b8)',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
  },
  searchInput: {
    width: '100%',
    padding: '12px 40px 12px 42px',
    background: 'rgba(255, 255, 255, 0.5)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: 'none',
    borderRadius: 'var(--radius-input, 12px)',
    color: 'var(--gray-900, #0f172a)',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  clearSearch: {
    position: 'absolute',
    right: '12px',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--gray-200, #e2e8f0)',
    border: 'none',
    borderRadius: '50%',
    color: 'var(--gray-500, #64748b)',
    cursor: 'pointer',
  },
  typeTabsWrapper: {
    marginBottom: '12px',
    flexShrink: '0',
    maxWidth: 'var(--page-max-width, 600px)',
    marginLeft: 'auto',
    marginRight: 'auto',
    width: '100%',
  },
  contentScroll: {
    flex: '1',
    overflowY: 'auto',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
    paddingBottom: 'calc(100px + var(--safe-area-bottom, 0px))',
    maxWidth: 'var(--page-max-width, 600px)',
    width: '100%',
    margin: '0 auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    textAlign: 'center',
  },
  emptyIcon: {
    width: '96px',
    height: '96px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: 'none',
    borderRadius: '50%',
    color: 'var(--blu-primary, #0066ff)',
    marginBottom: '24px',
    boxShadow: '0 8px 32px rgba(0, 102, 255, 0.1)',
  },
  emptyTitle: {
    fontFamily: 'var(--font-display, system-ui)',
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--gray-900, #0f172a)',
    margin: '0 0 8px',
  },
  emptySubtitle: {
    fontSize: '15px',
    color: 'var(--gray-500, #64748b)',
    margin: '0 0 28px',
    maxWidth: '260px',
    lineHeight: '1.5',
  },
  actionBtnPrimary: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 24px',
    border: 'none',
    borderRadius: 'var(--radius-button, 14px)',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    background: 'var(--blu-primary, #0066ff)',
    color: 'white',
    boxShadow: '0 4px 24px rgba(0, 102, 255, 0.35)',
  },
  actionBtnSecondary: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 24px',
    border: 'none',
    borderRadius: 'var(--radius-button, 14px)',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    background: 'var(--gray-100, #f1f5f9)',
    color: 'var(--gray-600, #475569)',
  },
  resultsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  resultsCount: {
    fontSize: '13px',
    color: 'var(--gray-500, #64748b)',
  },
  filteredLabel: {
    color: 'var(--blu-primary, #0066ff)',
  },
  docList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  monthGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  monthHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  monthSelectBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    flexShrink: '0',
  },
  monthHeaderBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    width: 'fit-content',
  },
  monthLabel: {
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--gray-500, #64748b)',
  },
  monthCount: {
    fontSize: '11px',
    fontWeight: '500',
    color: 'var(--gray-400, #94a3b8)',
    background: 'rgba(148, 163, 184, 0.15)',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  monthChevron: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--gray-400, #94a3b8)',
    transition: 'transform 0.2s ease',
  },
  monthDocsContainer: {
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    borderRadius: 'var(--radius-card, 20px)',
    overflow: 'hidden',
  },
  docCardWrapper: {
    borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
  },
  docCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 16px',
    background: 'transparent',
    border: 'none',
    textDecoration: 'none',
  },
  docCardLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flex: '1',
    minWidth: '0',
    textDecoration: 'none',
  },
  docActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexShrink: '0',
  },
  actionIconBtnEdit: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--glass-white-50, rgba(255, 255, 255, 0.5))',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    color: 'var(--gray-500, #64748b)',
  },
  actionIconBtnDelete: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--glass-white-50, rgba(255, 255, 255, 0.5))',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    color: 'var(--gray-400, #94a3b8)',
  },
  docIconInvoice: {
    ...docIconBase,
    background: 'rgba(52, 199, 89, 0.12)',
    color: '#34C759',
  },
  docIconEstimate: {
    ...docIconBase,
    background: 'rgba(0, 102, 255, 0.1)',
    color: '#0066FF',
  },
  docIconContract: {
    ...docIconBase,
    background: 'rgba(0, 102, 255, 0.08)',
    color: 'var(--blu-primary, #0066ff)',
  },
  docInfo: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: '0',
  },
  docClient: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--gray-900, #0f172a)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  docSubtitle: {
    fontSize: '13px',
    color: 'var(--gray-500, #64748b)',
  },
  docEnd: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: '0',
    marginLeft: 'auto',
  },
  docAmount: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--data-green, #10b981)',
  },
  selectBtn: {
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--blu-primary, #0066ff)',
    cursor: 'pointer',
  },
  selectAllBtn: {
    width: '64px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--blu-primary, #0066ff)',
    cursor: 'pointer',
  },
  selectableCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    background: 'transparent',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
  },
  checkboxEmpty: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '2px solid var(--gray-300, #cbd5e1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: '0',
    transition: 'all 0.15s ease',
  },
  checkboxSelected: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '2px solid var(--blu-primary, #0066ff)',
    background: 'var(--blu-primary, #0066ff)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: '0',
    transition: 'all 0.15s ease',
  },
  batchBar: {
    position: 'fixed',
    bottom: '0',
    left: '0',
    right: '0',
    padding: '12px var(--page-padding-x, 20px)',
    paddingBottom: 'calc(12px + var(--safe-area-bottom, 0px))',
    background: 'rgba(255, 255, 255, 0.92)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderTop: '1px solid rgba(0, 0, 0, 0.06)',
    zIndex: '100',
  },
  batchBarInner: {
    display: 'flex',
    gap: '12px',
    maxWidth: 'var(--page-max-width, 600px)',
    margin: '0 auto',
  },
  batchDeleteBtn: {
    flex: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 20px',
    border: 'none',
    borderRadius: 'var(--radius-button, 14px)',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
  },
  batchSendBtn: {
    flex: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 20px',
    border: 'none',
    borderRadius: 'var(--radius-button, 14px)',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    background: 'rgba(0, 102, 255, 0.1)',
    color: 'var(--blu-primary, #0066ff)',
  },
};
