import { useState, useCallback } from 'preact/hooks';
import { Download, Loader2 } from 'lucide-react';
import { generatePDF } from '@/lib/api/documents';

interface LineItem {
  description: string;
  quantity?: number;
  unit: string;
  rate?: number;
  total: number;
  measurementType?: string;
  dimensions?: string;
}

interface DocumentData {
  id: string;
  title: string;
  documentType: string;
  documentNumber: string;
  client: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  from: {
    name?: string | null;
    businessName?: string;
    email?: string | null;
    phone?: string | null;
    address?: string;
    website?: string;
  };
  lineItems: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  date: string;
  dueDate?: string;
  notes?: string;
  terms?: string;
  status: string;
}

interface DocumentViewPageProps {
  document: DocumentData;
  shareToken: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function buildDetailsSubtext(item: LineItem): string {
  const parts: string[] = [];
  if (item.quantity && item.quantity !== 1) parts.push(`${item.quantity}`);
  if (item.unit && item.unit !== 'unit') parts.push(item.unit);
  if (item.rate) parts.push(`@ ${formatCurrency(item.rate)}`);
  if (item.dimensions) parts.push(item.dimensions);
  return parts.join(' ');
}

export function DocumentViewPage({ document: doc, shareToken }: DocumentViewPageProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const blob = await generatePDF({ ...doc, shareToken } as unknown as Record<string, unknown>);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${doc.documentType}-${doc.documentNumber}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [doc, shareToken, isGenerating]);

  const fromName = doc.from.name || '';
  const fromBusinessName = doc.from.businessName || '';
  const showBusinessName = fromBusinessName && fromBusinessName !== fromName;
  const isEstimate = doc.documentType.toLowerCase() === 'estimate';
  const dateLabel = isEstimate ? 'Estimate Date' : 'Invoice Date';
  const dueDateLabel = isEstimate ? 'Valid Until' : 'Due Date';

