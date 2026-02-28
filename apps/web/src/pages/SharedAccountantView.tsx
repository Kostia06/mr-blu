import { useState, useEffect, useCallback, useMemo } from 'preact/hooks';
import { useRoute } from 'wouter';
import {
  FileText,
  Search,
  Download,
  Eye,
  X,
  Share2,
  AlertCircle,
  Loader2,
  Receipt,
  ChevronLeft,
  ChevronDown,
  FileSpreadsheet,
} from 'lucide-react';
import { validateShareAccess, getSharedDocuments } from '@/lib/api/accountant-shares';
import { DocumentTemplate } from '@/components/documents/DocumentTemplate';
import { generatePDF } from '@/lib/api/documents';
import { BackgroundBlobs } from '@/components/landing/BackgroundBlobs';
import { supabase } from '@/lib/supabase/client';
import type { AccountantShare, SharedDocumentRow, SharedLineItem } from '@/lib/api/accountant-shares';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cell(value: string, type: 'String' | 'Number' = 'String', styleId?: string): string {
  const style = styleId ? ` ss:StyleID="${styleId}"` : '';
  return `<Cell${style}><Data ss:Type="${type}">${escapeXml(value)}</Data></Cell>`;
}

function numCell(value: number, styleId?: string): string {
  const style = styleId ? ` ss:StyleID="${styleId}"` : '';
  return `<Cell${style}><Data ss:Type="Number">${value}</Data></Cell>`;
}

function col(width: number): string {
  return `<Column ss:AutoFitWidth="0" ss:Width="${width}"/>`;
}

function buildExcelXml(docs: SharedDocumentRow[]): string {
  const invoiceRows = docs.map((doc) => {
    const client = doc.clients?.name || '';
    const date = doc.created_at ? formatDate(doc.created_at) : '';
    const dueDate = doc.due_date ? formatDate(doc.due_date) : '';
    return [
      '<Row>',
      cell(doc.document_number || ''),
      cell(client),
      cell(date),
      cell(dueDate),
      cell(doc.status || ''),
      numCell(doc.subtotal || 0, 'Currency'),
      numCell((doc.tax_rate || 0) / 100, 'Pct'),
      numCell(doc.tax_amount || 0, 'Currency'),
      numCell(doc.total || 0, 'Currency'),
      cell(doc.notes || ''),
      '</Row>',
    ].join('');
  });

  const lineItemRows = docs.flatMap((doc) => {
    const items = (doc.line_items || []) as SharedLineItem[];
    const client = doc.clients?.name || '';
    return items.map((item) => [
      '<Row>',
      cell(doc.document_number || ''),
      cell(client),
      cell(item.description || ''),
      numCell(item.quantity || 0),
      cell(item.unit || ''),
      numCell(item.rate || 0, 'Currency'),
      numCell(item.total || 0, 'Currency'),
      '</Row>',
    ].join(''));
  });

  const hdr = (label: string) => cell(label, 'String', 'Header');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?mso-application progid="Excel.Sheet"?>',
    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"',
    ' xmlns:o="urn:schemas-microsoft-com:office:office"',
    ' xmlns:x="urn:schemas-microsoft-com:office:excel"',
    ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">',
    '<ExcelWorkbook xmlns="urn:schemas-microsoft-com:office:excel">',
    '<ProtectStructure>False</ProtectStructure>',
    '<ProtectWindows>False</ProtectWindows>',
    '</ExcelWorkbook>',
    '<Styles>',
    '<Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Bottom"/><Font ss:FontName="Calibri" ss:Size="11"/></Style>',
    '<Style ss:ID="Header"><Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/><Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/><Alignment ss:Vertical="Bottom"/></Style>',
    '<Style ss:ID="Currency"><NumberFormat ss:Format="&quot;$&quot;#,##0.00"/></Style>',
    '<Style ss:ID="Pct"><NumberFormat ss:Format="0.00%"/></Style>',
    '<Style ss:ID="CurrencyHeader"><Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/><Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/><NumberFormat ss:Format="&quot;$&quot;#,##0.00"/></Style>',
    '</Styles>',
    // Sheet 1: Invoices
    '<Worksheet ss:Name="Invoices">',
    '<Table>',
    col(90), col(140), col(90), col(90), col(70), col(90), col(75), col(90), col(90), col(180),
    '<Row>',
    hdr('Invoice #'), hdr('Client'), hdr('Date'), hdr('Due Date'), hdr('Status'),
    hdr('Subtotal'), hdr('Tax Rate'), hdr('Tax Amount'), hdr('Total'), hdr('Notes'),
    '</Row>',
    ...invoiceRows,
    '</Table>',
    '</Worksheet>',
    // Sheet 2: Line Items
    '<Worksheet ss:Name="Line Items">',
    '<Table>',
    col(90), col(140), col(200), col(60), col(70), col(90), col(90),
    '<Row>',
    hdr('Invoice #'), hdr('Client'), hdr('Item Description'), hdr('Qty'), hdr('Unit'), hdr('Rate'), hdr('Total'),
    '</Row>',
    ...lineItemRows,
    '</Table>',
    '</Worksheet>',
    '</Workbook>',
  ].join('\n');
}

