import { useState, useEffect, useRef, useMemo, useCallback } from 'preact/hooks';
import { Mail, Loader2, ArrowLeft, Send, RefreshCw, Lock, Eye, EyeOff, Check, Circle, ShieldCheck } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import { loginWithOtp, loginWithPassword, signUpWithPassword, AuthError } from '@/lib/api/auth';
import { supabase } from '@/lib/supabase/client';
import { validatePassword } from '@/lib/validation/password';
import { cn } from '@/lib/utils';
import { isNative } from '@/lib/native';
import { BackgroundBlobs } from '@/components/landing/BackgroundBlobs';

type AuthTab = 'magic-link' | 'password';
type AuthMode = 'login' | 'signup';
type SuccessType = 'magic-link' | 'confirm-email' | null;

interface LoginFormProps {
  urlError: string | null;
}

const RESEND_DELAY = 60;

const inputClass = 'w-full py-3.5 px-4 max-[480px]:py-3 max-[480px]:px-3.5 border border-[var(--gray-200,#e2e8f0)] bg-white/80 text-[var(--gray-900,#0f172a)] rounded-[14px] text-base outline-none transition-all duration-200 box-border focus:border-[var(--blu-primary,#0066ff)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,102,255,0.1)] placeholder:text-[var(--gray-400,#94a3b8)]';

const primaryBtnClass = 'w-full flex items-center justify-center gap-2.5 py-4 px-6 max-[480px]:py-3.5 max-[480px]:px-5 bg-gradient-to-br from-[var(--blu-primary,#0066ff)] to-[#0ea5e9] text-white border-none rounded-[14px] text-base font-semibold cursor-pointer transition-all duration-200 shadow-[0_4px_16px_rgba(0,102,255,0.3)] hover:enabled:-translate-y-0.5 hover:enabled:shadow-[0_6px_24px_rgba(0,102,255,0.4)] active:enabled:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none';

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