  return (
    <main class="view-page">
      <div class="view-container">
        {/* Top bar: brand + download */}
        <header class="view-header">
          <span class="brand-name">Mr.Blu</span>
          <button class="download-btn" onClick={handleDownload} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 size={18} class="spinner" />
            ) : (
              <Download size={18} />
            )}
            <span>{isGenerating ? 'Generating...' : 'Download PDF'}</span>
          </button>
        </header>

        {/* Document Template */}
        <div class="document-template">
          {/* Header */}
          <div class="doc-header">
            <h1 class="doc-type">{doc.documentType}</h1>
            <p class="doc-number">{doc.documentNumber}</p>
          </div>

          {/* From / Bill To */}
          <div class="parties-section">
            <div class="party from">
              <p class="party-label">From</p>
              {fromName && <p class="party-name">{fromName}</p>}
              {showBusinessName && <p class="party-detail business-name">{fromBusinessName}</p>}
              {doc.from.email && <p class="party-detail">{doc.from.email}</p>}
              {doc.from.phone && <p class="party-detail">{doc.from.phone}</p>}
              {doc.from.address && <p class="party-detail">{doc.from.address}</p>}
              {doc.from.website && <p class="party-detail">{doc.from.website}</p>}
            </div>
            <div class="party to">
              <p class="party-label">Bill To</p>
              <p class="party-name">{doc.client.name}</p>
              {doc.client.email && <p class="party-detail">{doc.client.email}</p>}
              {doc.client.phone && <p class="party-detail">{doc.client.phone}</p>}
              {doc.client.address && <p class="party-detail">{doc.client.address}</p>}
            </div>
          </div>

          {/* Dates Bar */}
          <div class="dates-section">
            {doc.date && (
              <div class="date-item">
                <span class="date-label">{dateLabel}</span>
                <span class="date-value">{formatDate(doc.date)}</span>
              </div>
            )}
            {doc.dueDate && (
              <div class="date-item">
                <span class="date-label">{dueDateLabel}</span>
                <span class="date-value">{formatDate(doc.dueDate)}</span>
              </div>
            )}
          </div>

          {/* Line Items */}
          {doc.lineItems.length > 0 && (
            <div class="items-section">
              <table class="items-table">
                <thead>
                  <tr>
                    <th class="desc-col">Description</th>
                    <th class="total-col">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {doc.lineItems.map((item, index) => {
                    const subtext = buildDetailsSubtext(item);
                    return (
                      <tr key={index}>
                        <td class="desc-col">
                          {item.description}
                          {subtext && <span class="details-subtext">{subtext}</span>}
                        </td>
                        <td class="total-col">{formatCurrency(item.total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div class="totals-section">
            <div class="total-row">
              <span class="total-label">Subtotal</span>
              <span class="total-value">{formatCurrency(doc.subtotal)}</span>
            </div>
            {doc.taxAmount > 0 && (
              <div class="total-row">
                <span class="total-label">Tax ({doc.taxRate}%)</span>
                <span class="total-value">{formatCurrency(doc.taxAmount)}</span>
              </div>
            )}
            <div class="total-row grand-total">
              <span class="total-label">Total</span>
              <span class="total-value">{formatCurrency(doc.total)}</span>
            </div>
          </div>

          {/* Notes */}
          {doc.notes && (
            <div class="notes-terms-section">
              <div class="notes-block">
                <p class="notes-block-label">Notes</p>
                <p class="notes-block-text">{doc.notes}</p>
              </div>
            </div>
          )}

          {/* Terms */}
          {doc.terms && (
            <div class="notes-terms-section">
              <div class="terms-block">
                <p class="terms-block-label">Terms & Conditions</p>
                <p class="terms-block-text">{doc.terms}</p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div class="doc-footer">
            <p>Powered by mrblu</p>
          </div>
        </div>
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .view-page {
          min-height: 100vh;
          background: #f5f5f5;
          padding: 24px 16px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .view-container {
          max-width: 8.5in;
          margin: 0 auto;
        }

        /* Top bar */
        .view-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .brand-name {
          font-size: 20px;
          font-weight: 700;
          color: #0066ff;
          letter-spacing: -0.02em;
        }

        .download-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #0066ff;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .download-btn:hover:not(:disabled) {
          background: #0052cc;
          transform: translateY(-1px);
        }

        .download-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Document Template */
        .document-template {
          background: #ffffff;
          max-width: 8.5in;
          min-height: 11in;
          margin: 0 auto;
          padding: 48px;
          position: relative;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
        }

        /* Header */
        .doc-header {
          margin: -48px -48px 40px;
          padding: 48px 48px 32px;
          background: #f5f5f5;
        }

        .doc-type {
          font-size: 32px;
          font-weight: 700;
          color: #0066FF;
          margin: 0 0 4px;
          letter-spacing: -0.02em;
        }

        .doc-number {
          font-size: 12px;
          font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
          color: #6b7280;
          margin: 0;
        }

        /* From / Bill To */
        .parties-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          margin-bottom: 32px;
        }

        .party-label {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6b7280;
          margin: 0 0 8px;
        }

        .party-name {
          font-size: 14px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 4px;
        }

        .party-detail {
          font-size: 11px;
          color: #1a1a1a;
          margin: 0;
          line-height: 1.6;
        }

        .party-detail.business-name {
          font-weight: 500;
          color: #374151;
        }

        /* Dates Bar */
        .dates-section {
          display: flex;
          gap: 150px;
          margin-bottom: 32px;
          padding: 14px 24px;
          background: #f5f5f5;
          border-radius: 6px;
        }

        .date-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .date-label {
          font-size: 8px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6b7280;
        }

        .date-value {
          font-size: 11px;
          color: #1a1a1a;
          font-weight: 600;
        }

        /* Line Items Table */
        .items-section {
          margin-bottom: 24px;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
        }

        .items-table th {
          text-align: left;
          padding: 10px 0;
          font-size: 8px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6b7280;
          border-bottom: 2px solid #e5e7eb;
          background: transparent;
        }

        .items-table td {
          padding: 14px 0;
          font-size: 11px;
          color: #1a1a1a;
          border-bottom: 1px solid #f3f4f6;
          vertical-align: top;
        }

        .items-table tbody tr:last-child td {
          border-bottom: none;
        }

        .items-table th.total-col {
          text-align: right;
        }

        .items-table td.desc-col {
          font-weight: 600;
        }

        .details-subtext {
          display: block;
          font-size: 10px;
          font-weight: 400;
          font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
          color: #6b7280;
          margin-top: 3px;
        }

        .total-col {
          width: 120px;
          text-align: right;
        }

        .items-table td.total-col {
          font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
          font-weight: 700;
          color: #1a1a1a;
        }

        /* Totals */
        .totals-section {
          width: 220px;
          margin-left: auto;
          padding-top: 8px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 11px;
        }

        .total-label {
          color: #6b7280;
        }

        .total-value {
          font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
          color: #1a1a1a;
          font-weight: 500;
        }

        .grand-total {
          border-top: 2px solid #1a1a1a;
          margin-top: 8px;
          padding-top: 10px;
        }

        .grand-total .total-label {
          font-size: 14px;
          font-weight: 700;
          color: #1a1a1a;
        }

        .grand-total .total-value {
          font-size: 20px;
          font-weight: 700;
          color: #1a1a1a;
        }

        /* Notes & Terms */
        .notes-terms-section {
          margin-top: 32px;
        }

        .notes-block,
        .terms-block {
          margin-bottom: 20px;
        }

        .notes-block-label,
        .terms-block-label {
          font-size: 8px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6b7280;
          margin: 0 0 6px;
        }

        .notes-block-text,
        .terms-block-text {
          font-size: 10px;
          color: #6b7280;
          line-height: 1.5;
          margin: 0;
          white-space: pre-wrap;
        }

        /* Footer */
        .doc-footer {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: auto;
          padding-top: 16px;
          font-size: 11px;
          color: #0066FF;
        }

        .doc-footer p {
          margin: 0;
        }

        /* Mobile Responsive */
        @media (max-width: 600px) {
          .view-page {
            padding: 16px 12px;
          }

          .document-template {
            padding: 24px 20px;
            min-height: auto;
          }

          .doc-header {
            margin: -24px -20px 32px;
            padding: 24px 20px 24px;
          }

          .parties-section {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .dates-section {
            flex-direction: column;
            gap: 12px;
          }

          .doc-type {
            font-size: 28px;
          }

          .items-table th,
          .items-table td {
            padding: 12px 4px;
            font-size: 12px;
          }

          .total-col {
            width: 100px;
          }

          .totals-section {
            width: 100%;
          }

          .download-btn span {
            display: none;
          }

          .download-btn {
            padding: 10px;
          }
        }
      `}</style>
    </main>
  );
}
