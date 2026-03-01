import { useState, useEffect, useCallback } from 'preact/hooks';
import { Lock, Loader2, ArrowLeft, Eye, EyeOff, Check, Circle, CheckCircle } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import { updatePassword, AuthError } from '@/lib/api/auth';
import { validatePassword } from '@/lib/validation/password';
import { supabase } from '@/lib/supabase/client';
import { navigateTo } from '@/lib/navigation';
import { cn } from '@/lib/utils';

function PasswordRequirements({ password }: { password: string }) {
  const { t } = useI18nStore();
  const validation = validatePassword(password);

  const rules = [
    { key: 'hasMinLength', label: t('auth.req8Chars') },
    { key: 'hasUppercase', label: t('auth.reqUppercase') },
    { key: 'hasNumber', label: t('auth.reqNumber') },
  ] as const;

  return (
    <div class="mt-2 flex flex-col gap-1">
      {rules.map(({ key, label }) => {
        const met = validation[key];
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
  );
}

export function ResetPasswordPage() {
  const { t } = useI18nStore();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigateTo('/login');
        return;
      }
      setChecking(false);
      requestAnimationFrame(() => setVisible(true));
    }
    checkSession();
  }, []);

  const handleSubmit = useCallback(async (e: Event) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('auth.passwordsMismatch');
      return;
    }

    const validation = validatePassword(password);
    if (!validation.isValid) {
      setError('auth.passwordRequirements');
      return;
    }

    setLoading(true);

    try {
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => navigateTo('/dashboard'), 2000);
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message || 'auth.genericError');
      } else {
        setError('auth.genericError');
      }
    } finally {
      setLoading(false);
    }
  }, [password, confirmPassword]);

  const translatedError = error ? (() => {
    const translated = t(error);
    return translated !== error ? translated : error;
  })() : null;

  if (checking) return null;

  const inputClass = 'w-full py-3.5 px-4 max-[480px]:py-3 max-[480px]:px-3.5 border border-[var(--gray-200,#e2e8f0)] bg-white/80 text-[var(--gray-900,#0f172a)] rounded-[14px] text-base outline-none transition-all duration-200 box-border focus:border-[var(--blu-primary,#0066ff)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,102,255,0.1)] placeholder:text-[var(--gray-400,#94a3b8)]';

  return (
    <div class="relative min-h-screen min-h-dvh bg-[var(--white,#dbe8f4)] flex flex-col items-center justify-center p-6 max-[480px]:p-5 overflow-hidden">
      <div class={cn(
        'relative z-[1] w-full max-w-[400px] opacity-0 translate-y-5 transition-[opacity,transform] duration-600 ease-[cubic-bezier(0.16,1,0.3,1)]',
        visible && '!opacity-100 !translate-y-0'
      )}>
        <div class="text-center mb-8">
          <h1 class="font-[var(--font-display,system-ui)] text-[32px] font-bold text-[var(--blu-primary,#0066ff)] m-0 tracking-[-0.02em]">mrblu</h1>
          <p class="mt-2 text-base text-[var(--gray-500,#64748b)]">{t('auth.setNewPassword')}</p>
        </div>

        <div class="bg-white/70 backdrop-blur-[20px] p-8 max-[480px]:p-6 rounded-3xl max-[480px]:rounded-[20px] border border-white/80 shadow-[0_4px_24px_rgba(0,102,255,0.08),0_1px_3px_rgba(0,0,0,0.04)]">
          {success ? (
            <div class="text-center py-6">
              <div class="w-[72px] h-[72px] flex items-center justify-center bg-gradient-to-br from-emerald-500/10 to-sky-500/10 rounded-full text-[var(--data-green,#10b981)] mx-auto mb-5">
                <CheckCircle size={32} strokeWidth={1.5} />
              </div>
              <h2 class="font-[var(--font-display,system-ui)] text-xl font-bold text-[var(--gray-900,#0f172a)] m-0 mb-2">{t('auth.passwordUpdated')}</h2>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit}>
                <div class="mb-5">
                  <label for="new-password" class="block text-sm font-semibold text-[var(--gray-700,#334155)] mb-2">
                    {t('auth.newPassword')}
                  </label>
                  <div class="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="new-password"
                      value={password}
                      onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                      placeholder="••••••••"
                      class={cn(inputClass, 'pr-12')}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[var(--gray-400,#94a3b8)] hover:text-[var(--gray-600,#475569)] bg-transparent border-none cursor-pointer transition-colors duration-150"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <PasswordRequirements password={password} />
                  )}
                </div>

                <div class="mb-5">
                  <label for="confirm-password" class="block text-sm font-semibold text-[var(--gray-700,#334155)] mb-2">
                    {t('auth.confirmPassword')}
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirm-password"
                    value={confirmPassword}
                    onInput={(e) => setConfirmPassword((e.target as HTMLInputElement).value)}
                    placeholder="••••••••"
                    class={inputClass}
                    required
                    autoComplete="new-password"
                  />
                </div>

                <button type="submit" disabled={loading} class="w-full flex items-center justify-center gap-2.5 py-4 px-6 max-[480px]:py-3.5 max-[480px]:px-5 bg-gradient-to-br from-[var(--blu-primary,#0066ff)] to-[#0ea5e9] text-white border-none rounded-[14px] text-base font-semibold cursor-pointer transition-all duration-200 shadow-[0_4px_16px_rgba(0,102,255,0.3)] hover:enabled:-translate-y-0.5 hover:enabled:shadow-[0_6px_24px_rgba(0,102,255,0.4)] active:enabled:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none">
                  {loading ? (
                    <Loader2 size={20} strokeWidth={2} class="animate-spin" />
                  ) : (
                    <Lock size={20} strokeWidth={2} />
                  )}
                  <span>{t('auth.updatePasswordButton')}</span>
                </button>
              </form>

              {translatedError && (
                <div class="mt-5 py-3.5 px-4 rounded-xl text-sm text-center bg-red-500/10 border border-red-500/20">
                  <p class="text-[var(--data-red,#ef4444)] m-0">{translatedError}</p>
                </div>
              )}
            </>
          )}
        </div>

        <a href="/login" class="flex items-center justify-center gap-1.5 mt-7 text-sm font-medium text-[var(--gray-500,#64748b)] no-underline transition-all duration-200 hover:text-[var(--blu-primary,#0066ff)]">
          <ArrowLeft size={16} strokeWidth={2} />
          <span>{t('auth.backToLogin')}</span>
        </a>
      </div>

    </div>
  );
}
