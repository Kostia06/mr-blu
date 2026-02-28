import { useState, useEffect, useCallback } from 'preact/hooks';
import type { User } from '@supabase/supabase-js';
import {
  Share2,
  Copy,
  XCircle,
  Plus,
  Clock,
  FileText,
  Check,
  AlertCircle,
  Loader2,
  Trash2,
  Pencil,
} from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import { useToastStore } from '@/stores/toastStore';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import { ShareWithAccountantModal } from '@/components/modals/ShareWithAccountantModal';
import {
  getAccountantShares,
  revokeAccountantShare,
  deleteAccountantShare,
} from '@/lib/api/accountant-shares';
import type { AccountantShare } from '@/lib/api/accountant-shares';
import { cn } from '@/lib/utils';

interface AccountantSharesSettingsProps {
  user: User | null;
}

function formatDate(dateString: string | null, locale: string): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString(
    locale === 'es' ? 'es-ES' : 'en-US',
    { month: 'short', day: 'numeric', year: 'numeric' }
  );
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Never';
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function AccountantSharesSettings({ user }: AccountantSharesSettingsProps) {
  const { t, locale } = useI18nStore();
  const toast = useToastStore();

  const [shares, setShares] = useState<AccountantShare[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingShare, setEditingShare] = useState<AccountantShare | null>(null);

  const loadShares = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getAccountantShares();
      setShares(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shares');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShares();
  }, [loadShares]);

  const handleRevoke = useCallback(async (shareId: string) => {
    setRevokingId(shareId);
    try {
      await revokeAccountantShare(shareId);
      setShares((prev) =>
        prev.map((s) =>
          s.id === shareId
            ? { ...s, status: 'revoked' as const, revokedAt: new Date().toISOString() }
            : s
        )
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setRevokingId(null);
    }
  }, [toast, t]);

  const handleDelete = useCallback(async (shareId: string) => {
    setDeletingId(shareId);
    try {
      await deleteAccountantShare(shareId);
      setShares((prev) => prev.filter((s) => s.id !== shareId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setDeletingId(null);
    }
  }, [toast, t]);

  const handleCopyLink = useCallback(async (share: AccountantShare) => {
    const url = `${window.location.origin}/shared/accountant/${share.accessToken}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopiedId(share.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const activeShares = shares.filter((s) => s.status === 'active');
  const inactiveShares = shares.filter((s) => s.status !== 'active');

  return (
    <main class="min-h-screen bg-transparent">
      <SettingsPageHeader
        title={t('accountant.settingsTitle')}
        backLabel={t('common.back')}
      />

      <div class="px-[var(--page-padding-x,20px)] max-w-[var(--page-max-width,600px)] w-full mx-auto flex flex-col gap-6 pb-[100px]">
        {/* Create new share button */}
        <button
          class="flex items-center justify-center gap-2 w-full py-3.5 px-5 border-2 border-dashed border-[var(--gray-200,#e2e8f0)] rounded-[var(--radius-card,20px)] text-[15px] font-semibold text-[var(--blu-primary,#0066ff)] bg-transparent cursor-pointer transition-all duration-150"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={18} />
          {t('accountant.newShare')}
        </button>

        {isLoading ? (
          <div class="flex items-center justify-center py-20">
            <Loader2 size={24} class="animate-spin text-[var(--gray-400,#94a3b8)]" />
          </div>
        ) : error ? (
          <div class="flex items-center gap-2 p-4 bg-red-50 rounded-[var(--radius-card,20px)] text-red-600 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        ) : shares.length === 0 ? (
          <div class="flex flex-col items-center justify-center px-5 py-16 text-center">
            <div class="w-20 h-20 flex items-center justify-center bg-white/60 backdrop-blur-[20px] rounded-full text-[var(--blu-primary,#0066ff)] mb-5 shadow-[0_8px_32px_rgba(0,102,255,0.1)]">
              <Share2 size={40} strokeWidth={1.5} />
            </div>
            <h3 class="font-[var(--font-display,system-ui)] text-lg font-bold text-[var(--gray-900,#0f172a)] m-0 mb-2">
              {t('accountant.emptyTitle')}
            </h3>
            <p class="text-[14px] text-[var(--gray-500,#64748b)] m-0 max-w-[260px] leading-relaxed">
              {t('accountant.emptyDesc')}
            </p>
          </div>
        ) : (
          <>
            {/* Active shares */}
            {activeShares.length > 0 && (
              <section class="flex flex-col gap-2">
                <h2 class="text-xs font-semibold text-[var(--gray-500,#64748b)] uppercase tracking-[0.05em] m-0 px-1">
                  {t('accountant.activeShares')}
                </h2>
                <div class="flex flex-col gap-3">
                  {activeShares.map((share) => (
                    <ShareCard
                      key={share.id}
                      share={share}
                      locale={locale}
                      t={t}
                      isRevoking={revokingId === share.id}
                      isDeleting={false}
                      isCopied={copiedId === share.id}
                      onRevoke={() => handleRevoke(share.id)}
                      onCopy={() => handleCopyLink(share)}
                      onEdit={() => setEditingShare(share)}
                      onDelete={() => {}}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Inactive shares */}
            {inactiveShares.length > 0 && (
              <section class="flex flex-col gap-2">
                <h2 class="text-xs font-semibold text-[var(--gray-500,#64748b)] uppercase tracking-[0.05em] m-0 px-1">
                  {t('accountant.pastShares')}
                </h2>
                <div class="flex flex-col gap-3">
                  {inactiveShares.map((share) => (
                    <ShareCard
                      key={share.id}
                      share={share}
                      locale={locale}
                      t={t}
                      isRevoking={false}
                      isDeleting={deletingId === share.id}
                      isCopied={false}
                      onRevoke={() => {}}
                      onCopy={() => {}}
                      onDelete={() => handleDelete(share.id)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <ShareWithAccountantModal
        open={showCreateModal || !!editingShare}
        onClose={() => { setShowCreateModal(false); setEditingShare(null); }}
        onSuccess={() => {
          setShowCreateModal(false);
          setEditingShare(null);
          loadShares();
        }}
        editingShare={editingShare}
      />
    </main>
  );
}

/* ─── Share Card ─── */

function ShareCard({
  share,
  locale,
  t,
  isRevoking,
  isDeleting,
  isCopied,
  onRevoke,
  onCopy,
  onEdit,
  onDelete,
}: {
  share: AccountantShare;
  locale: string;
  t: (key: string) => string;
  isRevoking: boolean;
  isDeleting: boolean;
  isCopied: boolean;
  onRevoke: () => void;
  onCopy: () => void;
  onEdit?: () => void;
  onDelete: () => void;
}) {
  const isActive = share.status === 'active';
  const shareTypeLabel =
    share.shareType === 'selected'
      ? t('accountant.typeSelected')
      : share.shareType === 'all'
        ? t('accountant.typeAll')
        : t('accountant.typeDateRange');

  return (
    <div
      class={cn(
        'flex flex-col gap-3 p-4 bg-white/70 backdrop-blur-[16px] border border-white/60 rounded-[var(--radius-card,20px)] shadow-[0_2px_12px_rgba(0,0,0,0.04)]',
        !isActive && 'opacity-60'
      )}
    >
      {/* Top row: name/email + status badge */}
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 min-w-0">
          <p class="text-[15px] font-semibold text-[var(--gray-900,#0f172a)] m-0 whitespace-nowrap overflow-hidden text-ellipsis">
            {share.accountantName || share.accountantEmail}
          </p>
          {share.accountantName && (
            <p class="text-[13px] text-[var(--gray-500,#64748b)] m-0 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
              {share.accountantEmail}
            </p>
          )}
        </div>
        <span
          class={cn(
            'shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold',
            share.status === 'active' && 'bg-emerald-100 text-emerald-700',
            share.status === 'expired' && 'bg-amber-100 text-amber-700',
            share.status === 'revoked' && 'bg-red-100 text-red-700'
          )}
        >
          {share.status === 'active' ? t('accountant.statusActive') : share.status === 'expired' ? t('accountant.statusExpired') : t('accountant.statusRevoked')}
        </span>
      </div>

      {/* Meta row */}
      <div class="flex items-center gap-4 text-[12px] text-[var(--gray-500,#64748b)]">
        <span class="flex items-center gap-1">
          <FileText size={12} />
          {shareTypeLabel}
          {share.documentCount !== undefined && share.shareType === 'selected' && ` (${share.documentCount})`}
        </span>
        {share.expiresAt && (
          <span class="flex items-center gap-1">
            <Clock size={12} />
            {t('accountant.expires')} {formatDate(share.expiresAt, locale)}
          </span>
        )}
      </div>

      {/* Last accessed */}
      <p class="text-[12px] text-[var(--gray-400,#94a3b8)] m-0">
        {t('accountant.lastAccessed')}: {formatRelativeTime(share.lastAccessedAt)}
      </p>

      {/* Actions */}
      {isActive ? (
        <div class="flex gap-2">
          <button
            class="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border-none rounded-xl text-[13px] font-semibold cursor-pointer bg-[rgba(0,102,255,0.08)] text-[var(--blu-primary,#0066ff)]"
            onClick={onCopy}
          >
            {isCopied ? <Check size={14} /> : <Copy size={14} />}
            {isCopied ? t('accountant.copied') : t('accountant.copyLink')}
          </button>
          {onEdit && (
            <button
              class="flex items-center justify-center gap-2 py-2.5 px-4 border-none rounded-xl text-[13px] font-semibold cursor-pointer bg-[var(--gray-100,#f1f5f9)] text-[var(--gray-600,#475569)]"
              onClick={onEdit}
            >
              <Pencil size={14} />
              {t('common.edit')}
            </button>
          )}
          <button
            class="flex items-center justify-center gap-2 py-2.5 px-4 border-none rounded-xl text-[13px] font-semibold cursor-pointer bg-red-500/10 text-red-500"
            onClick={onRevoke}
            disabled={isRevoking}
          >
            {isRevoking ? <Loader2 size={14} class="animate-spin" /> : <XCircle size={14} />}
            {t('accountant.revoke')}
          </button>
        </div>
      ) : (
        <div class="flex gap-2">
          <button
            class="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border-none rounded-xl text-[13px] font-semibold cursor-pointer bg-red-500/10 text-red-500"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 size={14} class="animate-spin" /> : <Trash2 size={14} />}
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
