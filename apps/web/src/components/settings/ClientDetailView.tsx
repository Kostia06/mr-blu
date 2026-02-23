import { useState, useEffect, useCallback } from 'preact/hooks';
import {
  Loader2,
  Mail,
  Phone,
  MapPin,
  Pencil,
  Check,
  X,
  Receipt,
  FileText,
  Calculator,
  ChevronRight,
  FileQuestion,
  StickyNote,
} from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import { navigateTo } from '@/lib/navigation';
import { listClients, updateClient, fetchClientDocuments } from '@/lib/api/clients';

interface ClientEntry {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
}

interface ClientDocument {
  id: string;
  document_type: string;
  document_number: string;
  total: number;
  status: string;
  created_at: string;
}

interface EditFields {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

function getStatusColor(status: string): { bg: string; text: string } {
  switch (status) {
    case 'paid':
      return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' };
    case 'sent':
      return { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' };
    case 'overdue':
      return { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' };
    default:
      return { bg: 'rgba(148, 163, 184, 0.1)', text: '#94a3b8' };
  }
}

function getDocIcon(type: string) {
  if (type === 'invoice') return <Receipt size={18} strokeWidth={1.5} />;
  if (type === 'estimate') return <Calculator size={18} strokeWidth={1.5} />;
  return <FileText size={18} strokeWidth={1.5} />;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function ClientDetailView({ clientId }: { clientId: string }) {
  const { t } = useI18nStore();
  const [client, setClient] = useState<ClientEntry | null>(null);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [docsLoading, setDocsLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editFields, setEditFields] = useState<EditFields>({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });

  const loadClient = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listClients();
      const found = result.items.find((c) => c.id === clientId);
      if (found) setClient(found);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const loadDocuments = useCallback(async () => {
    setDocsLoading(true);
    try {
      const docs = await fetchClientDocuments(clientId);
      setDocuments(docs);
    } catch {
      // silently fail
    } finally {
      setDocsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadClient();
    loadDocuments();
  }, [loadClient, loadDocuments]);

  function startEdit() {
    if (!client) return;
    setEditFields({
      name: client.name,
      email: client.email ?? '',
      phone: client.phone ?? '',
      address: client.address ?? '',
      notes: client.notes ?? '',
    });
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  async function saveEdit() {
    if (!client || !editFields.name.trim()) return;
    try {
      await updateClient(client.id, {
        name: editFields.name.trim(),
        email: editFields.email.trim() || undefined,
        phone: editFields.phone.trim() || undefined,
        notes: editFields.notes.trim() || undefined,
      });
      setClient({
        ...client,
        name: editFields.name.trim(),
        email: editFields.email.trim() || null,
        phone: editFields.phone.trim() || null,
        address: editFields.address.trim() || null,
        notes: editFields.notes.trim() || null,
      });
    } catch {
      // silently fail
    } finally {
      setEditing(false);
    }
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <SettingsPageHeader
          title="Client"
          backHref="/dashboard/settings/clients"
          backLabel={t('clients.backToSettings')}
        />
        <div style={styles.centered}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand-blue, #0066ff)' }} />
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }

  if (!client) {
    return (
      <main style={styles.page}>
        <SettingsPageHeader
          title="Client"
          backHref="/dashboard/settings/clients"
          backLabel={t('clients.backToSettings')}
        />
        <div style={styles.centered}>
          <FileQuestion size={40} style={{ color: 'var(--gray-300, #cbd5e1)' }} />
          <p style={styles.emptyText}>{t('clients.clientNotFound')}</p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <SettingsPageHeader
        title={client.name}
        backHref="/dashboard/settings/clients"
        backLabel={t('clients.backToSettings')}
        right={
          editing ? (
            <div style={{ display: 'flex', gap: 4 }}>
              <button style={styles.headerBtn} onClick={saveEdit} aria-label="Save">
                <Check size={18} style={{ color: '#10b981' }} />
              </button>
              <button style={styles.headerBtn} onClick={cancelEdit} aria-label="Cancel">
                <X size={18} style={{ color: '#94a3b8' }} />
              </button>
            </div>
          ) : (
            <button style={styles.headerBtn} onClick={startEdit} aria-label="Edit">
              <Pencil size={16} style={{ color: '#64748b' }} />
            </button>
          )
        }
      />

      <div style={styles.content}>
        {/* Client Info Card */}
        <div style={styles.card}>
          <div style={styles.infoHeader}>
            <div style={styles.avatar}>
              {client.name.charAt(0).toUpperCase()}
            </div>
            {editing ? (
              <input
                type="text"
                value={editFields.name}
                onInput={(e) =>
                  setEditFields((f) => ({ ...f, name: (e.target as HTMLInputElement).value }))
                }
                style={styles.editNameInput}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit();
                  if (e.key === 'Escape') cancelEdit();
                }}
              />
            ) : (
              <span style={styles.clientName}>{client.name}</span>
            )}
          </div>

          {editing ? (
            <div style={styles.editFields}>
              <div style={styles.editFieldRow}>
                <Mail size={14} style={{ color: 'var(--gray-400)', flexShrink: '0' }} />
                <input
                  type="email"
                  value={editFields.email}
                  onInput={(e) =>
                    setEditFields((f) => ({ ...f, email: (e.target as HTMLInputElement).value }))
                  }
                  placeholder="Email"
                  style={styles.editFieldInput}
                />
              </div>
              <div style={styles.editFieldRow}>
                <Phone size={14} style={{ color: 'var(--gray-400)', flexShrink: '0' }} />
                <input
                  type="tel"
                  value={editFields.phone}
                  onInput={(e) =>
                    setEditFields((f) => ({ ...f, phone: (e.target as HTMLInputElement).value }))
                  }
                  placeholder="Phone"
                  style={styles.editFieldInput}
                />
              </div>
              <div style={styles.editFieldRow}>
                <MapPin size={14} style={{ color: 'var(--gray-400)', flexShrink: '0' }} />
                <input
                  type="text"
                  value={editFields.address}
                  onInput={(e) =>
                    setEditFields((f) => ({ ...f, address: (e.target as HTMLInputElement).value }))
                  }
                  placeholder="Address"
                  style={styles.editFieldInput}
                />
              </div>
              <div style={styles.editFieldRow}>
                <StickyNote size={14} style={{ color: 'var(--gray-400)', flexShrink: '0', alignSelf: 'flex-start', marginTop: 6 }} />
                <textarea
                  value={editFields.notes}
                  onInput={(e) =>
                    setEditFields((f) => ({ ...f, notes: (e.target as HTMLTextAreaElement).value }))
                  }
                  placeholder={t('clients.notesPlaceholder')}
                  style={styles.notesInput}
                  rows={3}
                />
              </div>
            </div>
          ) : (
            <div style={styles.detailRows}>
              {client.email && (
                <div style={styles.detailRow}>
                  <Mail size={14} style={{ color: 'var(--gray-400, #94a3b8)', flexShrink: '0' }} />
                  <span style={styles.detailText}>{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div style={styles.detailRow}>
                  <Phone size={14} style={{ color: 'var(--gray-400, #94a3b8)', flexShrink: '0' }} />
                  <span style={styles.detailText}>{client.phone}</span>
                </div>
              )}
              {client.address && (
                <div style={styles.detailRow}>
                  <MapPin size={14} style={{ color: 'var(--gray-400, #94a3b8)', flexShrink: '0' }} />
                  <span style={styles.detailText}>{client.address}</span>
                </div>
              )}
              {client.notes && (
                <div style={styles.notesDisplay}>
                  <StickyNote size={14} style={{ color: 'var(--gray-400, #94a3b8)', flexShrink: '0' }} />
                  <span style={styles.notesText}>{client.notes}</span>
                </div>
              )}
              {!client.email && !client.phone && !client.address && !client.notes && (
                <span style={styles.noDetails}>{t('clients.noContactInfo')}</span>
              )}
            </div>
          )}
        </div>

        {/* Documents Section */}
        <h2 style={styles.sectionTitle}>{t('clients.documents')}</h2>

        {docsLoading ? (
          <div style={styles.centered}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand-blue, #0066ff)' }} />
          </div>
        ) : documents.length === 0 ? (
          <div style={styles.emptyDocs}>
            <FileText size={32} style={{ color: 'var(--gray-300, #cbd5e1)' }} />
            <p style={styles.emptyText}>{t('clients.noDocuments')}</p>
          </div>
        ) : (
          <div style={styles.docList}>
            {documents.map((doc) => {
              const statusStyle = getStatusColor(doc.status);
              return (
                <button
                  key={doc.id}
                  style={styles.docRow}
                  onClick={() => navigateTo(`/dashboard/documents/${doc.id}?type=${doc.document_type}`)}
                >
                  <div style={styles.docIcon}>{getDocIcon(doc.document_type)}</div>
                  <div style={styles.docInfo}>
                    <span style={styles.docNumber}>
                      {doc.document_number || doc.document_type}
                    </span>
                    <span style={styles.docDate}>{formatDate(doc.created_at)}</span>
                  </div>
                  <div style={styles.docRight}>
                    {doc.total > 0 && (
                      <span style={styles.docTotal}>{formatAmount(doc.total)}</span>
                    )}
                    <span
                      style={{
                        ...styles.statusBadge,
                        background: statusStyle.bg,
                        color: statusStyle.text,
                      }}
                    >
                      {doc.status}
                    </span>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--gray-300, #cbd5e1)', flexShrink: '0' }} />
                </button>
              );
            })}
          </div>
        )}

        <p style={styles.countText}>
          {documents.length} {documents.length === 1 ? 'document' : 'documents'}
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}

const styles: Record<string, Record<string, string | number>> = {
  page: {
    minHeight: '100vh',
    background: 'transparent',
  },
  content: {
    padding: '0 20px 100px',
    maxWidth: 600,
    width: '100%',
    margin: '0 auto',
  },
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: '60px 20px',
    textAlign: 'center',
  },
  card: {
    background: 'rgba(255,255,255,0.5)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.5)',
    borderRadius: 16,
    padding: 16,
  },
  infoHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 102, 255, 0.1)',
    borderRadius: '50%',
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--blu-primary, #0066ff)',
    flexShrink: 0,
  },
  clientName: {
    fontSize: 17,
    fontWeight: 700,
    color: 'var(--gray-900, #0f172a)',
  },
  editNameInput: {
    flex: 1,
    border: '1.5px solid var(--blu-primary, #0066ff)',
    background: 'rgba(255,255,255,0.8)',
    borderRadius: 10,
    padding: '6px 10px',
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--gray-900, #0f172a)',
    outline: 'none',
    fontFamily: 'inherit',
  },
  headerBtn: {
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.5)',
    backdropFilter: 'blur(12px)',
    border: 'none',
    borderRadius: 14,
    cursor: 'pointer',
  },
  detailRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: 'var(--gray-500, #64748b)',
  },
  noDetails: {
    fontSize: 13,
    color: 'var(--gray-400, #94a3b8)',
    fontStyle: 'italic',
  },
  editFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  editFieldRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  editFieldInput: {
    flex: 1,
    border: '1px solid var(--gray-200, #e2e8f0)',
    background: 'rgba(255,255,255,0.8)',
    borderRadius: 10,
    padding: '6px 10px',
    fontSize: 13,
    color: 'var(--gray-900, #0f172a)',
    outline: 'none',
    fontFamily: 'inherit',
  },
  notesInput: {
    flex: 1,
    border: '1px solid var(--gray-200, #e2e8f0)',
    background: 'rgba(255,255,255,0.8)',
    borderRadius: 10,
    padding: '6px 10px',
    fontSize: 13,
    color: 'var(--gray-900, #0f172a)',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: 48,
  },
  notesDisplay: {
    display: 'flex',
    gap: 8,
    marginTop: 4,
    padding: '8px 0',
    borderTop: '1px solid rgba(0,0,0,0.04)',
  },
  notesText: {
    fontSize: 13,
    color: 'var(--gray-400, #94a3b8)',
    fontStyle: 'italic',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    lineHeight: 1.4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--gray-900, #0f172a)',
    margin: '24px 0 12px',
    letterSpacing: '-0.01em',
  },
  emptyDocs: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '40px 20px',
    textAlign: 'center',
  },
  emptyText: {
    margin: 0,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--gray-400, #94a3b8)',
  },
  docList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  docRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    background: 'rgba(255,255,255,0.5)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.5)',
    borderRadius: 14,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    fontFamily: 'inherit',
  },
  docIcon: {
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 102, 255, 0.08)',
    borderRadius: 10,
    color: 'var(--blu-primary, #0066ff)',
    flexShrink: 0,
  },
  docInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  },
  docNumber: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--gray-900, #0f172a)',
    textTransform: 'capitalize',
  },
  docDate: {
    fontSize: 12,
    color: 'var(--gray-400, #94a3b8)',
  },
  docRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
  },
  docTotal: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--gray-900, #0f172a)',
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 6,
    textTransform: 'capitalize',
  },
  countText: {
    textAlign: 'center',
    fontSize: 12,
    color: 'var(--gray-400, #94a3b8)',
    marginTop: 16,
  },
};
