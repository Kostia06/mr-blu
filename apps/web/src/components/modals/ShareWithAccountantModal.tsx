import { useState, useEffect, useCallback } from 'preact/hooks';
import { Share2, Check, X, AlertCircle, Loader2, Mail, User, Copy, Calendar, FileText } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import { supabase } from '@/lib/supabase/client';
import { createAccountantShare, updateAccountantShare } from '@/lib/api/accountant-shares';
import type { ShareType, AccountantShare } from '@/lib/api/accountant-shares';

interface ShareWithAccountantModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedDocumentIds?: string[];
  editingShare?: AccountantShare | null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ExpiryPreset = '7d' | '30d' | '90d' | 'never' | 'custom';

function getExpiryDate(preset: ExpiryPreset, customDate: string): string | null {
  if (preset === 'never') return null;
  if (preset === 'custom') return customDate ? new Date(customDate).toISOString() : null;
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export function ShareWithAccountantModal({
  open,
  onClose,
  onSuccess,
  selectedDocumentIds = [],
  editingShare = null,
}: ShareWithAccountantModalProps) {
  const isEditing = !!editingShare;
  const { t } = useI18nStore();

  // Form state
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [shareType, setShareType] = useState<ShareType>('selected');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expiryPreset, setExpiryPreset] = useState<ExpiryPreset>('30d');
  const [customExpiry, setCustomExpiry] = useState('');
  const [notifyOnShare, setNotifyOnShare] = useState(true);
  const [notifyOnNewInvoice, setNotifyOnNewInvoice] = useState(false);

  // UI state
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const isEmailValid = EMAIL_REGEX.test(email);
  const hasSelectedDocs = selectedDocumentIds.length > 0;

  useEffect(() => {
    if (open) {
      if (editingShare) {
        setEmail(editingShare.accountantEmail);
        setName(editingShare.accountantName || '');
        setShareType(editingShare.shareType);
        setDateFrom(editingShare.dateFrom?.split('T')[0] || '');
        setDateTo(editingShare.dateTo?.split('T')[0] || '');
        setNotifyOnShare(editingShare.notifyOnShare);
        setNotifyOnNewInvoice(editingShare.notifyOnNewInvoice);
        if (!editingShare.expiresAt) {
          setExpiryPreset('never');
        } else {
          setExpiryPreset('custom');
          setCustomExpiry(editingShare.expiresAt.split('T')[0]);
        }
      } else {
        setEmail('');
        setName('');
        setShareType(hasSelectedDocs ? 'selected' : 'all');
        setDateFrom('');
        setDateTo('');
        setExpiryPreset('30d');
        setCustomExpiry('');
        setNotifyOnShare(true);
        setNotifyOnNewInvoice(false);
      }
      setError(null);
      setSuccess(false);
      setShareUrl('');
      setCopied(false);
      setIsCreating(false);
    }
  }, [open, hasSelectedDocs, editingShare]);

  useEffect(() => {
    if (!open) return;
    window.document.body.style.overflow = 'hidden';
    return () => { window.document.body.style.overflow = ''; };
  }, [open]);

  const handleClose = useCallback(() => {
    if (isCreating) return;
    onClose();
  }, [isCreating, onClose]);

  const handleCreate = useCallback(async () => {
    if (!isEmailValid || isCreating) return;
    setIsCreating(true);
    setError(null);

    try {
      if (isEditing && editingShare) {
        await updateAccountantShare(editingShare.id, {
          accountantEmail: email,
          accountantName: name || null,
          shareType,
          dateFrom: shareType === 'date_range' ? dateFrom : null,
          dateTo: shareType === 'date_range' ? dateTo : null,
          expiresAt: getExpiryDate(expiryPreset, customExpiry),
          notifyOnShare,
          notifyOnNewInvoice,
        });
        onSuccess();
        return;
      }

      const result = await createAccountantShare({
        accountantEmail: email,
        accountantName: name || undefined,
        shareType,
        documentIds: shareType === 'selected' ? selectedDocumentIds : undefined,
        dateFrom: shareType === 'date_range' ? dateFrom : undefined,
        dateTo: shareType === 'date_range' ? dateTo : undefined,
        expiresAt: getExpiryDate(expiryPreset, customExpiry),
        notifyOnShare,
        notifyOnNewInvoice,
      });

      setShareUrl(result.shareUrl);
      setSuccess(true);

      if (notifyOnShare) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          await fetch('/api/email/accountant-share', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({
              shareId: result.shareId,
              accountantEmail: email,
              accountantName: name || undefined,
              shareUrl: result.shareUrl,
              expiresAt: getExpiryDate(expiryPreset, customExpiry),
            }),
          });
        } catch {
          // Non-critical, share still created
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : isEditing ? 'Failed to update share' : 'Failed to create share');
      setIsCreating(false);
    }
  }, [email, name, shareType, selectedDocumentIds, dateFrom, dateTo, expiryPreset, customExpiry, notifyOnShare, notifyOnNewInvoice, isEmailValid, isCreating, isEditing, editingShare, onSuccess]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isCreating) handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isCreating, handleClose]);

  if (!open) return null;

  const shareTypeOptions: { value: ShareType; label: string; desc: string }[] = [
    ...(hasSelectedDocs
      ? [{ value: 'selected' as ShareType, label: t('accountant.typeSelected'), desc: t('accountant.typeSelectedDesc', { n: String(selectedDocumentIds.length) }) }]
      : []),
    { value: 'all', label: t('accountant.typeAll'), desc: t('accountant.typeAllDesc') },
    { value: 'date_range', label: t('accountant.typeDateRange'), desc: t('accountant.typeDateRangeDesc') },
  ];

  const expiryOptions: { value: ExpiryPreset; label: string }[] = [
    { value: '7d', label: t('accountant.expiry7d') },
    { value: '30d', label: t('accountant.expiry30d') },
    { value: '90d', label: t('accountant.expiry90d') },
    { value: 'never', label: t('accountant.expiryNever') },
    { value: 'custom', label: t('accountant.expiryCustom') },
  ];

  return (
    <div class="sa-overlay" onClick={handleClose} role="presentation">
      <style>{saStyles}</style>
      <div
        class="sa-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-accountant-title"
        tabIndex={-1}
      >
        <div class="sa-header">
          <div class="sa-header-left">
            <div class="sa-header-icon">
              <Share2 size={18} />
            </div>
            <div>
              <h2 id="share-accountant-title" class="sa-title">
                {isEditing ? t('accountant.editShare') : t('accountant.shareTitle')}
              </h2>
              <p class="sa-subtitle">{isEditing ? t('accountant.editShareSubtitle') : t('accountant.shareSubtitle')}</p>
            </div>
          </div>
          <button class="sa-close" onClick={handleClose} aria-label={t('common.close')}>
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div class="sa-success">
            <div class="sa-success-icon">
              <Check size={32} strokeWidth={1.5} />
            </div>
            <h2 class="sa-success-title">{t('accountant.shareCreated')}</h2>
            <p class="sa-success-text">{t('accountant.shareCreatedDesc')}</p>

            <div class="sa-link-box">
              <input
                type="text"
                class="sa-link-input"
                value={shareUrl}
                readOnly
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button class="sa-link-copy" onClick={handleCopy}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? t('accountant.copied') : t('accountant.copyLink')}
              </button>
            </div>

            <button class="sa-btn sa-btn-done" onClick={() => { handleClose(); onSuccess(); }}>
              {t('common.done')}
            </button>
          </div>
        ) : (
          <div class="sa-body">
            {/* Email */}
            <div class="sa-field">
              <label class="sa-label">
                <Mail size={13} />
                {t('accountant.email')}
              </label>
              <input
                type="email"
                class={`sa-input ${email.length > 0 ? (isEmailValid ? 'valid' : 'invalid') : ''}`}
                value={email}
                onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                placeholder={t('accountant.emailPlaceholder')}
                disabled={isCreating}
              />
            </div>

            {/* Name (optional) */}
            <div class="sa-field">
              <label class="sa-label">
                <User size={13} />
                {t('accountant.name')}
              </label>
              <input
                type="text"
                class="sa-input"
                value={name}
                onInput={(e) => setName((e.target as HTMLInputElement).value)}
                placeholder={t('accountant.namePlaceholder')}
                disabled={isCreating}
              />
            </div>

            {/* Share type */}
            <div class="sa-field">
              <label class="sa-label">
                <FileText size={13} />
                {t('accountant.shareType')}
              </label>
              <div class="sa-radio-group">
                {shareTypeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    class={`sa-radio-card ${shareType === opt.value ? 'active' : ''}`}
                    onClick={() => setShareType(opt.value)}
                    disabled={isCreating}
                  >
                    <span class="sa-radio-label">{opt.label}</span>
                    <span class="sa-radio-desc">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date range pickers */}
            {shareType === 'date_range' && (
              <div class="sa-date-row">
                <div class="sa-field sa-field-half">
                  <label class="sa-label">
                    <Calendar size={13} />
                    {t('accountant.dateFrom')}
                  </label>
                  <input
                    type="date"
                    class="sa-input"
                    value={dateFrom}
                    onInput={(e) => setDateFrom((e.target as HTMLInputElement).value)}
                    disabled={isCreating}
                  />
                </div>
                <div class="sa-field sa-field-half">
                  <label class="sa-label">
                    <Calendar size={13} />
                    {t('accountant.dateTo')}
                  </label>
                  <input
                    type="date"
                    class="sa-input"
                    value={dateTo}
                    onInput={(e) => setDateTo((e.target as HTMLInputElement).value)}
                    disabled={isCreating}
                  />
                </div>
              </div>
            )}

            {/* Expiry presets */}
            <div class="sa-field">
              <label class="sa-label">{t('accountant.expiresIn')}</label>
              <div class="sa-preset-row">
                {expiryOptions.map((opt) => (
                  <button
                    key={opt.value}
                    class={`sa-preset ${expiryPreset === opt.value ? 'active' : ''}`}
                    onClick={() => setExpiryPreset(opt.value)}
                    disabled={isCreating}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {expiryPreset === 'custom' && (
                <input
                  type="date"
                  class="sa-input sa-mt-2"
                  value={customExpiry}
                  onInput={(e) => setCustomExpiry((e.target as HTMLInputElement).value)}
                  disabled={isCreating}
                />
              )}
            </div>

            {/* Notification toggles */}
            <div class="sa-field">
              <div class="sa-toggle-row">
                <span class="sa-toggle-label">{t('accountant.notifyOnShare')}</span>
                <button
                  class={`sa-toggle ${notifyOnShare ? 'active' : ''}`}
                  onClick={() => setNotifyOnShare(!notifyOnShare)}
                  disabled={isCreating}
                  role="switch"
                  aria-checked={notifyOnShare}
                />
              </div>
              <div class="sa-toggle-row">
                <span class="sa-toggle-label">{t('accountant.notifyOnNew')}</span>
                <button
                  class={`sa-toggle ${notifyOnNewInvoice ? 'active' : ''}`}
                  onClick={() => setNotifyOnNewInvoice(!notifyOnNewInvoice)}
                  disabled={isCreating}
                  role="switch"
                  aria-checked={notifyOnNewInvoice}
                />
              </div>
            </div>

            {/* Permissions note */}
            <div class="sa-note">
              <Share2 size={14} />
              <span>{t('accountant.permissionsNote')}</span>
            </div>

            {error && (
              <div class="sa-error">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <div class="sa-actions">
              <button class="sa-btn sa-btn-cancel" onClick={handleClose} disabled={isCreating}>
                {t('common.cancel')}
              </button>
              <button
                class="sa-btn sa-btn-create"
                onClick={handleCreate}
                disabled={!isEmailValid || isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 size={16} class="sa-spin" />
                    {t('accountant.creating')}
                  </>
                ) : (
                  <>
                    <Share2 size={16} />
                    {isEditing ? t('accountant.saveChanges') : t('accountant.createShare')}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const saStyles = `
  .sa-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 1000;
    padding: 0;
    animation: saOverlayIn 0.2s ease;
  }

  @media (min-width: 481px) {
    .sa-overlay {
      align-items: center;
      padding: 20px;
    }
  }

  @keyframes saOverlayIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .sa-content {
    background: var(--white, #fff);
    border-radius: 20px 20px 0 0;
    max-width: 480px;
    width: 100%;
    max-height: 92dvh;
    max-height: 92vh;
    display: flex;
    flex-direction: column;
    position: relative;
    box-shadow: 0 -4px 40px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04);
    animation: saSheetUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @media (min-width: 481px) {
    .sa-content {
      border-radius: 20px;
      max-height: calc(100dvh - 40px);
      max-height: calc(100vh - 40px);
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.04);
      animation: saSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
  }

  @keyframes saSheetUp {
    from { opacity: 0; transform: translateY(100%); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes saSlideUp {
    from { opacity: 0; transform: translateY(16px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .sa-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 20px 16px;
    flex-shrink: 0;
    border-bottom: 1px solid var(--gray-100, #f1f5f9);
  }

  .sa-header::before {
    content: '';
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: 36px;
    height: 4px;
    background: var(--gray-300, #cbd5e1);
    border-radius: 2px;
  }

  @media (min-width: 481px) {
    .sa-header::before { display: none; }
  }

  .sa-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .sa-header-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: rgba(0, 102, 255, 0.08);
    color: var(--blu-primary, #0066ff);
    flex-shrink: 0;
  }

  .sa-title {
    font-size: 17px;
    font-weight: 700;
    color: var(--gray-900, #0f172a);
    margin: 0;
    letter-spacing: -0.01em;
  }

  .sa-subtitle {
    font-size: 13px;
    color: var(--gray-400, #94a3b8);
    margin: 2px 0 0;
  }

  .sa-close {
    background: var(--gray-100, #f1f5f9);
    border: none;
    color: var(--gray-500, #64748b);
    cursor: pointer;
    width: 36px;
    height: 36px;
    min-height: 36px;
    padding: 0;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    flex-shrink: 0;
    position: relative;
    z-index: 2;
  }

  .sa-close:hover {
    background: var(--gray-200, #e2e8f0);
    color: var(--gray-700, #334155);
  }

  .sa-close:active { transform: scale(0.92); }

  .sa-body {
    padding: 20px;
    padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .sa-field { margin-bottom: 16px; }
  .sa-field:last-of-type { margin-bottom: 20px; }
  .sa-field-half { flex: 1; min-width: 0; }

  .sa-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--gray-600, #475569);
    margin-bottom: 8px;
  }

  .sa-label svg { color: var(--gray-400, #94a3b8); }

  .sa-input {
    width: 100%;
    padding: 14px 16px;
    border-radius: 14px;
    font-size: 15px;
    font-family: inherit;
    color: var(--gray-900, #0f172a);
    background: var(--gray-50, #f8fafc);
    border: 1.5px solid var(--gray-200, #e2e8f0);
    outline: none;
    box-sizing: border-box;
    transition: border-color 150ms ease;
  }

  .sa-input:focus { border-color: var(--blu-primary, #0066ff); }
  .sa-input:disabled { opacity: 0.5; cursor: not-allowed; }
  .sa-input::placeholder { color: var(--gray-400, #94a3b8); }
  .sa-input.valid { border-color: #34d399; }
  .sa-input.invalid { border-color: #f87171; }
  .sa-mt-2 { margin-top: 8px; }

  /* Radio cards */
  .sa-radio-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .sa-radio-card {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1.5px solid var(--gray-200, #e2e8f0);
    background: var(--gray-50, #f8fafc);
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    transition: all 150ms ease;
  }

  .sa-radio-card:hover { border-color: var(--gray-300, #cbd5e1); }

  .sa-radio-card.active {
    border-color: var(--blu-primary, #0066ff);
    background: rgba(0, 102, 255, 0.04);
  }

  .sa-radio-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--gray-900, #0f172a);
  }

  .sa-radio-desc {
    font-size: 12px;
    color: var(--gray-500, #64748b);
  }

  /* Date row */
  .sa-date-row {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
  }

  /* Expiry presets */
  .sa-preset-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .sa-preset {
    padding: 8px 14px;
    border-radius: 10px;
    border: 1.5px solid var(--gray-200, #e2e8f0);
    background: var(--gray-50, #f8fafc);
    font-size: 13px;
    font-weight: 500;
    font-family: inherit;
    color: var(--gray-600, #475569);
    cursor: pointer;
    transition: all 150ms ease;
  }

  .sa-preset:hover { border-color: var(--gray-300, #cbd5e1); }

  .sa-preset.active {
    border-color: var(--blu-primary, #0066ff);
    background: rgba(0, 102, 255, 0.06);
    color: var(--blu-primary, #0066ff);
  }

  /* Toggle */
  .sa-toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
  }

  .sa-toggle-label {
    font-size: 14px;
    color: var(--gray-700, #334155);
  }

  .sa-toggle {
    position: relative;
    width: 48px;
    height: 28px;
    background: var(--gray-300, #cbd5e1);
    border-radius: 14px;
    border: none;
    cursor: pointer;
    transition: background 150ms ease;
    flex-shrink: 0;
    padding: 0;
  }

  .sa-toggle::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 24px;
    height: 24px;
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    transition: transform 150ms ease;
  }

  .sa-toggle.active { background: var(--blu-primary, #0066ff); }
  .sa-toggle.active::after { transform: translateX(20px); }

  /* Note */
  .sa-note {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 14px;
    background: rgba(0, 102, 255, 0.05);
    border-radius: 12px;
    font-size: 13px;
    color: var(--gray-600, #475569);
    margin-bottom: 16px;
  }

  .sa-note svg { color: var(--blu-primary, #0066ff); flex-shrink: 0; }

  /* Error */
  .sa-error {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 14px;
    background: rgba(239, 68, 68, 0.08);
    color: #dc2626;
    border-radius: 12px;
    font-size: 13px;
    margin-bottom: 20px;
  }

  .sa-error svg { flex-shrink: 0; }

  /* Actions */
  .sa-actions {
    display: flex;
    gap: 12px;
  }

  .sa-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 48px;
    padding: 14px 16px;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 600;
    font-family: inherit;
    border: none;
    cursor: pointer;
    transition: transform 100ms ease;
  }

  .sa-btn:active { transform: scale(0.98); }
  .sa-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .sa-btn:disabled:active { transform: none; }

  .sa-btn-cancel {
    background: var(--gray-100, #f1f5f9);
    color: var(--gray-700, #334155);
  }

  .sa-btn-create {
    background: var(--blu-primary, #0066ff);
    color: #fff;
  }

  .sa-btn-done {
    background: var(--gray-100, #f1f5f9);
    color: var(--gray-700, #334155);
    margin-top: 16px;
  }

  /* Success */
  .sa-success {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 40px 24px;
    padding-bottom: calc(40px + env(safe-area-inset-bottom, 0px));
  }

  .sa-success-icon {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(16, 185, 129, 0.12);
    color: #10b981;
    margin-bottom: 16px;
    animation: saSuccessPop 0.4s ease-out;
  }

  .sa-success-title {
    font-size: 20px;
    font-weight: 700;
    color: #059669;
    margin: 0 0 8px;
  }

  .sa-success-text {
    font-size: 14px;
    color: var(--gray-500, #64748b);
    margin: 0 0 24px;
  }

  /* Link box */
  .sa-link-box {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .sa-link-input {
    width: 100%;
    padding: 12px 14px;
    border-radius: 12px;
    font-size: 13px;
    font-family: monospace;
    color: var(--gray-600, #475569);
    background: var(--gray-50, #f8fafc);
    border: 1.5px solid var(--gray-200, #e2e8f0);
    outline: none;
    box-sizing: border-box;
    text-overflow: ellipsis;
  }

  .sa-link-copy {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px;
    border-radius: 12px;
    border: none;
    background: var(--blu-primary, #0066ff);
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: transform 100ms ease;
  }

  .sa-link-copy:active { transform: scale(0.98); }

  @keyframes saSuccessPop {
    0% { transform: scale(0.5); opacity: 0; }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }

  @keyframes saSpin {
    to { transform: rotate(360deg); }
  }

  .sa-spin { animation: saSpin 0.8s linear infinite; }

  @media (prefers-reduced-motion: reduce) {
    .sa-overlay,
    .sa-content,
    .sa-success-icon {
      animation: none !important;
    }
  }
`;