function downloadExcelXml(content: string, filename: string) {
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const blob = new Blob([bom, content], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function SharedAccountantViewPage() {
  const [, params] = useRoute('/shared/accountant/:token');
  const token = params?.token || '';

  const [share, setShare] = useState<AccountantShare | null>(null);
  const [documents, setDocuments] = useState<SharedDocumentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceSearch, setPriceSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [previewDoc, setPreviewDoc] = useState<Record<string, unknown> | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    async function load() {
      setIsLoading(true);
      try {
        const shareData = await validateShareAccess(token);
        if (!shareData) {
          setError('invalid');
          return;
        }

        setShare(shareData);
        const docs = await getSharedDocuments(token);
        setDocuments(docs);
      } catch {
        setError('invalid');
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [token]);

  const filteredDocs = useMemo(() => {
    if (!searchQuery) return documents;
    const q = searchQuery.toLowerCase();
    return documents.filter(
      (doc) =>
        doc.document_number?.toLowerCase().includes(q) ||
        doc.clients?.name?.toLowerCase().includes(q) ||
        doc.total?.toString().includes(q)
    );
  }, [documents, searchQuery]);

  const totalAmount = useMemo(
    () => documents.reduce((sum, doc) => sum + (doc.total || 0), 0),
    [documents]
  );

  const totalTax = useMemo(
    () => documents.reduce((sum, doc) => sum + (doc.tax_amount || 0), 0),
    [documents]
  );

  const priceItemsSummary = useMemo(() => {
    const map = new Map<string, { count: number; totalQty: number; totalAmount: number }>();
    for (const doc of documents) {
      const items = (doc.line_items || []) as SharedLineItem[];
      for (const item of items) {
        const key = (item.description || 'Untitled').trim();
        const existing = map.get(key);
        if (existing) {
          existing.count += 1;
          existing.totalQty += item.quantity || 0;
          existing.totalAmount += item.total || 0;
        } else {
          map.set(key, { count: 1, totalQty: item.quantity || 0, totalAmount: item.total || 0 });
        }
      }
    }
    return [...map.entries()]
      .sort((a, b) => b[1].totalAmount - a[1].totalAmount);
  }, [documents]);

  const filteredPriceItems = useMemo(() => {
    if (!priceSearch) return priceItemsSummary;
    const q = priceSearch.toLowerCase();
    return priceItemsSummary.filter(([name]) => name.toLowerCase().includes(q));
  }, [priceItemsSummary, priceSearch]);

  const handleView = useCallback(async (doc: SharedDocumentRow) => {
    setPreviewLoading(true);
    try {
      const { data: fullDoc } = await supabase
        .from('documents')
        .select('*, clients(*)')
        .eq('id', doc.id)
        .single();

      if (!fullDoc) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', share?.userId)
        .single();

      const client = fullDoc.clients as Record<string, unknown> | null;

      setPreviewDoc({
        documentType: fullDoc.document_type,
        documentNumber: fullDoc.document_number || '',
        client: {
          name: (client?.name as string) || '',
          email: (client?.email as string) || null,
          phone: (client?.phone as string) || null,
          address: (client?.address as string) || null,
        },
        from: {
          name: profile?.full_name || null,
          businessName: profile?.business_name || null,
          email: profile?.email || null,
          phone: profile?.phone || null,
          address: profile?.address || null,
          website: profile?.website || null,
        },
        lineItems: (fullDoc.line_items as Array<Record<string, unknown>>) || [],
        subtotal: fullDoc.subtotal || 0,
        taxRate: fullDoc.tax_rate || 0,
        taxAmount: fullDoc.tax_amount || 0,
        total: fullDoc.total || 0,
        date: fullDoc.created_at || new Date().toISOString(),
        dueDate: fullDoc.due_date || null,
        notes: fullDoc.notes || null,
      });
    } catch {
      // Preview failed
    } finally {
      setPreviewLoading(false);
    }
  }, [share?.userId]);

  const handleDownload = useCallback(async (doc: SharedDocumentRow) => {
    setDownloadingId(doc.id);
    try {
      const { data: fullDoc } = await supabase
        .from('documents')
        .select('*, clients(*)')
        .eq('id', doc.id)
        .single();

      if (!fullDoc) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', share?.userId)
        .single();

      const client = fullDoc.clients as Record<string, unknown> | null;

      const pdfData = {
        documentType: fullDoc.document_type,
        documentNumber: fullDoc.document_number || '',
        client: {
          name: (client?.name as string) || '',
          email: (client?.email as string) || null,
          phone: (client?.phone as string) || null,
          address: (client?.address as string) || null,
        },
        from: {
          name: profile?.full_name || null,
          businessName: profile?.business_name || null,
          email: profile?.email || null,
          phone: profile?.phone || null,
          address: profile?.address || null,
          website: profile?.website || null,
        },
        lineItems: (fullDoc.line_items as Array<Record<string, unknown>>) || [],
        subtotal: fullDoc.subtotal || 0,
        taxRate: fullDoc.tax_rate || 0,
        taxAmount: fullDoc.tax_amount || 0,
        total: fullDoc.total || 0,
        date: fullDoc.created_at || new Date().toISOString(),
        dueDate: fullDoc.due_date || null,
        notes: fullDoc.notes || null,
      };

      const blob = await generatePDF(pdfData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fullDoc.document_type}-${fullDoc.document_number || doc.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (share) {
        supabase
          .from('accountant_access_logs')
          .insert({ share_id: share.id, action: 'download', document_id: doc.id })
          .then(() => {});
      }
    } catch {
      // Download failed
    } finally {
      setDownloadingId(null);
    }
  }, [share]);

  const handleExportExcel = useCallback(() => {
    if (!documents.length) return;

    const today = new Date().toISOString().split('T')[0];
    const xml = buildExcelXml(documents);
    downloadExcelXml(xml, `invoices-export-${today}.xls`);

    if (share) {
      supabase
        .from('accountant_access_logs')
        .insert({ share_id: share.id, action: 'export_excel' })
        .then(() => {});
    }
  }, [documents, share]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  if (isLoading) {
    return (
      <div class="min-h-screen flex items-center justify-center bg-[var(--gray-50,#f8fafc)]">
        <Loader2 size={32} class="animate-spin text-[var(--blu-primary,#0066ff)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div class="min-h-screen flex items-center justify-center bg-[var(--gray-50,#f8fafc)] px-5">
        <div class="flex flex-col items-center text-center max-w-[320px]">
          <div class="w-20 h-20 flex items-center justify-center bg-red-100 rounded-full mb-5">
            <AlertCircle size={40} strokeWidth={1.5} class="text-red-500" />
          </div>
          <h1 class="text-xl font-bold text-[var(--gray-900,#0f172a)] m-0 mb-2">
            Link Invalid or Expired
          </h1>
          <p class="text-[15px] text-[var(--gray-500,#64748b)] m-0 leading-relaxed">
            This share link is no longer active. Please contact the person who shared these documents for a new link.
          </p>
        </div>
      </div>
    );
  }

  if (previewDoc) {
    const docData = {
      documentType: (previewDoc.documentType as string) || 'invoice',
      documentNumber: (previewDoc.documentNumber as string) || '',
      client: (previewDoc.client as { name: string; email?: string; phone?: string; address?: string }) || { name: '' },
      from: (previewDoc.from as { name?: string; businessName?: string; email?: string; phone?: string; address?: string; website?: string }) || {},
      lineItems: ((previewDoc.lineItems as Array<Record<string, unknown>>) || []).map((item) => ({
        description: (item.description as string) || '',
        quantity: (item.quantity as number) || 1,
        unit: (item.unit as string) || 'unit',
        rate: (item.rate as number) || 0,
        total: (item.total as number) || 0,
        measurementType: item.measurementType as string | undefined,
        dimensions: item.dimensions as string | undefined,
        notes: (item.notes as string) || '',
      })),
      subtotal: (previewDoc.subtotal as number) || 0,
      taxRate: (previewDoc.taxRate as number) || 0,
      taxAmount: (previewDoc.taxAmount as number) || 0,
      total: (previewDoc.total as number) || 0,
      date: (previewDoc.date as string) || new Date().toISOString(),
      dueDate: (previewDoc.dueDate as string) || undefined,
      notes: (previewDoc.notes as string) || undefined,
    };

    return (
      <div class="min-h-screen bg-[var(--gray-50,#f8fafc)]">
        <style>{sharedViewStyles}</style>
        <header class="sv-header">
          <button class="sv-back-btn" onClick={() => setPreviewDoc(null)}>
            <ChevronLeft size={20} />
            Back
          </button>
          <span class="sv-header-title">{docData.documentNumber}</span>
          <div class="w-10" />
        </header>
        <div class="sv-preview-container">
          <DocumentTemplate document={docData} />
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-[var(--gray-50,#f8fafc)]" style={{ position: 'relative' }}>
      <BackgroundBlobs variant="full" intensity="subtle" />
      <style>{sharedViewStyles}</style>

      <header class="sv-main-header">
        <div class="sv-brand">
          <div class="sv-brand-icon">
            <Share2 size={20} />
          </div>
          <div class="sv-brand-text">
            <h1 class="sv-brand-title">Shared Invoices</h1>
            <p class="sv-brand-subtitle">View Only</p>
          </div>
          {documents.length > 0 && (
            <button class="sv-export-btn" onClick={handleExportExcel}>
              <FileSpreadsheet size={16} />
              Export Excel
            </button>
          )}
        </div>
      </header>

      <div class="sv-container">
        {/* Summary */}
        <div class="sv-summary">
          <div class="sv-summary-item">
            <span class="sv-summary-value">{documents.length}</span>
            <span class="sv-summary-label">Documents</span>
          </div>
          <div class="sv-summary-divider" />
          <div class="sv-summary-item">
            <span class="sv-summary-value">{formatCurrency(totalAmount)}</span>
            <span class="sv-summary-label">Total</span>
          </div>
          <div class="sv-summary-divider" />
          <div class="sv-summary-item">
            <span class="sv-summary-value sv-summary-tax">{formatCurrency(totalTax)}</span>
            <span class="sv-summary-label">Tax Paid</span>
          </div>
        </div>

        {/* Price Items Summary */}
        {priceItemsSummary.length > 0 && (
          <div class="sv-price-summary">
            <div class="sv-price-header">
              <h2 class="sv-section-title">Price Items Summary</h2>
              <span class="sv-price-count">{priceItemsSummary.length} items</span>
            </div>
            {priceItemsSummary.length > 5 && (
              <div class="sv-price-search-wrap">
                <Search size={14} class="sv-price-search-icon" />
                <input
                  type="text"
                  class="sv-price-search"
                  placeholder="Search items..."
                  value={priceSearch}
                  onInput={(e) => setPriceSearch((e.target as HTMLInputElement).value)}
                />
                {priceSearch && (
                  <button class="sv-price-search-clear" onClick={() => setPriceSearch('')}>
                    <X size={12} />
                  </button>
                )}
              </div>
            )}
            <table class="sv-price-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Used</th>
                  <th>Qty</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredPriceItems.map(([name, data]) => (
                  <tr key={name}>
                    <td class="sv-price-name">{name}</td>
                    <td>{data.count}x</td>
                    <td>{data.totalQty}</td>
                    <td>{formatCurrency(data.totalAmount)}</td>
                  </tr>
                ))}
                {filteredPriceItems.length === 0 && (
                  <tr>
                    <td colSpan={4} class="sv-price-empty">No matching items</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Search */}
        {documents.length > 0 && (
          <div class="sv-search-wrap">
            <input
              type="text"
              class="sv-search-input"
              placeholder="Search documents..."
              value={searchQuery}
              onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
            />
            {searchQuery && (
              <button class="sv-search-clear" onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* Document list */}
        <div class="sv-doc-list">
          {filteredDocs.map((doc) => {
            const isExpanded = expandedId === doc.id;
            const lineItems = (doc.line_items || []) as SharedLineItem[];
            const hasLineItems = lineItems.length > 0;

            return (
              <div key={doc.id} class="sv-doc-card-wrap">
                <div class="sv-doc-card">
                  <div
                    class={`sv-doc-main ${hasLineItems ? 'sv-doc-expandable' : ''}`}
                    onClick={hasLineItems ? () => toggleExpand(doc.id) : undefined}
                  >
                    <div class="sv-doc-icon">
                      <Receipt size={18} strokeWidth={1.5} />
                    </div>
                    <div class="sv-doc-info">
                      <p class="sv-doc-number">{doc.document_number || '-'}</p>
                      <p class="sv-doc-client">{doc.clients?.name || '-'}</p>
                      <p class="sv-doc-meta">
                        {formatDate(doc.created_at)}
                        <span class={`sv-status sv-status-${doc.status}`}>{doc.status}</span>
                      </p>
                    </div>
                    <div class="sv-doc-right">
                      <span class="sv-doc-amount">{formatCurrency(doc.total)}</span>
                      {(doc.tax_amount || 0) > 0 && (
                        <span class="sv-doc-tax">{formatCurrency(doc.tax_amount)} tax</span>
                      )}
                      <div class="sv-doc-actions">
                        {share?.canView && (
                          <button
                            class="sv-action-btn"
                            onClick={(e) => { e.stopPropagation(); handleView(doc); }}
                            disabled={previewLoading}
                            aria-label="View"
                          >
                            {previewLoading ? <Loader2 size={14} class="animate-spin" /> : <Eye size={14} />}
                          </button>
                        )}
                        {share?.canDownload && (
                          <button
                            class="sv-action-btn"
                            onClick={(e) => { e.stopPropagation(); handleDownload(doc); }}
                            disabled={downloadingId === doc.id}
                            aria-label="Download PDF"
                          >
                            {downloadingId === doc.id ? <Loader2 size={14} class="animate-spin" /> : <Download size={14} />}
                          </button>
                        )}
                        {hasLineItems && (
                          <div class={`sv-expand-icon ${isExpanded ? 'sv-expand-open' : ''}`}>
                            <ChevronDown size={14} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && hasLineItems && (
                    <div class="sv-line-items">
                      <table class="sv-li-table">
                        <thead>
                          <tr>
                            <th>Description</th>
                            <th>Qty</th>
                            <th>Rate</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lineItems.map((item, i) => (
                            <tr key={i}>
                              <td>{item.description || '-'}</td>
                              <td>{item.quantity} {item.unit || ''}</td>
                              <td>{formatCurrency(item.rate || 0)}</td>
                              <td>{formatCurrency(item.total || 0)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filteredDocs.length === 0 && (
            <div class="sv-empty">
              <FileText size={32} class="text-[var(--gray-300,#cbd5e1)]" />
              <p>No documents found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const sharedViewStyles = `
  .sv-main-header {
    position: relative;
    z-index: 1;
    padding: 20px 20px 16px;
    padding-top: calc(20px + env(safe-area-inset-top, 0px));
  }

  .sv-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 600px;
    margin: 0 auto;
  }

  .sv-brand-text { flex: 1; }

  .sv-brand-icon {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    background: rgba(0, 102, 255, 0.08);
    color: var(--blu-primary, #0066ff);
    flex-shrink: 0;
  }

  .sv-brand-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--gray-900, #0f172a);
    margin: 0;
  }

  .sv-brand-subtitle {
    font-size: 13px;
    color: var(--gray-400, #94a3b8);
    margin: 2px 0 0;
  }

  .sv-export-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
    border: none;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: all 100ms ease;
    flex-shrink: 0;
    min-height: 44px;
  }

  .sv-export-btn:active { transform: scale(0.97); }

  .sv-container {
    position: relative;
    z-index: 1;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  }

  .sv-summary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    padding: 20px 16px;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    margin-bottom: 16px;
  }

  .sv-price-summary {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    padding: 16px;
    margin-bottom: 16px;
  }

  .sv-price-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .sv-section-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--gray-900, #0f172a);
    margin: 0;
  }

  .sv-price-count {
    font-size: 12px;
    color: var(--gray-400, #94a3b8);
    font-weight: 500;
  }

  .sv-price-search-wrap {
    position: relative;
    margin-bottom: 12px;
  }

  .sv-price-search-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--gray-400, #94a3b8);
    pointer-events: none;
  }

  .sv-price-search {
    width: 100%;
    padding: 8px 32px 8px 32px;
    border-radius: 8px;
    border: 1px solid var(--gray-200, #e2e8f0);
    background: rgba(255, 255, 255, 0.6);
    font-size: 13px;
    font-family: inherit;
    color: var(--gray-900, #0f172a);
    outline: none;
    box-sizing: border-box;
  }

  .sv-price-search:focus { border-color: var(--blu-primary, #0066ff); }
  .sv-price-search::placeholder { color: var(--gray-400, #94a3b8); }

  .sv-price-search-clear {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--gray-200, #e2e8f0);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    color: var(--gray-500, #64748b);
  }

  .sv-price-empty {
    text-align: center !important;
    color: var(--gray-400, #94a3b8);
    padding: 16px 0 !important;
    font-size: 13px;
  }

  .sv-price-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .sv-price-table th {
    text-align: left;
    font-weight: 600;
    font-size: 11px;
    color: var(--gray-500, #64748b);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    padding: 0 8px 8px 0;
    border-bottom: 1px solid var(--gray-200, #e2e8f0);
  }

  .sv-price-table th:nth-child(2),
  .sv-price-table th:nth-child(3),
  .sv-price-table th:last-child,
  .sv-price-table td:nth-child(2),
  .sv-price-table td:nth-child(3),
  .sv-price-table td:last-child { text-align: right; padding-right: 0; }

  .sv-price-table td {
    padding: 8px 8px 8px 0;
    color: var(--gray-700, #334155);
    border-bottom: 1px solid var(--gray-100, #f1f5f9);
  }

  .sv-price-table tr:last-child td { border-bottom: none; }

  .sv-price-name {
    font-weight: 500;
    color: var(--gray-900, #0f172a);
  }

  .sv-summary-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    min-width: 0;
  }

  .sv-summary-value {
    font-size: 18px;
    font-weight: 700;
    color: var(--gray-900, #0f172a);
    white-space: nowrap;
  }

  .sv-summary-tax { color: #d97706; }

  .sv-summary-label {
    font-size: 12px;
    color: var(--gray-500, #64748b);
  }

  .sv-summary-divider {
    width: 1px;
    height: 32px;
    background: var(--gray-200, #e2e8f0);
    flex-shrink: 0;
  }

  .sv-search-wrap {
    position: relative;
    margin-bottom: 16px;
  }

  .sv-search-input {
    width: 100%;
    padding: 12px 40px 12px 16px;
    border-radius: 12px;
    border: 1.5px solid var(--gray-200, #e2e8f0);
    background: #fff;
    font-size: 15px;
    font-family: inherit;
    color: var(--gray-900, #0f172a);
    outline: none;
    box-sizing: border-box;
  }

  .sv-search-input:focus { border-color: var(--blu-primary, #0066ff); }
  .sv-search-input::placeholder { color: var(--gray-400, #94a3b8); }

  .sv-search-clear {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--gray-200, #e2e8f0);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    color: var(--gray-500, #64748b);
  }

  .sv-doc-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .sv-doc-card-wrap {}

  .sv-doc-card {
    background: #fff;
    border-radius: 14px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    overflow: hidden;
  }

  .sv-doc-main {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
  }

  .sv-doc-expandable { cursor: pointer; }
  .sv-doc-expandable:active { background: var(--gray-50, #f8fafc); }

  .sv-doc-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: rgba(52, 199, 89, 0.12);
    color: #34C759;
    flex-shrink: 0;
  }

  .sv-doc-info {
    flex: 1;
    min-width: 0;
  }

  .sv-doc-number {
    font-size: 14px;
    font-weight: 600;
    color: var(--gray-900, #0f172a);
    margin: 0;
  }

  .sv-doc-client {
    font-size: 13px;
    color: var(--gray-600, #475569);
    margin: 2px 0 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sv-doc-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--gray-400, #94a3b8);
    margin: 4px 0 0;
  }

  .sv-status {
    padding: 1px 6px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    text-transform: capitalize;
  }

  .sv-status-draft { background: var(--gray-100, #f1f5f9); color: var(--gray-600, #475569); }
  .sv-status-sent { background: rgba(0, 102, 255, 0.08); color: var(--blu-primary, #0066ff); }
  .sv-status-paid { background: rgba(16, 185, 129, 0.1); color: #059669; }

  .sv-doc-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    flex-shrink: 0;
  }

  .sv-doc-amount {
    font-size: 15px;
    font-weight: 700;
    color: #10b981;
  }

  .sv-doc-tax {
    font-size: 11px;
    color: #d97706;
    font-weight: 500;
  }

  .sv-doc-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .sv-expand-icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--gray-400, #94a3b8);
    transition: transform 150ms ease;
  }

  .sv-expand-open { transform: rotate(180deg); }

  .sv-action-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    border: none;
    background: var(--gray-100, #f1f5f9);
    color: var(--gray-600, #475569);
    cursor: pointer;
    transition: all 100ms ease;
  }

  .sv-action-btn:hover { background: var(--gray-200, #e2e8f0); }
  .sv-action-btn:active { transform: scale(0.95); }
  .sv-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .sv-line-items {
    border-top: 1px solid var(--gray-100, #f1f5f9);
    padding: 12px 16px 14px;
    background: var(--gray-50, #f8fafc);
  }

  .sv-li-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .sv-li-table th {
    text-align: left;
    font-weight: 600;
    font-size: 11px;
    color: var(--gray-500, #64748b);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    padding: 0 8px 8px 0;
    border-bottom: 1px solid var(--gray-200, #e2e8f0);
  }

  .sv-li-table th:last-child,
  .sv-li-table td:last-child { text-align: right; padding-right: 0; }

  .sv-li-table td {
    padding: 8px 8px 8px 0;
    color: var(--gray-700, #334155);
    border-bottom: 1px solid var(--gray-100, #f1f5f9);
  }

  .sv-li-table tr:last-child td { border-bottom: none; }

  .sv-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 40px 20px;
    color: var(--gray-400, #94a3b8);
    font-size: 14px;
  }

  /* Preview */
  .sv-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    padding-top: calc(12px + env(safe-area-inset-top, 0px));
    background: #fff;
    border-bottom: 1px solid var(--gray-100, #f1f5f9);
  }

  .sv-back-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    background: none;
    border: none;
    color: var(--blu-primary, #0066ff);
    font-size: 15px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    padding: 8px 0;
  }

  .sv-header-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--gray-900, #0f172a);
  }

  .sv-preview-container {
    max-width: 900px;
    margin: 20px auto;
    padding: 0 20px;
  }
`;
