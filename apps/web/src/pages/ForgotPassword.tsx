import { useState, useEffect, useCallback } from 'preact/hooks';
import { Mail, Loader2, ArrowLeft, Send } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import { sendPasswordReset, AuthError } from '@/lib/api/auth';
import { cn } from '@/lib/utils';

export function ForgotPasswordPage() {
  const { t } = useI18nStore();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleSubmit = useCallback(async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await sendPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message || 'auth.genericError');
      } else {
        setError('auth.genericError');
      }
    } finally {
      setLoading(false);
    }
  }, [email]);

  const translatedError = error ? (() => {
    const translated = t(error);
    return translated !== error ? translated : error;
  })() : null;

  return (
    <div class="relative min-h-screen min-h-dvh bg-[var(--white,#dbe8f4)] flex flex-col items-center justify-center p-6 max-[480px]:p-5 overflow-hidden">
      <div class={cn(
        'relative z-[1] w-full max-w-[400px] opacity-0 translate-y-5 transition-[opacity,transform] duration-600 ease-[cubic-bezier(0.16,1,0.3,1)]',
        visible && '!opacity-100 !translate-y-0'
      )}>
        <div class="text-center mb-8">
          <h1 class="font-[var(--font-display,system-ui)] text-[32px] font-bold text-[var(--blu-primary,#0066ff)] m-0 tracking-[-0.02em]">mrblu</h1>
          <p class="mt-2 text-base text-[var(--gray-500,#64748b)]">{t('auth.resetPassword')}</p>
        </div>

        <div class="bg-white/70 backdrop-blur-[20px] p-8 max-[480px]:p-6 rounded-3xl max-[480px]:rounded-[20px] border border-white/80 shadow-[0_4px_24px_rgba(0,102,255,0.08),0_1px_3px_rgba(0,0,0,0.04)]">
          {success ? (
            <div class="text-center py-6">
              <div class="w-[72px] h-[72px] flex items-center justify-center bg-gradient-to-br from-emerald-500/10 to-sky-500/10 rounded-full text-[var(--data-green,#10b981)] mx-auto mb-5">
                <Send size={32} strokeWidth={1.5} />
              </div>
              <h2 class="font-[var(--font-display,system-ui)] text-xl font-bold text-[var(--gray-900,#0f172a)] m-0 mb-2">{t('auth.checkEmail')}</h2>
              <p class="text-[15px] text-[var(--gray-500,#64748b)] m-0 leading-relaxed">{t('auth.resetLinkSent')}</p>
            </div>
          ) : (
            <>
              <p class="text-sm text-[var(--gray-500,#64748b)] m-0 mb-6 leading-relaxed">{t('auth.resetPasswordDesc')}</p>

              <form onSubmit={handleSubmit}>
                <div class="mb-5">
                  <label for="reset-email" class="block text-sm font-semibold text-[var(--gray-700,#334155)] mb-2">
                    {t('auth.email')}
                  </label>
                  <input
                    type="email"
                    id="reset-email"
                    name="email"
                    value={email}
                    onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                    placeholder={t('auth.emailPlaceholder')}
                    class="w-full py-3.5 px-4 max-[480px]:py-3 max-[480px]:px-3.5 border border-[var(--gray-200,#e2e8f0)] bg-white/80 text-[var(--gray-900,#0f172a)] rounded-[14px] text-base outline-none transition-all duration-200 box-border focus:border-[var(--blu-primary,#0066ff)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,102,255,0.1)] placeholder:text-[var(--gray-400,#94a3b8)]"
                    required
                    autoComplete="email"
                  />
                </div>

                <button type="submit" disabled={loading} class="w-full flex items-center justify-center gap-2.5 py-4 px-6 max-[480px]:py-3.5 max-[480px]:px-5 bg-gradient-to-br from-[var(--blu-primary,#0066ff)] to-[#0ea5e9] text-white border-none rounded-[14px] text-base font-semibold cursor-pointer transition-all duration-200 shadow-[0_4px_16px_rgba(0,102,255,0.3)] hover:enabled:-translate-y-0.5 hover:enabled:shadow-[0_6px_24px_rgba(0,102,255,0.4)] active:enabled:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none">
                  {loading ? (
                    <Loader2 size={20} strokeWidth={2} class="animate-spin" />
                  ) : (
                    <Mail size={20} strokeWidth={2} />
                  )}
                  <span>{t('auth.sendResetLink')}</span>
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
