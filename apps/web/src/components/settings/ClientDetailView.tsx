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

  const [saving, setSaving] = useState(false);

  async function saveEdit() {
    if (!client || !editFields.name.trim() || saving) return;
    setSaving(true);
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
      setSaving(false);
      setEditing(false);
    }
  }

  if (loading) {
    return (
      <main class="min-h-screen bg-transparent">
        <SettingsPageHeader
          title="Client"
          backHref="/dashboard/settings/clients"
          backLabel={t('clients.backToSettings')}
        />
        <div class="flex flex-col items-center justify-center gap-3 px-5 py-[60px] text-center">
          <Loader2 size={32} class="animate-spin text-[var(--brand-blue,#0066ff)]" />
        </div>
      </main>
    );
  }

  if (!client) {
    return (
      <main class="min-h-screen bg-transparent">
        <SettingsPageHeader
          title="Client"
          backHref="/dashboard/settings/clients"
          backLabel={t('clients.backToSettings')}
        />
        <div class="flex flex-col items-center justify-center gap-3 px-5 py-[60px] text-center">
          <FileQuestion size={40} class="text-[var(--gray-300,#cbd5e1)]" />
          <p class="m-0 text-sm font-medium text-[var(--gray-400,#94a3b8)]">{t('clients.clientNotFound')}</p>
        </div>
      </main>
    );
  }

  return (
    <main class="min-h-screen bg-transparent">
      <SettingsPageHeader
        title={client.name}
        backHref="/dashboard/settings/clients"
        backLabel={t('clients.backToSettings')}
        right={
          editing ? (
            <div class="flex gap-1">
              <button class="flex h-10 w-10 items-center justify-center bg-white/50 backdrop-blur-[12px] border-none rounded-[14px] cursor-pointer" onClick={saveEdit} disabled={saving} aria-label="Save">
                {saving ? <Loader2 size={18} class="animate-spin" /> : <Check size={18} class="text-emerald-500" />}
              </button>
              <button class="flex h-10 w-10 items-center justify-center bg-white/50 backdrop-blur-[12px] border-none rounded-[14px] cursor-pointer" onClick={cancelEdit} aria-label="Cancel">
                <X size={18} class="text-slate-400" />
              </button>
            </div>
          ) : (
            <button class="flex h-10 w-10 items-center justify-center bg-white/50 backdrop-blur-[12px] border-none rounded-[14px] cursor-pointer" onClick={startEdit} aria-label="Edit">
              <Pencil size={16} class="text-slate-500" />
            </button>
          )
        }
      />

      <div class="px-5 pb-[100px] max-w-[600px] w-full mx-auto">
        {/* Client Info Card */}
        <div class="bg-white/50 backdrop-blur-[12px] border border-white/50 rounded-2xl p-4">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-11 h-11 flex items-center justify-center bg-[rgba(0,102,255,0.1)] rounded-full text-lg font-bold text-[var(--blu-primary,#0066ff)] shrink-0">
              {client.name.charAt(0).toUpperCase()}
            </div>
            {editing ? (
              <input
                type="text"
                value={editFields.name}
                onInput={(e) =>
                  setEditFields((f) => ({ ...f, name: (e.target as HTMLInputElement).value }))
                }
                class="flex-1 border-[1.5px] border-[var(--blu-primary,#0066ff)] bg-white/80 rounded-[10px] px-2.5 py-1.5 text-[15px] font-semibold text-[var(--gray-900,#0f172a)] outline-none font-[inherit]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit();
                  if (e.key === 'Escape') cancelEdit();
                }}
              />
            ) : (
              <span class="text-[17px] font-bold text-[var(--gray-900,#0f172a)]">{client.name}</span>
            )}
          </div>

          {editing ? (
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <Mail size={14} class="text-[var(--gray-400)] shrink-0" />
                <input
                  type="email"
                  value={editFields.email}
                  onInput={(e) =>
                    setEditFields((f) => ({ ...f, email: (e.target as HTMLInputElement).value }))
                  }
                  placeholder="Email"
                  class="flex-1 border border-[var(--gray-200,#e2e8f0)] bg-white/80 rounded-[10px] px-2.5 py-1.5 text-[13px] text-[var(--gray-900,#0f172a)] outline-none font-[inherit]"
                />
              </div>
              <div class="flex items-center gap-2">
                <Phone size={14} class="text-[var(--gray-400)] shrink-0" />
                <input
                  type="tel"
                  value={editFields.phone}
                  onInput={(e) =>
                    setEditFields((f) => ({ ...f, phone: (e.target as HTMLInputElement).value }))
                  }
                  placeholder="Phone"
                  class="flex-1 border border-[var(--gray-200,#e2e8f0)] bg-white/80 rounded-[10px] px-2.5 py-1.5 text-[13px] text-[var(--gray-900,#0f172a)] outline-none font-[inherit]"
                />
              </div>
              <div class="flex items-center gap-2">
                <MapPin size={14} class="text-[var(--gray-400)] shrink-0" />
                <input
                  type="text"
                  value={editFields.address}
                  onInput={(e) =>
                    setEditFields((f) => ({ ...f, address: (e.target as HTMLInputElement).value }))
                  }
                  placeholder="Address"
                  class="flex-1 border border-[var(--gray-200,#e2e8f0)] bg-white/80 rounded-[10px] px-2.5 py-1.5 text-[13px] text-[var(--gray-900,#0f172a)] outline-none font-[inherit]"
                />
              </div>
              <div class="flex items-center gap-2">
                <StickyNote size={14} class="text-[var(--gray-400)] shrink-0 self-start mt-1.5" />
                <textarea
                  value={editFields.notes}
                  onInput={(e) =>
                    setEditFields((f) => ({ ...f, notes: (e.target as HTMLTextAreaElement).value }))
                  }
                  placeholder={t('clients.notesPlaceholder')}
                  class="flex-1 border border-[var(--gray-200,#e2e8f0)] bg-white/80 rounded-[10px] px-2.5 py-1.5 text-[13px] text-[var(--gray-900,#0f172a)] outline-none font-[inherit] resize-y min-h-[48px]"
                  rows={3}
                />
              </div>
            </div>
          ) : (
            <div class="flex flex-col gap-2">
              {client.email && (
                <div class="flex items-center gap-2">
                  <Mail size={14} class="text-[var(--gray-400,#94a3b8)] shrink-0" />
                  <span class="text-sm text-[var(--gray-500,#64748b)]">{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div class="flex items-center gap-2">
                  <Phone size={14} class="text-[var(--gray-400,#94a3b8)] shrink-0" />
                  <span class="text-sm text-[var(--gray-500,#64748b)]">{client.phone}</span>
                </div>
              )}
              {client.address && (
                <div class="flex items-center gap-2">
                  <MapPin size={14} class="text-[var(--gray-400,#94a3b8)] shrink-0" />
                  <span class="text-sm text-[var(--gray-500,#64748b)]">{client.address}</span>
                </div>
              )}
              {client.notes && (
                <div class="flex gap-2 mt-1 py-2 border-t border-black/[0.04]">
                  <StickyNote size={14} class="text-[var(--gray-400,#94a3b8)] shrink-0" />
                  <span class="text-[13px] text-[var(--gray-400,#94a3b8)] italic whitespace-pre-wrap break-words leading-[1.4]">{client.notes}</span>
                </div>
              )}
              {!client.email && !client.phone && !client.address && !client.notes && (
                <span class="text-[13px] text-[var(--gray-400,#94a3b8)] italic">{t('clients.noContactInfo')}</span>
              )}
            </div>
          )}
        </div>

        {/* Documents Section */}
        <h2 class="text-[15px] font-bold text-[var(--gray-900,#0f172a)] mt-6 mb-3 tracking-[-0.01em]">{t('clients.documents')}</h2>

        {docsLoading ? (
          <div class="flex flex-col items-center justify-center gap-3 px-5 py-[60px] text-center">
            <Loader2 size={24} class="animate-spin text-[var(--brand-blue,#0066ff)]" />
          </div>
        ) : documents.length === 0 ? (
          <div class="flex flex-col items-center gap-2 px-5 py-10 text-center">
            <FileText size={32} class="text-[var(--gray-300,#cbd5e1)]" />
            <p class="m-0 text-sm font-medium text-[var(--gray-400,#94a3b8)]">{t('clients.noDocuments')}</p>
          </div>
        ) : (
          <div class="flex flex-col gap-1.5">
            {documents.map((doc) => {
              const statusStyle = getStatusColor(doc.status);
              return (
                <button
                  key={doc.id}
                  class="flex items-center gap-3 px-3.5 py-3 bg-white/50 backdrop-blur-[12px] border border-white/50 rounded-[14px] cursor-pointer text-left w-full font-[inherit]"
                  onClick={() => navigateTo(`/dashboard/documents/${doc.id}?type=${doc.document_type}`)}
                >
                  <div class="w-9 h-9 flex items-center justify-center bg-[rgba(0,102,255,0.08)] rounded-[10px] text-[var(--blu-primary,#0066ff)] shrink-0">
                    {getDocIcon(doc.document_type)}
                  </div>
                  <div class="flex-1 flex flex-col gap-0.5 min-w-0">
                    <span class="text-sm font-semibold text-[var(--gray-900,#0f172a)] capitalize">
                      {doc.document_number || doc.document_type}
                    </span>
                    <span class="text-xs text-[var(--gray-400,#94a3b8)]">{formatDate(doc.created_at)}</span>
                  </div>
                  <div class="flex flex-col items-end gap-1 shrink-0">
                    {doc.total > 0 && (
                      <span class="text-sm font-semibold text-[var(--gray-900,#0f172a)]">{formatAmount(doc.total)}</span>
                    )}
                    <span
                      class="text-[11px] font-semibold px-2 py-0.5 rounded-md capitalize"
                      style={{ background: statusStyle.bg, color: statusStyle.text }}
                    >
                      {doc.status}
                    </span>
                  </div>
                  <ChevronRight size={16} class="text-[var(--gray-300,#cbd5e1)] shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        <p class="text-center text-xs text-[var(--gray-400,#94a3b8)] mt-4">
          {documents.length} {documents.length === 1 ? 'document' : 'documents'}
        </p>
      </div>
    </main>
  );
}
