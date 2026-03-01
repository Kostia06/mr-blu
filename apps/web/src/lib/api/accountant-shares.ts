import { supabase } from '@/lib/supabase/client';

// =============================================
// TYPES
// =============================================

export type ShareType = 'selected' | 'all' | 'date_range';
export type ShareStatus = 'active' | 'revoked' | 'expired';

export interface AccountantShare {
  id: string;
  userId: string;
  accountantEmail: string;
  accountantName: string | null;
  shareType: ShareType;
  accessToken: string;
  dateFrom: string | null;
  dateTo: string | null;
  expiresAt: string | null;
  canView: boolean;
  canDownload: boolean;
  notifyOnShare: boolean;
  notifyOnNewInvoice: boolean;
  status: ShareStatus;
  createdAt: string;
  lastAccessedAt: string | null;
  revokedAt: string | null;
  documentCount?: number;
}

export interface CreateShareOptions {
  accountantEmail: string;
  accountantName?: string;
  shareType: ShareType;
  documentIds?: string[];
  dateFrom?: string;
  dateTo?: string;
  expiresAt?: string | null;
  notifyOnShare?: boolean;
  notifyOnNewInvoice?: boolean;
}

export interface SharedLineItem {
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  total: number;
}

export interface SharedDocumentRow {
  id: string;
  document_type: string;
  document_number: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  status: string;
  created_at: string;
  due_date: string | null;
  notes: string | null;
  line_items: SharedLineItem[];
  clients: { name: string; email?: string } | null;
}

// =============================================
// CREATE SHARE
// =============================================

export async function createAccountantShare(
  opts: CreateShareOptions
): Promise<{ shareId: string; shareUrl: string; accessToken: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AccountantShareError('Not authenticated');

  const accessToken = crypto.randomUUID();

  const { data: share, error } = await supabase
    .from('accountant_shares')
    .insert({
      user_id: user.id,
      accountant_email: opts.accountantEmail,
      accountant_name: opts.accountantName || null,
      share_type: opts.shareType,
      access_token: accessToken,
      date_from: opts.dateFrom || null,
      date_to: opts.dateTo || null,
      expires_at: opts.expiresAt || null,
      notify_on_share: opts.notifyOnShare ?? true,
      notify_on_new_invoice: opts.notifyOnNewInvoice ?? false,
    })
    .select('id')
    .single();

  if (error) {
    throw new AccountantShareError(`Failed to create share: ${error.message}`);
  }

  if (opts.shareType === 'selected' && opts.documentIds?.length) {
    const rows = opts.documentIds.map((docId) => ({
      share_id: share.id,
      document_id: docId,
    }));

    const { error: docError } = await supabase
      .from('accountant_share_documents')
      .insert(rows);

    if (docError) {
      throw new AccountantShareError(`Failed to link documents: ${docError.message}`);
    }
  }

  const shareUrl = `${window.location.origin}/shared/accountant/${accessToken}`;

  return { shareId: share.id, shareUrl, accessToken };
}

// =============================================
// GET SHARES
// =============================================

export async function getAccountantShares(): Promise<AccountantShare[]> {
  const { data, error } = await supabase
    .from('accountant_shares')
    .select('*, accountant_share_documents(count)')
    .order('created_at', { ascending: false });

  if (error) {
    throw new AccountantShareError(`Failed to fetch shares: ${error.message}`);
  }

  return (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    accountantEmail: row.accountant_email,
    accountantName: row.accountant_name,
    shareType: row.share_type as ShareType,
    accessToken: row.access_token,
    dateFrom: row.date_from,
    dateTo: row.date_to,
    expiresAt: row.expires_at,
    canView: row.can_view,
    canDownload: row.can_download,
    notifyOnShare: row.notify_on_share,
    notifyOnNewInvoice: row.notify_on_new_invoice,
    status: getEffectiveStatus(row.status, row.expires_at),
    createdAt: row.created_at,
    lastAccessedAt: row.last_accessed_at,
    revokedAt: row.revoked_at,
    documentCount: row.accountant_share_documents?.[0]?.count ?? 0,
  }));
}

// =============================================
// REVOKE SHARE
// =============================================

export async function revokeAccountantShare(shareId: string): Promise<void> {
  const { data, error } = await supabase
    .from('accountant_shares')
    .update({
      status: 'revoked',
      revoked_at: new Date().toISOString(),
    })
    .eq('id', shareId)
    .select('id');

  if (error) {
    throw new AccountantShareError(`Failed to revoke share: ${error.message}`);
  }
  if (!data || data.length === 0) {
    throw new AccountantShareError('Share not found or access denied');
  }
}

// =============================================
// DELETE SHARE
// =============================================

export async function deleteAccountantShare(shareId: string): Promise<void> {
  const { data, error } = await supabase
    .from('accountant_shares')
    .delete()
    .eq('id', shareId)
    .select('id');

  if (error) {
    throw new AccountantShareError(`Failed to delete share: ${error.message}`);
  }
  if (!data || data.length === 0) {
    throw new AccountantShareError('Share not found or access denied');
  }
}

// =============================================
// UPDATE SHARE
// =============================================

