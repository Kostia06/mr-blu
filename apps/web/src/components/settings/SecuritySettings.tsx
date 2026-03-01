import { useState, useMemo, useCallback } from 'preact/hooks';
import {
  History,
  AlertTriangle,
  X,
  Loader2,
  ChevronRight,
  Lock,
  Eye,
  EyeOff,
  Check,
  Circle,
  CheckCircle,
} from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import { FormSection } from '@/components/forms/FormSection';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import { deleteAccount } from '@/lib/api/user';
import { updatePassword, AuthError } from '@/lib/api/auth';
import { validatePassword } from '@/lib/validation/password';
import { cn } from '@/lib/utils';

interface SecuritySettingsProps {
  user: {
    id: string;
    last_sign_in_at?: string;
  } | null;
}

function formatLastSignIn(dateString: string | undefined, locale: string): string {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString(
    locale === 'es' ? 'es-ES' : 'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }
  );
}

export function SecuritySettings({ user }: SecuritySettingsProps) {
  const { t, locale } = useI18nStore();

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const confirmPhrase = useMemo(() => t('security.deleteConfirmPhrase'), [t]);
  const canDelete = useMemo(
    () => deleteConfirmText.toLowerCase().trim() === confirmPhrase.toLowerCase(),
    [deleteConfirmText, confirmPhrase]
  );

  const lastSignIn = useMemo(
    () => formatLastSignIn(user?.last_sign_in_at, locale),
    [user?.last_sign_in_at, locale]
  );

  const handleChangePassword = useCallback(async () => {
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword !== confirmNewPassword) {
      setPasswordError(t('auth.passwordsMismatch'));
      return;
    }

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setPasswordError(t('auth.passwordRequirements'));
      return;
    }

    setChangingPassword(true);

    try {
      await updatePassword(newPassword);
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      if (err instanceof AuthError) {
        const translated = t(err.message);
        setPasswordError(translated !== err.message ? translated : err.message);
      } else {
        setPasswordError(t('auth.genericError'));
      }
    } finally {
      setChangingPassword(false);
    }
  }, [newPassword, confirmNewPassword, t]);

  const openDeleteModal = useCallback(() => {
    setShowDeleteModal(true);
    setDeleteConfirmText('');
    setDeleteError('');
  }, []);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setDeleteConfirmText('');
    setDeleteError('');
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    if (!canDelete || isDeleting) return;

    setIsDeleting(true);
    setDeleteError('');

    try {
      await deleteAccount();

      window.location.href = '/';
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account');
      setIsDeleting(false);
    }
  }, [canDelete, isDeleting]);

  return (
    <main class="min-h-screen bg-transparent">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <SettingsPageHeader
        title={t('security.title')}
        backLabel={t('common.backToSettings')}
      />

      <div class="px-[var(--page-padding-x,20px)] max-w-[var(--page-max-width,600px)] mx-auto flex flex-col gap-[var(--section-gap,24px)] pb-[100px]">
        <FormSection title={t('settings.sessionsTitle')} variant="card">
          <div class="flex items-center gap-3.5 w-full p-4 bg-transparent border-none cursor-pointer transition-all duration-200 ease-linear text-left">
            <div class="w-11 h-11 flex items-center justify-center bg-[rgba(0,102,255,0.1)] rounded-[var(--radius-input,12px)] text-[var(--blu-primary,#0066ff)] transition-all duration-200 ease-linear shrink-0">
              <History size={18} strokeWidth={1.5} />
            </div>
            <div class="flex-1 flex flex-col gap-0.5 min-w-0">
              <span class="text-[15px] font-medium text-[var(--gray-900,#0f172a)]">
                {t('security.lastSignIn')}
              </span>
              <span class="text-[13px] text-[var(--gray-500,#64748b)]">
                {lastSignIn}
              </span>
            </div>
          </div>
        </FormSection>

        <FormSection title={t('security.changePassword')} variant="card">
          <div class="p-4 flex flex-col gap-4">
            <div>
              <label for="settings-new-pw" class="block text-[13px] font-medium text-[var(--gray-700,#334155)] mb-2">
                {t('security.newPassword')}
              </label>
              <div class="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="settings-new-pw"
                  value={newPassword}
                  onInput={(e) => setNewPassword((e.target as HTMLInputElement).value)}
                  placeholder="••••••••"
                  class="w-full py-3.5 px-4 bg-transparent border border-[var(--gray-200,#e2e8f0)] rounded-[var(--radius-input,12px)] text-[var(--gray-900,#0f172a)] text-[15px] transition-all duration-200 ease-linear box-border pr-12"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((p) => !p)}
                  class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[var(--gray-400,#94a3b8)] hover:text-[var(--gray-600,#475569)] bg-transparent border-none cursor-pointer transition-colors duration-150"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {newPassword.length > 0 && (
                <div class="mt-2 flex flex-col gap-1">
                  {([
                    { key: 'hasMinLength', label: t('auth.req8Chars') },
                    { key: 'hasUppercase', label: t('auth.reqUppercase') },
                    { key: 'hasNumber', label: t('auth.reqNumber') },
                  ] as const).map(({ key, label }) => {
                    const met = validatePassword(newPassword)[key];
                    return (
                      <div key={key} class="flex items-center gap-2 text-xs">
                        {met ? (
                          <Check size={12} strokeWidth={2.5} class="text-emerald-500" />
                        ) : (
                          <Circle size={12} strokeWidth={2} class="text-[var(--gray-300,#d1d5db)]" />
                        )}
                        <span class={met ? 'text-emerald-600' : 'text-[var(--gray-400,#94a3b8)]'}>{label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label for="settings-confirm-pw" class="block text-[13px] font-medium text-[var(--gray-700,#334155)] mb-2">
                {t('security.confirmNewPassword')}
              </label>
              <input
                type={showNewPassword ? 'text' : 'password'}
                id="settings-confirm-pw"
                value={confirmNewPassword}
                onInput={(e) => setConfirmNewPassword((e.target as HTMLInputElement).value)}
                placeholder="••••••••"
                class="w-full py-3.5 px-4 bg-transparent border border-[var(--gray-200,#e2e8f0)] rounded-[var(--radius-input,12px)] text-[var(--gray-900,#0f172a)] text-[15px] transition-all duration-200 ease-linear box-border"
                autoComplete="new-password"
              />
            </div>

            {passwordError && (
              <p class="text-[var(--data-red,#ef4444)] text-[13px] font-medium m-0">{passwordError}</p>
            )}

            {passwordSuccess && (
              <div class="flex items-center gap-2 text-emerald-600 text-[13px] font-medium">
                <CheckCircle size={14} />
                <span>{t('security.passwordUpdated')}</span>
              </div>
            )}

            <button
              class={cn(
                'flex items-center justify-center gap-2 py-3.5 px-5 rounded-[var(--radius-button,14px)] text-[15px] font-semibold cursor-pointer transition-all duration-200 ease-linear bg-gradient-to-br from-[var(--blu-primary,#0066ff)] to-[#0ea5e9] text-white border-none shadow-[0_2px_8px_rgba(0,102,255,0.2)]',
                (changingPassword || !newPassword || !confirmNewPassword) && 'opacity-50 cursor-not-allowed'
              )}
              onClick={handleChangePassword}
              disabled={changingPassword || !newPassword || !confirmNewPassword}
            >
              {changingPassword ? (
                <>
                  <Loader2 size={16} class="animate-spin" />
                  <span>{t('security.changePasswordButton')}</span>
                </>
              ) : (
                <>
                  <Lock size={16} strokeWidth={1.5} />
                  <span>{t('security.changePasswordButton')}</span>
                </>
              )}
            </button>
          </div>
        </FormSection>

        <FormSection title={t('settings.dangerZoneTitle')} variant="card">
          <button
            class="flex items-center gap-3.5 w-full p-4 bg-transparent border-none cursor-pointer transition-all duration-200 ease-linear text-left"
            onClick={openDeleteModal}
          >
            <div class="w-11 h-11 flex items-center justify-center bg-[rgba(239,68,68,0.1)] rounded-[var(--radius-input,12px)] text-[var(--data-red,#ef4444)] transition-all duration-200 ease-linear shrink-0">
              <AlertTriangle size={18} strokeWidth={1.5} />
            </div>
            <div class="flex-1 flex flex-col gap-0.5 min-w-0">
              <span class="text-[15px] font-medium text-[var(--data-red,#ef4444)]">
                {t('security.deleteAccount')}
              </span>
              <span class="text-[13px] text-[var(--gray-500,#64748b)]">
                {t('security.deleteAccountDesc')}
              </span>
            </div>
            <div class="text-[var(--gray-400,#94a3b8)] shrink-0">
              <ChevronRight size={18} strokeWidth={1.5} />
            </div>
          </button>
        </FormSection>
      </div>

      {showDeleteModal && (
        <div class="fixed inset-0 flex items-center justify-center p-5 z-[100]" role="presentation">
          <div
            class="absolute inset-0 bg-[rgba(15,23,42,0.6)] backdrop-blur-[8px]"
            onClick={closeDeleteModal}
            role="button"
            tabIndex={-1}
            aria-label={t('aria.closeModal')}
          />
          <div
            class="relative bg-[var(--white,#dbe8f4)] border border-[var(--gray-200,#e2e8f0)] rounded-[var(--radius-card,20px)] p-7 max-w-[400px] w-full shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            <button
              class="absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-[var(--gray-100,#f1f5f9)] border-none rounded-[var(--radius-input,12px)] text-[var(--gray-500,#64748b)] cursor-pointer transition-all duration-200 ease-linear"
              onClick={closeDeleteModal}
              aria-label={t('common.close')}
            >
              <X size={20} strokeWidth={2} />
            </button>

            <div class="w-[72px] h-[72px] bg-[rgba(239,68,68,0.1)] rounded-full flex items-center justify-center text-[var(--data-red,#ef4444)] mx-auto mb-5">
              <AlertTriangle size={32} strokeWidth={1.5} />
            </div>

            <h2
              id="delete-modal-title"
              class="font-[var(--font-display,system-ui)] text-xl font-bold text-[var(--gray-900,#0f172a)] text-center mt-0 mb-2 tracking-[-0.02em]"
            >
              {t('security.deleteConfirmTitle')}
            </h2>
            <p class="text-sm text-[var(--gray-600,#475569)] text-center leading-normal mt-0 mb-6">
              {t('security.deleteConfirmDesc')}
            </p>

            <div class="mb-5">
              <label htmlFor="confirm-delete" class="block text-[13px] font-medium text-[var(--gray-700,#334155)] mb-2">
                {t('security.deleteConfirmLabel').replace('{phrase}', confirmPhrase)}
              </label>
              <input
                id="confirm-delete"
                type="text"
                class="w-full py-3.5 px-4 bg-transparent border border-[var(--gray-200,#e2e8f0)] rounded-[var(--radius-input,12px)] text-[var(--gray-900,#0f172a)] text-[15px] transition-all duration-200 ease-linear box-border"
                value={deleteConfirmText}
                onInput={(e) => setDeleteConfirmText((e.target as HTMLInputElement).value)}
                placeholder={confirmPhrase}
                autoComplete="off"
                autoCapitalize="off"
                spellcheck={false}
              />
            </div>

            {deleteError && (
              <p class="text-[var(--data-red,#ef4444)] text-[13px] font-medium mt-0 mb-4 text-center">
                {deleteError}
              </p>
            )}

            <div class="flex gap-3">
              <button
                class={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-[var(--radius-button,14px)] text-[15px] font-semibold cursor-pointer transition-all duration-200 ease-linear bg-[var(--gray-100,#f1f5f9)] border border-[var(--gray-200,#e2e8f0)] text-[var(--gray-700,#334155)]',
                  isDeleting && 'opacity-50 cursor-not-allowed'
                )}
                onClick={closeDeleteModal}
                disabled={isDeleting}
              >
                {t('security.cancel')}
              </button>
              <button
                class={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-[var(--radius-button,14px)] text-[15px] font-semibold cursor-pointer transition-all duration-200 ease-linear bg-[var(--data-red,#ef4444)] border-none text-white',
                  (!canDelete || isDeleting) && 'opacity-50 cursor-not-allowed'
                )}
                onClick={handleDeleteAccount}
                disabled={!canDelete || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} class="animate-spin" />
                    <span>{t('security.deleting')}</span>
                  </>
                ) : (
                  <span>{t('security.deleteButton')}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
