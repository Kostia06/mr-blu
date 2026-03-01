import { useState, useMemo, useEffect, useCallback, useRef } from 'preact/hooks';
import {
  ChevronLeft,
  Download,
  Trash2,
  MoreHorizontal,
  Copy,
  Share2,
  Loader2,
  Mail,
  X,
  Check,
  Pencil,
  Plus,
  FileText,
  Receipt,
  User,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import { useToastStore } from '@/stores/toastStore';
import { DocumentTemplate } from './DocumentTemplate';
import type { DocumentData } from './DocumentTemplate';
import { navigateTo } from '@/lib/navigation';
import { updateDocument, deleteDocument, sendDocument, generatePDF } from '@/lib/api/documents';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { QuickSendModal } from '@/components/modals/QuickSendModal';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ClientDetails {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface Profile {
  full_name?: string | null;
  business_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  website?: string | null;
}

interface DocumentRecord {
  id: string;
  type: string;
  documentType: string;
  client: string;
  clientDetails?: ClientDetails | null;
  document_number?: string | null;
  line_items?: Array<Record<string, unknown>> | null;
  subtotal?: number | null;
  tax_rate?: number | null;
  tax_amount?: number | null;
  total?: number | null;
  due_date?: string | null;
  notes?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
}

interface EditableLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  total: number;
  notes: string;
}

interface EditData {
  type: string;
  document_number: string;
  client: string;
  clientDetails: { email: string; phone: string; address: string };
  line_items: EditableLineItem[];
  tax_rate: number;
  due_date: string;
  notes: string;
}

interface DocumentDetailProps {
  document: DocumentRecord;
  profile: Profile | null;
  userMetadata?: Record<string, unknown> | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function normalizeTaxRate(rate: number | null | undefined): number {
  if (!rate) return 0;
  return rate < 1 ? rate * 100 : rate;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function buildEditData(doc: DocumentRecord): EditData {
  return {
    type: doc.type || 'invoice',
    document_number: doc.document_number || '',
    client: doc.client || '',
    clientDetails: {
      email: doc.clientDetails?.email || '',
      phone: doc.clientDetails?.phone || '',
      address: doc.clientDetails?.address || '',
    },
    line_items: (doc.line_items || []).map((item: any, i: number) => ({
      id: `item-${i}-${Date.now()}`,
      description: item.description || '',
      quantity: item.quantity || 1,
      unit: item.unit || 'ea',
      rate: item.rate || 0,
      total: item.total || 0,
      notes: item.notes || '',
    })),
    tax_rate: normalizeTaxRate(doc.tax_rate),
    due_date: doc.due_date || '',
    notes: doc.notes || '',
  };
}

function buildTemplateDocument(
  doc: DocumentRecord,
  profile: Profile | null,
  senderName: string | undefined
): DocumentData {
  return {
    documentType: doc.documentType || doc.type || 'Invoice',
    documentNumber: doc.document_number || `#${doc.id?.slice(0, 8)}`,
    client: {
      name: doc.client || 'Unknown Client',
      email: doc.clientDetails?.email || undefined,
      phone: doc.clientDetails?.phone || undefined,
      address: doc.clientDetails?.address || undefined,
    },
    from: {
      name: senderName || undefined,
      businessName: profile?.business_name || undefined,
      email: profile?.email || undefined,
      phone: profile?.phone || undefined,
      address: profile?.address || undefined,
      website: profile?.website || undefined,
    },
    lineItems: (doc.line_items || []).map((item: any) => {
      let dims: string | undefined;
      if (typeof item.dimensions === 'string') {
        dims = item.dimensions.includes('undefined') ? undefined : item.dimensions;
      } else if (item.dimensions?.width && item.dimensions?.length) {
        dims = `${item.dimensions.width} x ${item.dimensions.length} ${item.dimensions.unit || 'ft'}`;
      }
      return {
        description: item.description || 'Item',
        quantity: item.quantity || 1,
        unit: item.unit || 'ea',
        rate: item.rate || item.total || 0,
        total: item.total || 0,
        measurementType: item.measurementType,
        dimensions: dims,
        notes: item.notes || undefined,
      };
    }),
    subtotal: doc.subtotal || doc.total || 0,
    taxRate: doc.tax_rate || 0,
    taxAmount: doc.tax_amount || 0,
    total: doc.total || 0,
    date: doc.created_at || new Date().toISOString(),
    dueDate: doc.due_date || undefined,
    notes: doc.notes || undefined,
  };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function DocumentDetail({ document: doc, profile, userMetadata }: DocumentDetailProps) {
  const { t } = useI18nStore();
  const toast = useToastStore();

  // Back URL
  const backUrl = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('from') === 'review' ? '/dashboard/reviews' : '/dashboard/documents';
  }, []);

  // Sender name
  const senderName = useMemo(() => {
    if (profile?.full_name) return profile.full_name;
    const meta = userMetadata;
    if (meta?.first_name && meta?.last_name) return `${meta.first_name} ${meta.last_name}`;
    return (meta?.first_name || meta?.last_name || undefined) as string | undefined;
  }, [profile, userMetadata]);

  // Template document for view mode
  const templateDocument = useMemo(
    () => buildTemplateDocument(doc, profile, senderName),
    [doc, profile, senderName]
  );

  // UI state
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const editExitedManually = useRef(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editData, setEditData] = useState<EditData>(() => buildEditData(doc));

  // Calculated totals
  const calculatedSubtotal = useMemo(
    () => editData.line_items.reduce((sum, item) => sum + (item.total || 0), 0),
    [editData.line_items]
  );

  const calculatedTaxAmount = useMemo(
    () => (editData.tax_rate ? calculatedSubtotal * (editData.tax_rate / 100) : 0),
    [editData.tax_rate, calculatedSubtotal]
  );

  const calculatedTotal = useMemo(
    () => calculatedSubtotal + calculatedTaxAmount,
    [calculatedSubtotal, calculatedTaxAmount]
  );

  // Modals
  const [showSendModal, setShowSendModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Auto-start editing if ?edit=true
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('edit') === 'true' && !isEditing && !editExitedManually.current) {
      startEditing();
    }
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handleClick = () => setShowMenu(false);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Edit actions                                                     */
  /* ---------------------------------------------------------------- */

  const startEditing = useCallback(() => {
    setEditData(buildEditData(doc));
    setIsEditing(true);
    setShowMenu(false);
  }, [doc]);

  const cancelEditing = useCallback(() => {
    navigateTo('/dashboard/documents');
  }, []);

  const handleBackFromEdit = useCallback(() => {
    navigateTo('/dashboard/documents');
  }, []);

  const saveChanges = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveError('');

    try {
      await updateDocument(doc.id, {
        document_type: editData.type,
        document_number: editData.document_number,
        client_id: doc.client_id,
        client_details: {
          name: editData.client,
          email: editData.clientDetails.email || null,
          phone: editData.clientDetails.phone || null,
          address: editData.clientDetails.address || null,
        },
        line_items: editData.line_items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          total: item.total,
          notes: item.notes || null,
        })),
        subtotal: calculatedSubtotal,
        tax_rate: editData.tax_rate,
        tax_amount: calculatedTaxAmount,
        total: calculatedTotal,
        due_date: editData.due_date || null,
        notes: editData.notes || null,
      }, 'documents');

      editExitedManually.current = true;
      setIsEditing(false);
      setSaveSuccess(true);

      const url = new URL(window.location.href);
      if (url.searchParams.has('edit')) {
        url.searchParams.delete('edit');
        window.history.replaceState({}, '', url.pathname + url.search);
      }

      setTimeout(() => setSaveSuccess(false), 3000);
      window.location.reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error. Please try again.';
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, doc.id, editData, calculatedSubtotal, calculatedTaxAmount, calculatedTotal]);

  /* ---------------------------------------------------------------- */
  /*  Line item helpers                                                */
  /* ---------------------------------------------------------------- */

  const updateLineItem = useCallback(
    (id: string, field: keyof EditableLineItem, value: string | number) => {
      setEditData((prev) => {
        const items = prev.line_items.map((item) => {
          if (item.id !== id) return item;
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'rate') {
            updated.total = (updated.quantity || 0) * (updated.rate || 0);
          }
          return updated;
        });
        return { ...prev, line_items: items };
      });
    },
    []
  );

  const addLineItem = useCallback(() => {
    setEditData((prev) => ({
      ...prev,
      line_items: [
        ...prev.line_items,
        { id: `item-${Date.now()}`, description: '', quantity: 1, unit: 'ea', rate: 0, total: 0, notes: '' },
      ],
    }));
  }, []);

  const removeLineItem = useCallback((id: string) => {
    setEditData((prev) => ({
      ...prev,
      line_items: prev.line_items.filter((item) => item.id !== id),
    }));
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Document actions                                                 */
  /* ---------------------------------------------------------------- */

  const handleDownload = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const blob = await generatePDF(templateDocument as unknown as Record<string, unknown>);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${doc.type || 'invoice'}-${doc.document_number || doc.id?.slice(0, 8)}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('docDetail.failedPdf'));
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, templateDocument, doc, toast, t]);

  const handleDelete = useCallback(() => {
    setShowDeleteModal(true);
    setShowMenu(false);
  }, []);

  const confirmDelete = useCallback(async (documentId: string) => {
    await deleteDocument(documentId, doc.type);
    navigateTo('/dashboard/documents');
  }, [doc.type]);

  const handleSendEmail = useCallback(() => {
    setShowSendModal(true);
    setShowMenu(false);
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <>
      <main class="document-page">
        {/* Header */}
        <header class="page-header">
          <button
            class="back-btn"
            onClick={() => (isEditing ? handleBackFromEdit() : navigateTo(backUrl))}
            aria-label={t('common.back')}
          >
            <ChevronLeft size={22} strokeWidth={2} />
          </button>

          {isEditing && <span class="header-title">{t('docDetail.editDocument')}</span>}

          <div class="header-spacer" />

          <div class="header-actions">
            {isEditing ? (
              <>
                <button class="cancel-btn" onClick={cancelEditing} disabled={isSaving}>
                  {t('docDetail.cancel')}
                </button>
                <button class="save-btn" onClick={saveChanges} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 size={16} class="spinning" />
                  ) : (
                    <Check size={16} />
                  )}
                  <span>{isSaving ? t('docDetail.saving') : t('docDetail.save')}</span>
                </button>
              </>
            ) : (
              <>
                <button class="edit-btn" onClick={startEditing}>
                  <Pencil size={16} />
                  <span>{t('docDetail.edit')}</span>
                </button>
                <button
                  class="menu-btn"
                  onClick={(e: MouseEvent) => {
                    e.stopPropagation();
                    setShowMenu((prev) => !prev);
                  }}
                  aria-label="More options"
                >
                  <MoreHorizontal size={20} strokeWidth={2} />
                </button>
                {showMenu && (
                  <div
                    class="dropdown-menu"
                    onClick={(e: MouseEvent) => e.stopPropagation()}
                    role="menu"
                  >
                    <button class="menu-item" onClick={handleSendEmail} disabled={isSending}>
                      <Mail size={16} />
                      <span>
                        {isSending ? t('docDetail.sending') : t('docDetail.sendEmail')}
                      </span>
                    </button>
                    <button class="menu-item" onClick={handleDownload} disabled={isGenerating}>
                      <Download size={16} />
                      <span>
                        {isGenerating ? t('docDetail.generating') : t('docDetail.downloadPdf')}
                      </span>
                    </button>
                    <button class="menu-item">
                      <Copy size={16} />
                      <span>{t('docDetail.duplicate')}</span>
                    </button>
                    <button class="menu-item">
                      <Share2 size={16} />
                      <span>{t('docDetail.shareLink')}</span>
                    </button>
                    <div class="menu-divider" />
                    <button
                      class="menu-item danger"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      <Trash2 size={16} />
                      <span>
                        {isDeleting ? t('docDetail.deleting') : t('docDetail.delete')}
                      </span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </header>

        {/* Error Banner */}
        {saveError && (
          <div class="error-banner">
            <span>{saveError}</span>
            <button onClick={() => setSaveError('')}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Save Success Banner */}
        {saveSuccess && (
          <div class="success-banner">
            <Check size={16} />
            <span>{t('docDetail.saveSuccess')}</span>
          </div>
        )}

        {/* Edit Mode */}
        {isEditing ? (
          <div class="edit-container">
            <EditDocumentTypeSection
              t={t}
              type={editData.type}
              onTypeChange={(type) => setEditData((prev) => ({ ...prev, type }))}
            />

            <EditDocumentNumberSection
              t={t}
              value={editData.document_number}
              onChange={(value) => setEditData((prev) => ({ ...prev, document_number: value }))}
            />

            <EditClientSection
              t={t}
              client={editData.client}
              clientDetails={editData.clientDetails}
              onClientChange={(value) => setEditData((prev) => ({ ...prev, client: value }))}
              onDetailChange={(field, value) =>
                setEditData((prev) => ({
                  ...prev,
                  clientDetails: { ...prev.clientDetails, [field]: value },
                }))
              }
            />

            <EditLineItemsSection
              t={t}
              items={editData.line_items}
              onUpdate={updateLineItem}
              onAdd={addLineItem}
              onRemove={removeLineItem}
              formatCurrency={formatCurrency}
            />

            <EditTaxDateSection
              t={t}
              taxRate={editData.tax_rate}
              dueDate={editData.due_date}
              onTaxRateChange={(value) =>
                setEditData((prev) => ({ ...prev, tax_rate: value }))
              }
              onDueDateChange={(value) =>
                setEditData((prev) => ({ ...prev, due_date: value }))
              }
            />

            <TotalsSummary
              t={t}
              subtotal={calculatedSubtotal}
              taxRate={editData.tax_rate}
              taxAmount={calculatedTaxAmount}
              total={calculatedTotal}
              formatCurrency={formatCurrency}
            />

            <EditNotesSection
              t={t}
              value={editData.notes}
              onChange={(value) => setEditData((prev) => ({ ...prev, notes: value }))}
            />
          </div>
        ) : (
          <div class="document-container">
            <DocumentTemplate document={templateDocument} />
          </div>
        )}
      </main>

      {/* Send Modal */}
      <QuickSendModal
        open={showSendModal}
        document={{
          id: doc.id,
          type: (doc.type || 'invoice') as 'invoice' | 'estimate' | 'contract',
          title: `${doc.documentType || doc.type || 'Invoice'} ${doc.document_number || ''}`.trim(),
          client: doc.client || '',
          clientEmail: doc.clientDetails?.email,
          amount: doc.total ?? undefined,
        }}
        onClose={() => setShowSendModal(false)}
        onSuccess={() => toast.success(t('docDetail.emailSuccess'))}
      />

      {/* Delete Modal */}
      <DeleteConfirmModal
        open={showDeleteModal}
        document={{
          id: doc.id,
          type: (doc.type || 'invoice') as 'invoice' | 'estimate' | 'contract',
          title: `${doc.documentType || doc.type || 'Invoice'} ${doc.document_number || ''}`.trim(),
          client: doc.client || '',
          amount: doc.total ?? undefined,
        }}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
      />

      <style>{STYLES}</style>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Edit Sub-Sections                                                  */
/* ------------------------------------------------------------------ */

interface TranslateProps {
  t: (key: string, params?: Record<string, string | number>) => string;
}

function EditDocumentTypeSection({
  t,
  type,
  onTypeChange,
}: TranslateProps & { type: string; onTypeChange: (type: string) => void }) {
  return (
    <section class="edit-section">
      <h3 class="section-label">{t('docDetail.documentType')}</h3>
      <div class="type-toggle">
        <button
          class={`type-btn ${type === 'invoice' ? 'active' : ''}`}
          onClick={() => onTypeChange('invoice')}
        >
          <Receipt size={18} />
          <span>{t('docDetail.invoice')}</span>
        </button>
        <button
          class={`type-btn ${type === 'estimate' ? 'active' : ''}`}
          onClick={() => onTypeChange('estimate')}
        >
          <FileText size={18} />
          <span>{t('docDetail.estimate')}</span>
        </button>
      </div>
    </section>
  );
}

function EditDocumentNumberSection({
  t,
  value,
  onChange,
}: TranslateProps & { value: string; onChange: (value: string) => void }) {
  return (
    <section class="edit-section">
      <label class="field-label" for="doc-number">
        {t('docDetail.documentNumber')}
      </label>
      <input
        id="doc-number"
        type="text"
        class="field-input"
        value={value}
        onInput={(e) => onChange((e.target as HTMLInputElement).value)}
        placeholder="INV-2024-001"
      />
    </section>
  );
}

function EditClientSection({
  t,
  client,
  clientDetails,
  onClientChange,
  onDetailChange,
}: TranslateProps & {
  client: string;
  clientDetails: { email: string; phone: string; address: string };
  onClientChange: (value: string) => void;
  onDetailChange: (field: string, value: string) => void;
}) {
  return (
    <section class="edit-section">
      <h3 class="section-label">
        <User size={16} />
        {t('docDetail.clientInfo')}
      </h3>
      <div class="field-group">
        <div class="field">
          <label class="field-label" for="client-name">
            {t('docDetail.clientName')}
          </label>
          <input
            id="client-name"
            type="text"
            class="field-input"
            value={client}
            onInput={(e) => onClientChange((e.target as HTMLInputElement).value)}
            placeholder="Client name"
          />
        </div>
        <div class="field">
          <label class="field-label" for="client-email">
            {t('docDetail.clientEmail')}
          </label>
          <input
            id="client-email"
            type="email"
            class="field-input"
            value={clientDetails.email}
            onInput={(e) => onDetailChange('email', (e.target as HTMLInputElement).value)}
            placeholder={t('docDetail.emailPlaceholder')}
          />
        </div>
        <div class="field">
          <label class="field-label" for="client-phone">
            {t('docDetail.clientPhone')}
          </label>
          <input
            id="client-phone"
            type="tel"
            class="field-input"
            value={clientDetails.phone}
            onInput={(e) => onDetailChange('phone', (e.target as HTMLInputElement).value)}
            placeholder="(555) 123-4567"
          />
        </div>
        <div class="field">
          <label class="field-label" for="client-address">
            {t('docDetail.clientAddress')}
          </label>
          <input
            id="client-address"
            type="text"
            class="field-input"
            value={clientDetails.address}
            onInput={(e) => onDetailChange('address', (e.target as HTMLInputElement).value)}
            placeholder="123 Main St, City, ST 12345"
          />
        </div>
      </div>
    </section>
  );
}

function EditLineItemsSection({
  t,
  items,
  onUpdate,
  onAdd,
  onRemove,
  formatCurrency: fmt,
}: TranslateProps & {
  items: EditableLineItem[];
  onUpdate: (id: string, field: keyof EditableLineItem, value: string | number) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  formatCurrency: (amount: number) => string;
}) {
  return (
    <section class="edit-section">
      <h3 class="section-label">
        <DollarSign size={16} />
        {t('docDetail.lineItems')}
      </h3>
      <div class="line-items-list">
        {items.map((item, index) => (
          <div class="line-item-card" key={item.id}>
            <div class="line-item-header">
              <span class="item-number">{index + 1}</span>
              <button
                class="remove-item-btn"
                onClick={() => onRemove(item.id)}
                aria-label={t('docDetail.removeItem')}
              >
                <X size={14} />
              </button>
            </div>
            <div class="line-item-fields">
              <div class="field full">
                <label class="field-label-sm" for={`item-desc-${item.id}`}>
                  {t('docDetail.description')}
                </label>
                <input
                  id={`item-desc-${item.id}`}
                  type="text"
                  class="field-input"
                  value={item.description}
                  onInput={(e) =>
                    onUpdate(item.id, 'description', (e.target as HTMLInputElement).value)
                  }
                  placeholder="Item description"
                />
              </div>
              <div class="field-row">
                <div class="field">
                  <label class="field-label-sm" for={`item-qty-${item.id}`}>
                    {t('docDetail.quantity')}
                  </label>
                  <input
                    id={`item-qty-${item.id}`}
                    type="number"
                    class="field-input"
                    value={item.quantity}
                    onInput={(e) =>
                      onUpdate(item.id, 'quantity', parseFloat((e.target as HTMLInputElement).value) || 0)
                    }
                    min="0"
                    step="0.01"
                  />
                </div>
                <div class="field">
                  <label class="field-label-sm" for={`item-unit-${item.id}`}>
                    {t('docDetail.unit')}
                  </label>
                  <input
                    id={`item-unit-${item.id}`}
                    type="text"
                    class="field-input"
                    value={item.unit}
                    onInput={(e) =>
                      onUpdate(item.id, 'unit', (e.target as HTMLInputElement).value)
                    }
                    placeholder="ea"
                  />
                </div>
                <div class="field">
                  <label class="field-label-sm" for={`item-rate-${item.id}`}>
                    {t('docDetail.rate')}
                  </label>
                  <input
                    id={`item-rate-${item.id}`}
                    type="number"
                    class="field-input"
                    value={item.rate}
                    onInput={(e) =>
                      onUpdate(item.id, 'rate', parseFloat((e.target as HTMLInputElement).value) || 0)
                    }
                    min="0"
                    step="0.01"
                  />
                </div>
                <div class="field">
                  <span class="field-label-sm">{t('docDetail.total')}</span>
                  <div class="field-value">{fmt(item.total)}</div>
                </div>
              </div>
              <div class="field full">
                <input
                  id={`item-notes-${item.id}`}
                  type="text"
                  class="field-input"
                  value={item.notes}
                  onInput={(e) =>
                    onUpdate(item.id, 'notes', (e.target as HTMLInputElement).value)
                  }
                  placeholder={t('placeholder.addNote')}
                  style={{ fontSize: '13px', color: 'var(--gray-500, #64748b)' }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button class="add-item-btn" onClick={onAdd}>
        <Plus size={16} />
        <span>{t('docDetail.addLineItem')}</span>
      </button>
    </section>
  );
}

function EditTaxDateSection({
  t,
  taxRate,
  dueDate,
  onTaxRateChange,
  onDueDateChange,
}: TranslateProps & {
  taxRate: number;
  dueDate: string;
  onTaxRateChange: (value: number) => void;
  onDueDateChange: (value: string) => void;
}) {
  return (
    <section class="edit-section">
      <div class="field-row-2">
        <div class="field">
          <label class="field-label" for="tax-rate">
            {t('docDetail.taxRate')} (%)
          </label>
          <input
            id="tax-rate"
            type="number"
            class="field-input"
            value={taxRate}
            onInput={(e) =>
              onTaxRateChange(parseFloat((e.target as HTMLInputElement).value) || 0)
            }
            min="0"
            max="100"
            step="0.01"
            placeholder="0"
          />
        </div>
        <div class="field">
          <label class="field-label" for="due-date">
            <Calendar size={14} />
            {t('docDetail.dueDate')}
          </label>
          <input
            id="due-date"
            type="date"
            class="field-input"
            value={dueDate}
            onInput={(e) => onDueDateChange((e.target as HTMLInputElement).value)}
          />
        </div>
      </div>
    </section>
  );
}

function TotalsSummary({
  t,
  subtotal,
  taxRate,
  taxAmount,
  total,
  formatCurrency: fmt,
}: TranslateProps & {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  formatCurrency: (amount: number) => string;
}) {
  return (
    <section class="totals-section">
      <div class="total-row">
        <span>{t('docDetail.subtotal')}</span>
        <span>{fmt(subtotal)}</span>
      </div>
      {taxRate > 0 && (
        <div class="total-row">
          <span>
            {t('docDetail.tax')} ({taxRate.toFixed(1)}%)
          </span>
          <span>{fmt(taxAmount)}</span>
        </div>
      )}
      <div class="total-row grand">
        <span>{t('docDetail.total')}</span>
        <span>{fmt(total)}</span>
      </div>
    </section>
  );
}

function EditNotesSection({
  t,
  value,
  onChange,
}: TranslateProps & { value: string; onChange: (value: string) => void }) {
  return (
    <section class="edit-section">
      <label class="field-label" for="notes">
        {t('docDetail.notes')}
      </label>
      <textarea
        id="notes"
        class="field-textarea"
        value={value}
        onInput={(e) => onChange((e.target as HTMLTextAreaElement).value)}
        placeholder="Add notes..."
        rows={3}
      />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const STYLES = `
  .document-page {
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
    padding: var(--page-padding-x, 20px);
    padding-top: calc(12px + var(--safe-area-top, 0px));
    padding-bottom: 100px;
    background: transparent;
  }

  .page-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    max-width: var(--page-max-width, 600px);
    margin-left: auto;
    margin-right: auto;
    width: 100%;
  }

  .header-title {
    font-size: 17px;
    font-weight: 600;
    color: var(--gray-900, #0f172a);
  }

  .back-btn,
  .menu-btn {
    width: var(--btn-height-md, 44px);
    height: var(--btn-height-md, 44px);
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: var(--radius-button, 14px);
    color: var(--gray-600, #475569);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .back-btn:hover,
  .menu-btn:hover {
    background: #f1f5f9;
    color: var(--gray-900, #0f172a);
  }

  .header-spacer {
    flex: 1;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    position: relative;
  }

  .edit-btn,
  .save-btn,
  .cancel-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .edit-btn {
    background: white;
    border: 1px solid #e2e8f0;
    color: var(--gray-700, #334155);
  }

  .edit-btn:hover {
    background: #f1f5f9;
    color: var(--gray-900, #0f172a);
  }

  .save-btn {
    background: #0066ff;
    border: none;
    color: white;
    box-shadow: 0 2px 8px rgba(0, 102, 255, 0.25);
  }

  .save-btn:hover:not(:disabled) {
    background: #0052cc;
  }

  .save-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .cancel-btn {
    background: transparent;
    border: 1px solid #e2e8f0;
    color: var(--gray-600, #475569);
  }

  .cancel-btn:hover:not(:disabled) {
    background: #f1f5f9;
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: var(--radius-button, 14px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
    min-width: 180px;
    overflow: hidden;
    z-index: 50;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 14px 16px;
    background: none;
    border: none;
    font-size: 14px;
    font-weight: 500;
    color: var(--gray-700, #334155);
    cursor: pointer;
    text-align: left;
  }

  .menu-item:hover {
    background: #f8fafc;
  }

  .menu-item.danger {
    color: var(--data-red, #ef4444);
  }

  .menu-item.danger:hover {
    background: rgba(239, 68, 68, 0.06);
  }

  .menu-item:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .menu-divider {
    height: 1px;
    background: #e2e8f0;
    margin: 4px 0;
  }

  .error-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    max-width: var(--page-max-width, 600px);
    margin: 0 auto 12px;
    width: 100%;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 12px;
    color: #dc2626;
    font-size: 14px;
  }

  .error-banner button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: #dc2626;
    cursor: pointer;
  }

  .error-banner button:hover {
    background: rgba(220, 38, 38, 0.1);
  }

  .success-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    max-width: var(--page-max-width, 600px);
    margin: 0 auto 12px;
    width: 100%;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 12px;
    color: #16a34a;
    font-size: 14px;
    font-weight: 500;
  }

  .edit-container {
    flex: 1;
    padding-bottom: 120px;
    max-width: var(--page-max-width, 600px);
    margin: 0 auto;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .edit-section {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 20px;
  }

  .section-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--gray-500, #64748b);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin: 0 0 16px;
  }

  .field-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
    color: var(--gray-600, #475569);
    margin-bottom: 8px;
  }

  .field-label-sm {
    font-size: 11px;
    font-weight: 500;
    color: var(--gray-500, #64748b);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin-bottom: 6px;
    display: block;
  }

  .field-input {
    width: 100%;
    padding: 12px 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 15px;
    color: var(--gray-900, #0f172a);
    transition: all 0.15s ease;
    box-sizing: border-box;
  }

  .field-input:focus {
    outline: none;
    background: white;
    border-color: #0066ff;
    box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
  }

  .field-input::placeholder {
    color: #94a3b8;
  }

  .field-textarea {
    width: 100%;
    padding: 12px 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 15px;
    color: var(--gray-900, #0f172a);
    resize: vertical;
    min-height: 80px;
    font-family: inherit;
    transition: all 0.15s ease;
    box-sizing: border-box;
  }

  .field-textarea:focus {
    outline: none;
    background: white;
    border-color: #0066ff;
    box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .field {
    display: flex;
    flex-direction: column;
  }

  .field.full {
    width: 100%;
  }

  .field-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 10px;
  }

  .field-row-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .field-value {
    padding: 12px 14px;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 600;
    color: #10b981;
  }

  .type-toggle {
    display: flex;
    gap: 10px;
  }

  .type-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px;
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    color: var(--gray-500, #64748b);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .type-btn:hover {
    background: #f1f5f9;
    color: var(--gray-700, #334155);
  }

  .type-btn.active {
    background: rgba(0, 102, 255, 0.08);
    border-color: #0066ff;
    color: #0066ff;
  }

  .line-items-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }

  .line-item-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 14px;
  }

  .line-item-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .item-number {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #e2e8f0;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
    color: var(--gray-500, #64748b);
  }

  .remove-item-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid #fecaca;
    border-radius: 6px;
    color: #ef4444;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .remove-item-btn:hover {
    background: rgba(239, 68, 68, 0.1);
  }

  .line-item-fields {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .add-item-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 14px;
    background: rgba(0, 102, 255, 0.06);
    border: 2px dashed rgba(0, 102, 255, 0.3);
    border-radius: 12px;
    color: #0066ff;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .add-item-btn:hover {
    background: rgba(0, 102, 255, 0.1);
    border-color: #0066ff;
  }

  .totals-section {
    padding: 0 4px;
  }

  .total-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    font-size: 15px;
    color: var(--gray-600, #475569);
  }

  .total-row + .total-row {
    border-top: 1px solid #f1f5f9;
  }

  .total-row.grand {
    padding-top: 14px;
    margin-top: 4px;
    border-top: 2px solid #e2e8f0;
    font-size: 18px;
    font-weight: 700;
    color: var(--gray-900, #0f172a);
  }

  .total-row.grand span:last-child {
    color: #10b981;
  }

  .document-container {
    flex: 1;
    padding-bottom: 120px;
    max-width: var(--page-max-width, 600px);
    margin: 0 auto;
    width: 100%;
  }

  .spinning {
    animation: doc-spin 1s linear infinite;
  }

  @keyframes doc-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    z-index: 200;
  }

  .modal-content {
    background: white;
    border-radius: 16px;
    width: 100%;
    max-width: 420px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid #e2e8f0;
  }

  .modal-header h2 {
    font-size: 18px;
    font-weight: 600;
    color: #0f172a;
    margin: 0;
  }

  .modal-close {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    border-radius: 8px;
    color: #64748b;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .modal-close:hover {
    background: #f1f5f9;
    color: #0f172a;
  }

  .modal-body {
    padding: 24px;
  }

  .modal-description {
    font-size: 14px;
    color: #64748b;
    margin: 0 0 20px;
    line-height: 1.5;
  }

  .email-label {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .email-label span {
    font-size: 14px;
    font-weight: 500;
    color: #334155;
  }

  .email-input {
    width: 100%;
    padding: 14px 16px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    font-size: 16px;
    color: #0f172a;
    background: #f8fafc;
    transition: all 0.15s ease;
    box-sizing: border-box;
  }

  .email-input:focus {
    outline: none;
    border-color: #0066ff;
    background: white;
    box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
  }

  .email-input::placeholder {
    color: #94a3b8;
  }

  .error-message {
    font-size: 13px;
    color: #ef4444;
    margin: 12px 0 0;
  }

  .modal-footer {
    display: flex;
    gap: 12px;
    padding: 16px 24px 24px;
  }

  .btn-secondary,
  .btn-primary {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 20px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-secondary {
    background: white;
    border: 1px solid #e2e8f0;
    color: #64748b;
  }

  .btn-secondary:hover {
    background: #f8fafc;
    color: #334155;
  }

  .btn-primary {
    background: #0066ff;
    border: none;
    color: white;
    box-shadow: 0 4px 12px rgba(0, 102, 255, 0.25);
  }

  .btn-primary:hover:not(:disabled) {
    background: #0052cc;
    transform: translateY(-1px);
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .back-btn,
    .menu-btn,
    .edit-btn,
    .save-btn,
    .cancel-btn,
    .type-btn,
    .add-item-btn,
    .menu-item {
      transition: none;
    }
    .spinning {
      animation: none;
    }
  }

  @media (max-width: 600px) {
    .document-container,
    .edit-container {
      padding-bottom: 100px;
    }

    .field-row {
      grid-template-columns: 1fr 1fr;
    }

    .field-row-2 {
      grid-template-columns: 1fr;
    }

    .edit-section {
      padding: 16px;
    }
  }
`;