export function LoginForm({ urlError }: LoginFormProps) {
  const { t } = useI18nStore();

  const [activeTab, setActiveTab] = useState<AuthTab>('magic-link');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successType, setSuccessType] = useState<SuccessType>(null);
  const [sentEmail, setSentEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [visible, setVisible] = useState(false);
  const [betaRequested, setBetaRequested] = useState(false);
  const [betaLoading, setBetaLoading] = useState(false);
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

  const clearFormError = useCallback(() => {
    setError(null);
    setRetryAfter(null);
  }, []);

  const handleMagicLinkSubmit = useCallback(async (submittedEmail: string) => {
    setLoading(true);
    clearFormError();

    try {
      await loginWithOtp(submittedEmail);
      setSuccessType('magic-link');
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
  }, [startResendTimer, clearFormError]);

  const handlePasswordSubmit = useCallback(async () => {
    setLoading(true);
    clearFormError();

    try {
      if (authMode === 'signup') {
        if (password !== confirmPassword) {
          setError('auth.passwordsMismatch');
          setLoading(false);
          return;
        }

        const validation = validatePassword(password);
        if (!validation.isValid) {
          setError('auth.passwordRequirements');
          setLoading(false);
          return;
        }

        const result = await signUpWithPassword(email, password);
        if (result.requiresConfirmation) {
          setSuccessType('confirm-email');
          setSentEmail(email);
        } else {
          window.location.href = '/dashboard';
        }
      } else {
        await loginWithPassword(email, password);
        window.location.href = '/dashboard';
      }
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
  }, [authMode, email, password, confirmPassword, clearFormError]);

  const handleFormSubmit = useCallback((e: Event) => {
    e.preventDefault();
    if (activeTab === 'magic-link') {
      handleMagicLinkSubmit(email);
    } else {
      handlePasswordSubmit();
    }
  }, [activeTab, email, handleMagicLinkSubmit, handlePasswordSubmit]);

  const handleResend = useCallback((e: Event) => {
    e.preventDefault();
    handleMagicLinkSubmit(sentEmail);
  }, [sentEmail, handleMagicLinkSubmit]);

  const handleTabChange = useCallback((tab: AuthTab) => {
    setActiveTab(tab);
    clearFormError();
  }, [clearFormError]);

  const handleModeToggle = useCallback(() => {
    setAuthMode((prev) => (prev === 'login' ? 'signup' : 'login'));
    setConfirmPassword('');
    clearFormError();
  }, [clearFormError]);

  const renderSuccess = () => {
    const isConfirmEmail = successType === 'confirm-email';
    return (
      <div class="text-center py-6">
        <div class="w-[72px] h-[72px] flex items-center justify-center bg-gradient-to-br from-emerald-500/10 to-sky-500/10 rounded-full text-[var(--data-green,#10b981)] mx-auto mb-5">
          <Send size={32} strokeWidth={1.5} />
        </div>
        <h2 class="font-[var(--font-display,system-ui)] text-xl font-bold text-[var(--gray-900,#0f172a)] m-0 mb-2">
          {isConfirmEmail ? t('auth.confirmEmail') : t('auth.checkEmail')}
        </h2>
        <p class="text-[15px] text-[var(--gray-500,#64748b)] m-0 leading-relaxed">
          {isConfirmEmail ? t('auth.confirmEmailSent') : t('auth.magicLinkSent')}
        </p>

        {!isConfirmEmail && (
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
        )}
      </div>
    );
  };

  const renderTabs = () => (
    <div class="flex bg-[var(--gray-100,#f1f5f9)] rounded-xl p-1 mb-6">
      {(['magic-link', 'password'] as const).map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => handleTabChange(tab)}
          class={cn(
            'flex-1 py-2.5 px-3 rounded-[10px] text-sm font-semibold transition-all duration-200 border-none cursor-pointer',
            activeTab === tab
              ? 'bg-white text-[var(--gray-900,#0f172a)] shadow-sm'
              : 'bg-transparent text-[var(--gray-500,#64748b)] hover:text-[var(--gray-700,#334155)]'
          )}
        >
          {tab === 'magic-link' ? t('auth.tabMagicLink') : t('auth.tabPassword')}
        </button>
      ))}
    </div>
  );

  const renderMagicLinkForm = () => (
    <>
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
          class={inputClass}
          required
          autoComplete="email"
        />
      </div>

      <button type="submit" disabled={loading} class={primaryBtnClass}>
        {loading ? (
          <Loader2 size={20} strokeWidth={2} class="animate-spin" />
        ) : (
          <Mail size={20} strokeWidth={2} />
        )}
        <span>{t('auth.sendMagicLink')}</span>
      </button>
    </>
  );

  const renderPasswordForm = () => (
    <>
      <div class="mb-5">
        <label for="pw-email" class="block text-sm font-semibold text-[var(--gray-700,#334155)] mb-2">
          {t('auth.email')}
        </label>
        <input
          type="email"
          id="pw-email"
          name="email"
          value={email}
          onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
          placeholder={t('auth.emailPlaceholder')}
          class={inputClass}
          required
          autoComplete="email"
        />
      </div>

      <div class="mb-5">
        <label for="pw-password" class="block text-sm font-semibold text-[var(--gray-700,#334155)] mb-2">
          {t('auth.password')}
        </label>
        <div class="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="pw-password"
            value={password}
            onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
            placeholder="••••••••"
            class={cn(inputClass, 'pr-12')}
            required
            autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
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
        {authMode === 'signup' && password.length > 0 && (
          <PasswordRequirements password={password} />
        )}
      </div>

      {authMode === 'signup' && (
        <div class="mb-5">
          <label for="pw-confirm" class="block text-sm font-semibold text-[var(--gray-700,#334155)] mb-2">
            {t('auth.confirmPassword')}
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            id="pw-confirm"
            value={confirmPassword}
            onInput={(e) => setConfirmPassword((e.target as HTMLInputElement).value)}
            placeholder="••••••••"
            class={inputClass}
            required
            autoComplete="new-password"
          />
        </div>
      )}

      {authMode === 'login' && (
        <div class="mb-5 text-right">
          <a
            href="/forgot-password"
            class="text-sm text-[var(--blu-primary,#0066ff)] no-underline hover:underline font-medium"
          >
            {t('auth.forgotPassword')}
          </a>
        </div>
      )}

      <button type="submit" disabled={loading} class={primaryBtnClass}>
        {loading ? (
          <Loader2 size={20} strokeWidth={2} class="animate-spin" />
        ) : (
          <Lock size={20} strokeWidth={2} />
        )}
        <span>{authMode === 'login' ? t('auth.signInButton') : t('auth.createAccount')}</span>
      </button>

      <p class="text-sm text-center mt-4 text-[var(--gray-500,#64748b)]">
        {authMode === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
        <button
          type="button"
          onClick={handleModeToggle}
          class="text-[var(--blu-primary,#0066ff)] font-semibold bg-transparent border-none cursor-pointer p-0 text-sm hover:underline"
        >
          {authMode === 'login' ? t('auth.signUpLink') : t('auth.signInLink')}
        </button>
      </p>
    </>
  );

  return (
    <div class="login-page relative h-dvh bg-[var(--white,#dbe8f4)] flex flex-col items-center justify-center p-6 max-[480px]:p-5 overflow-hidden overscroll-none">
      <BackgroundBlobs variant="full" intensity="subtle" />
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
          {successType ? (
            renderSuccess()
          ) : (
            <>
              {renderTabs()}

              <form onSubmit={handleFormSubmit}>
                {activeTab === 'magic-link' ? renderMagicLinkForm() : renderPasswordForm()}

                <p class="text-xs text-[var(--gray-400,#94a3b8)] text-center mt-4 leading-relaxed [&_a]:text-[var(--gray-500,#64748b)] [&_a]:underline [&_a:hover]:text-[var(--blu-primary,#0066ff)]">
                  {t('auth.termsNotice')}{' '}
                  <a href="/terms" target="_blank">{t('auth.termsOfService')}</a>{' '}
                  {t('auth.and')}{' '}
                  <a href="/privacy" target="_blank">{t('auth.privacyPolicy')}</a>.
                </p>
              </form>

              {error === 'auth.emailNotWhitelisted' ? (
                <div class="mt-5 py-5 px-5 rounded-2xl text-center bg-gradient-to-br from-blue-50/80 to-sky-50/80 border border-blue-100/60">
                  <div class="w-12 h-12 flex items-center justify-center bg-[var(--blu-primary,#0066ff)]/10 rounded-full mx-auto mb-3">
                    <ShieldCheck size={24} strokeWidth={1.5} class="text-[var(--blu-primary,#0066ff)]" />
                  </div>
                  <p class="text-sm font-semibold text-[var(--gray-800,#1e293b)] m-0 mb-1">{t('auth.betaTitle')}</p>
                  <p class="text-[13px] text-[var(--gray-500,#64748b)] m-0 mb-4 leading-relaxed">{t('auth.betaDescription')}</p>
                  {betaRequested ? (
                    <div class="flex items-center justify-center gap-2 py-3 px-5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium border border-emerald-100">
                      <Check size={16} strokeWidth={2.5} />
                      {t('auth.betaRequestSent')}
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={betaLoading}
                      onClick={async () => {
                        setBetaLoading(true);
                        await supabase.rpc('request_beta_access', { request_email: email });
                        setBetaLoading(false);
                        setBetaRequested(true);
                      }}
                      class="inline-flex items-center justify-center gap-2 w-full py-3 px-5 bg-[var(--blu-primary,#0066ff)] text-white border-none rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,102,255,0.3)] active:scale-[0.98] disabled:opacity-70"
                    >
                      {betaLoading ? <Loader2 size={16} strokeWidth={2} class="animate-spin" /> : <Mail size={16} strokeWidth={2} />}
                      {t('auth.requestAccess')}
                    </button>
                  )}
                </div>
              ) : translatedError ? (
                <div class="mt-5 py-3.5 px-4 rounded-xl text-sm text-center bg-red-500/10 border border-red-500/20">
                  <p class="text-[var(--data-red,#ef4444)] m-0">{translatedError}</p>
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* Back Link — hidden on native (no landing page) */}
        {!isNative && (
          <a href="/" class="flex items-center justify-center gap-1.5 mt-7 text-sm font-medium text-[var(--gray-500,#64748b)] no-underline transition-all duration-200 hover:text-[var(--blu-primary,#0066ff)]">
            <ArrowLeft size={16} strokeWidth={2} />
            <span>{t('auth.backHome')}</span>
          </a>
        )}
      </div>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .login-container {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
        }

        @media (max-width: 480px) {
          .login-page { padding: 20px; }
        }
      `}</style>
    </div>
  );
}