export interface UpdateShareOptions {
  accountantEmail?: string;
  accountantName?: string | null;
  shareType?: ShareType;
  dateFrom?: string | null;
  dateTo?: string | null;
  expiresAt?: string | null;
  notifyOnShare?: boolean;
  notifyOnNewInvoice?: boolean;
}

export async function updateAccountantShare(
  shareId: string,
  opts: UpdateShareOptions
): Promise<void> {
  const updates: Record<string, unknown> = {};
  if (opts.accountantEmail !== undefined) updates.accountant_email = opts.accountantEmail;
  if (opts.accountantName !== undefined) updates.accountant_name = opts.accountantName;
  if (opts.shareType !== undefined) updates.share_type = opts.shareType;
  if (opts.dateFrom !== undefined) updates.date_from = opts.dateFrom;
  if (opts.dateTo !== undefined) updates.date_to = opts.dateTo;
  if (opts.expiresAt !== undefined) updates.expires_at = opts.expiresAt;
  if (opts.notifyOnShare !== undefined) updates.notify_on_share = opts.notifyOnShare;
  if (opts.notifyOnNewInvoice !== undefined) updates.notify_on_new_invoice = opts.notifyOnNewInvoice;

  const { data, error } = await supabase
    .from('accountant_shares')
    .update(updates)
    .eq('id', shareId)
    .select('id');

  if (error) {
    throw new AccountantShareError(`Failed to update share: ${error.message}`);
  }
  if (!data || data.length === 0) {
    throw new AccountantShareError('Share not found or access denied');
  }
}

// =============================================
// ADD/REMOVE DOCUMENTS
// =============================================

export async function addDocumentsToShare(
  shareId: string,
  documentIds: string[]
): Promise<void> {
  const rows = documentIds.map((docId) => ({
    share_id: shareId,
    document_id: docId,
  }));

  const { error } = await supabase
    .from('accountant_share_documents')
    .upsert(rows, { onConflict: 'share_id,document_id' });

  if (error) {
    throw new AccountantShareError(`Failed to add documents: ${error.message}`);
  }
}

export async function removeDocumentFromShare(
  shareId: string,
  documentId: string
): Promise<void> {
  const { error } = await supabase
    .from('accountant_share_documents')
    .delete()
    .eq('share_id', shareId)
    .eq('document_id', documentId);

  if (error) {
    throw new AccountantShareError(`Failed to remove document: ${error.message}`);
  }
}

// =============================================
// RESEND EMAIL
// =============================================

export async function resendAccountantShareEmail(
  share: AccountantShare,
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new AccountantShareError('Not authenticated');

  const shareUrl = `${window.location.origin}/shared/accountant/${share.accessToken}`;

  const response = await fetch('/api/email/accountant-share', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      shareId: share.id,
      accountantEmail: share.accountantEmail,
      accountantName: share.accountantName || undefined,
      shareUrl,
      expiresAt: share.expiresAt,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new AccountantShareError(
      (data as { error?: string }).error || 'Failed to resend email',
    );
  }
}

// =============================================
// VALIDATE & FETCH (public, no auth)
// =============================================

export async function validateShareAccess(
  token: string
): Promise<AccountantShare | null> {
  const { data, error } = await supabase
    .from('accountant_shares')
    .select('*')
    .eq('access_token', token)
    .single();

  if (error || !data) return null;

  const effectiveStatus = getEffectiveStatus(data.status, data.expires_at);
  if (effectiveStatus !== 'active') return null;

  // Update last_accessed_at (fire-and-forget)
  supabase
    .from('accountant_shares')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('id', data.id)
    .then(() => {});

  // Log access
  supabase
    .from('accountant_access_logs')
    .insert({ share_id: data.id, action: 'view_list' })
    .then(() => {});

  return {
    id: data.id,
    userId: data.user_id,
    accountantEmail: data.accountant_email,
    accountantName: data.accountant_name,
    shareType: data.share_type as ShareType,
    accessToken: data.access_token,
    dateFrom: data.date_from,
    dateTo: data.date_to,
    expiresAt: data.expires_at,
    canView: data.can_view,
    canDownload: data.can_download,
    notifyOnShare: data.notify_on_share,
    notifyOnNewInvoice: data.notify_on_new_invoice,
    status: effectiveStatus,
    createdAt: data.created_at,
    lastAccessedAt: data.last_accessed_at,
    revokedAt: data.revoked_at,
  };
}

export async function getSharedDocuments(
  token: string
): Promise<SharedDocumentRow[]> {
  const { data, error } = await supabase.rpc('get_shared_documents', {
    p_access_token: token,
  });

  if (error || !data) return [];

  return (data as unknown as SharedDocumentRow[]) || [];
}

// =============================================
// HELPERS
// =============================================

function getEffectiveStatus(status: string, expiresAt: string | null): ShareStatus {
  if (status === 'revoked') return 'revoked';
  if (expiresAt && new Date(expiresAt) < new Date()) return 'expired';
  return 'active';
}

// =============================================
// ERROR CLASS
// =============================================

export class AccountantShareError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccountantShareError';
  }
}
