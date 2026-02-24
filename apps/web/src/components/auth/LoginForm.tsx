import { useState, useEffect, useRef, useMemo, useCallback } from 'preact/hooks';
import { Mail, Loader2, ArrowLeft, Send, RefreshCw, Zap, Lock } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import { loginWithOtp, devLogin, AuthError } from '@/lib/api/auth';
import { cn } from '@/lib/utils';

const IS_DEV = import.meta.env.DEV;

interface LoginFormProps {
  urlError: string | null;
}

const RESEND_DELAY = 60;

export function LoginForm({ urlError }: LoginFormProps) {
  const { t } = useI18nStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [visible, setVisible] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const translatedError = useMemo(() => {
    const errorKey = error || urlError;
    if (!errorKey) return null;

    if (errorKey === 'auth.tooManyAttempts' && retryAfter) {
      return t('auth.tooManyAttempts').replace('{seconds}', String(retryAfter));
    }

    const translated = t(errorKey);
    return translated !== errorKey ? translated : errorKey;
  }, [error, urlError, retryAfter, t]);

  const startResendTimer = useCallback(() => {
    setResendCountdown(RESEND_DELAY);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          countdownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));

    if (urlError) {
      history.replaceState(null, '', '/login');
    }

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const handleSubmit = useCallback(async (submittedEmail: string) => {
    setLoading(true);
    setError(null);
    setRetryAfter(null);

    try {
      await loginWithOtp(submittedEmail);
      setSuccess(true);
      setSentEmail(submittedEmail);
      startResendTimer();
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message || 'auth.genericError');
        if (err.retryAfter) setRetryAfter(err.retryAfter);
      } else {
        setError('auth.genericError');
      }
    } finally {
      setLoading(false);
    }
  }, [startResendTimer]);

  const handleFormSubmit = useCallback((e: Event) => {
    e.preventDefault();
    handleSubmit(email);
  }, [email, handleSubmit]);

  const handleResend = useCallback((e: Event) => {
    e.preventDefault();
    handleSubmit(sentEmail);
  }, [sentEmail, handleSubmit]);

  const handleDevLogin = useCallback(async (e: Event) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await devLogin(email, password);
      window.location.href = '/dashboard';
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message || 'auth.genericError');
      } else {
        setError('auth.genericError');
      }
    } finally {
      setLoading(false);
    }
  }, [email, password]);

  return (
    <div class="login-page relative min-h-screen min-h-dvh bg-[var(--white,#dbe8f4)] flex flex-col items-center justify-center p-6 max-[480px]:p-5 overflow-hidden">
      {/* Background Blobs */}
      <div class="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div class="blob blob-1 absolute rounded-full blur-[80px] w-[500px] h-[500px] bg-gradient-to-br from-[#0066ff] to-[#0ea5e9] opacity-25 -top-[150px] -right-[100px]" />
        <div class="blob blob-2 absolute rounded-full blur-[80px] w-[400px] h-[400px] bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] opacity-20 -bottom-[100px] -left-[100px]" />
        <div class="blob blob-3 absolute rounded-full blur-[80px] w-[300px] h-[300px] bg-gradient-to-br from-[#0ea5e9] to-[#6366f1] opacity-15 top-[40%] left-1/2 -translate-x-1/2" />
      </div>

      <div class={cn(
        'login-container relative z-[1] w-full max-w-[400px] opacity-0 translate-y-5 transition-[opacity,transform] duration-600 ease-[cubic-bezier(0.16,1,0.3,1)]',
        visible && 'visible !opacity-100 !translate-y-0'
      )}>
        {/* Header */}
        <div class="text-center mb-8">
          <h1 class="font-[var(--font-display,system-ui)] text-[32px] font-bold text-[var(--blu-primary,#0066ff)] m-0 tracking-[-0.02em]">mrblu</h1>
          <p class="mt-2 text-base text-[var(--gray-500,#64748b)]">{t('auth.signIn')}</p>
        </div>

        {/* Login Card */}
        <div class="bg-white/70 backdrop-blur-[20px] p-8 max-[480px]:p-6 rounded-3xl max-[480px]:rounded-[20px] border border-white/80 shadow-[0_4px_24px_rgba(0,102,255,0.08),0_1px_3px_rgba(0,0,0,0.04)]">
          {success ? (
            <div class="text-center py-6">
              <div class="w-[72px] h-[72px] flex items-center justify-center bg-gradient-to-br from-emerald-500/10 to-sky-500/10 rounded-full text-[var(--data-green,#10b981)] mx-auto mb-5">
                <Send size={32} strokeWidth={1.5} />
              </div>
              <h2 class="font-[var(--font-display,system-ui)] text-xl font-bold text-[var(--gray-900,#0f172a)] m-0 mb-2">{t('auth.checkEmail')}</h2>
              <p class="text-[15px] text-[var(--gray-500,#64748b)] m-0 leading-relaxed">{t('auth.magicLinkSent')}</p>

              <div class="mt-6 pt-5 border-t border-[var(--gray-200,#e2e8f0)]">
                {resendCountdown > 0 ? (
                  <p class="text-sm text-[var(--gray-500,#64748b)] m-0">
                    {t('auth.resendIn')} <span class="font-semibold text-[var(--blu-primary,#0066ff)] tabular-nums">{resendCountdown}s</span>
                  </p>
                ) : (
                  <form onSubmit={handleResend}>
                    <button type="submit" disabled={loading} class="inline-flex items-center justify-center gap-2 px-5 py-3 bg-transparent text-[var(--blu-primary,#0066ff)] border border-[var(--blu-primary,#0066ff)] rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 hover:enabled:bg-[rgba(0,102,255,0.05)] active:enabled:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed">
                      {loading ? (
                        <Loader2 size={16} strokeWidth={2} class="animate-spin" />
                      ) : (
                        <RefreshCw size={16} strokeWidth={2} />
                      )}
                      <span>{t('auth.resendEmail')}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleFormSubmit}>
                <div class="mb-5">
                  <label for="email" class="block text-sm font-semibold text-[var(--gray-700,#334155)] mb-2">
                    {t('auth.email')}
                  </label>
                  <input
                    type="email"
                    id="email"
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
                  <span>{t('auth.sendMagicLink')}</span>
                </button>

                <p class="text-xs text-[var(--gray-400,#94a3b8)] text-center mt-4 leading-relaxed [&_a]:text-[var(--gray-500,#64748b)] [&_a]:underline [&_a:hover]:text-[var(--blu-primary,#0066ff)]">
                  {t('auth.termsNotice')}{' '}
                  <a href="/terms" target="_blank">{t('auth.termsOfService')}</a>{' '}
                  {t('auth.and')}{' '}
                  <a href="/privacy" target="_blank">{t('auth.privacyPolicy')}</a>.
                </p>
              </form>

              {IS_DEV && (
                <div class="mt-5">
                  <div class="dev-login-divider flex items-center gap-3 mb-4">
                    <span class="text-[11px] font-bold text-amber-800 tracking-widest whitespace-nowrap">DEV LOGIN</span>
                  </div>
                  <form onSubmit={handleDevLogin}>
                    <div class="mb-5">
                      <label for="dev-password" class="block text-sm font-semibold text-[var(--gray-700,#334155)] mb-2">
                        <Lock size={14} strokeWidth={2} class="inline align-[-2px]" />
                        {' '}Password
                      </label>
                      <input
                        type="password"
                        id="dev-password"
                        value={password}
                        onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                        placeholder="Dev password"
                        class="w-full py-3.5 px-4 border border-[var(--gray-200,#e2e8f0)] bg-white/80 text-[var(--gray-900,#0f172a)] rounded-[14px] text-base outline-none transition-all duration-200 box-border focus:border-[var(--blu-primary,#0066ff)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,102,255,0.1)] placeholder:text-[var(--gray-400,#94a3b8)]"
                        required
                        autoComplete="current-password"
                      />
                    </div>
                    <button type="submit" disabled={loading} class="w-full flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-br from-amber-400 to-amber-600 text-white border-none rounded-[14px] text-sm font-bold cursor-pointer transition-all duration-200 uppercase tracking-wide hover:enabled:-translate-y-px hover:enabled:shadow-[0_4px_12px_rgba(245,158,11,0.4)] disabled:opacity-60 disabled:cursor-not-allowed">
                      {loading ? (
                        <Loader2 size={16} strokeWidth={2} class="animate-spin" />
                      ) : (
                        <Zap size={16} strokeWidth={2} />
                      )}
                      <span>Dev Login</span>
                    </button>
                  </form>
                </div>
              )}

              {translatedError && (
                <div class="mt-5 py-3.5 px-4 rounded-xl text-sm text-center bg-red-500/10 border border-red-500/20">
                  <p class="text-[var(--data-red,#ef4444)] m-0">{translatedError}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Back Link */}
        <a href="/" class="flex items-center justify-center gap-1.5 mt-7 text-sm font-medium text-[var(--gray-500,#64748b)] no-underline transition-all duration-200 hover:text-[var(--blu-primary,#0066ff)]">
          <ArrowLeft size={16} strokeWidth={2} />
          <span>{t('auth.backHome')}</span>
        </a>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }

        .blob-1 { animation: float 20s ease-in-out infinite; }
        .blob-2 { animation: float 25s ease-in-out infinite reverse; }
        .blob-3 { animation: float 18s ease-in-out infinite; }

        .dev-login-divider::before,
        .dev-login-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: repeating-linear-gradient(
            90deg,
            #f59e0b 0px,
            #f59e0b 4px,
            transparent 4px,
            transparent 8px
          );
        }

        @media (prefers-reduced-motion: reduce) {
          .login-container {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
          .blob { animation: none !important; }
        }

        @media (max-width: 480px) {
          .login-page { padding: 20px; }
          .login-page .dev-login-divider ~ form input { padding: 12px 14px; }
        }
      `}</style>
    </div>
  );
}
