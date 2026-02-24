import { useState, useEffect, useRef, useMemo, useCallback } from 'preact/hooks';
import { Mail, Loader2, ArrowLeft, Send, RefreshCw, Zap, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18nStore } from '@/lib/i18n';
import { loginWithOtp, devLogin, AuthError } from '@/lib/api/auth';

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
    <div class="login-page">
      {/* Background Blobs */}
      <div class="bg-decoration" aria-hidden="true">
        <div class="blob blob-1" />
        <div class="blob blob-2" />
        <div class="blob blob-3" />
      </div>

      <div class={cn('login-container', visible && 'visible')}>
        {/* Header */}
        <div class="login-header">
          <h1 class="login-title">mrblu</h1>
          <p class="login-subtitle">{t('auth.signIn')}</p>
        </div>

        {/* Login Card */}
        <div class="login-card">
          {success ? (
            <div class="success-state">
              <div class="success-icon">
                <Send size={32} strokeWidth={1.5} />
              </div>
              <h2 class="success-title">{t('auth.checkEmail')}</h2>
              <p class="success-text">{t('auth.magicLinkSent')}</p>

              <div class="resend-section">
                {resendCountdown > 0 ? (
                  <p class="resend-timer">
                    {t('auth.resendIn')} <span class="countdown">{resendCountdown}s</span>
                  </p>
                ) : (
                  <form onSubmit={handleResend}>
                    <button type="submit" disabled={loading} class="resend-btn">
                      {loading ? (
                        <Loader2 size={16} strokeWidth={2} className="spinner" />
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
                <div class="form-group">
                  <label for="email" class="form-label">
                    {t('auth.email')}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                    placeholder={t('auth.emailPlaceholder')}
                    class="form-input"
                    required
                    autoComplete="email"
                  />
                </div>

                <button type="submit" disabled={loading} class="submit-btn">
                  {loading ? (
                    <Loader2 size={20} strokeWidth={2} className="spinner" />
                  ) : (
                    <Mail size={20} strokeWidth={2} />
                  )}
                  <span>{t('auth.sendMagicLink')}</span>
                </button>

                <p class="terms-notice">
                  {t('auth.termsNotice')}{' '}
                  <a href="/terms" target="_blank">{t('auth.termsOfService')}</a>{' '}
                  {t('auth.and')}{' '}
                  <a href="/privacy" target="_blank">{t('auth.privacyPolicy')}</a>.
                </p>
              </form>

              {IS_DEV && (
                <div class="dev-login-section">
                  <div class="dev-login-divider">
                    <span>DEV LOGIN</span>
                  </div>
                  <form onSubmit={handleDevLogin}>
                    <div class="form-group">
                      <label for="dev-password" class="form-label">
                        <Lock size={14} strokeWidth={2} className="inline align-[-2px]" />
                        {' '}Password
                      </label>
                      <input
                        type="password"
                        id="dev-password"
                        value={password}
                        onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                        placeholder="Dev password"
                        class="form-input"
                        required
                        autoComplete="current-password"
                      />
                    </div>
                    <button type="submit" disabled={loading} class="dev-login-btn">
                      {loading ? (
                        <Loader2 size={16} strokeWidth={2} className="spinner" />
                      ) : (
                        <Zap size={16} strokeWidth={2} />
                      )}
                      <span>Dev Login</span>
                    </button>
                  </form>
                </div>
              )}

              {translatedError && (
                <div class="message error">
                  <p>{translatedError}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Back Link */}
        <a href="/" class="back-link">
          <ArrowLeft size={16} strokeWidth={2} />
          <span>{t('auth.backHome')}</span>
        </a>
      </div>

      <style>{`
        .login-page {
          position: relative;
          min-height: 100vh;
          min-height: 100dvh;
          background: var(--white, #dbe8f4);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          overflow: hidden;
        }

        .bg-decoration {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
        }

        .blob-1 {
          width: 500px;
          height: 500px;
          background: linear-gradient(135deg, #0066ff 0%, #0ea5e9 100%);
          opacity: 0.25;
          top: -150px;
          right: -100px;
          animation: float 20s ease-in-out infinite;
        }

        .blob-2 {
          width: 400px;
          height: 400px;
          background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
          opacity: 0.2;
          bottom: -100px;
          left: -100px;
          animation: float 25s ease-in-out infinite reverse;
        }

        .blob-3 {
          width: 300px;
          height: 300px;
          background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%);
          opacity: 0.15;
          top: 40%;
          left: 50%;
          transform: translateX(-50%);
          animation: float 18s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }

        .login-container {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 400px;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .login-container.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-title {
          font-family: var(--font-display, system-ui);
          font-size: 32px;
          font-weight: 700;
          color: var(--blu-primary, #0066ff);
          margin: 0;
          letter-spacing: -0.02em;
        }

        .login-subtitle {
          margin-top: 8px;
          font-size: 16px;
          color: var(--gray-500, #64748b);
        }

        .login-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: 32px;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 4px 24px rgba(0, 102, 255, 0.08),
                      0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: var(--gray-700, #334155);
          margin-bottom: 8px;
        }

        .form-input {
          width: 100%;
          padding: 14px 16px;
          border: 1px solid var(--gray-200, #e2e8f0);
          background: rgba(255, 255, 255, 0.8);
          color: var(--gray-900, #0f172a);
          border-radius: 14px;
          font-size: 16px;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .form-input:focus {
          border-color: var(--blu-primary, #0066ff);
          background: rgba(255, 255, 255, 1);
          box-shadow: 0 0 0 4px rgba(0, 102, 255, 0.1);
        }

        .form-input::placeholder {
          color: var(--gray-400, #94a3b8);
        }

        .submit-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px 24px;
          background: linear-gradient(135deg, var(--blu-primary, #0066ff) 0%, #0ea5e9 100%);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 16px rgba(0, 102, 255, 0.3);
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(0, 102, 255, 0.4);
        }

        .submit-btn:active:not(:disabled) {
          transform: scale(0.98);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .success-state {
          text-align: center;
          padding: 24px 0;
        }

        .success-icon {
          width: 72px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(14, 165, 233, 0.1) 100%);
          border-radius: 50%;
          color: var(--data-green, #10b981);
          margin: 0 auto 20px;
        }

        .success-title {
          font-family: var(--font-display, system-ui);
          font-size: 20px;
          font-weight: 700;
          color: var(--gray-900, #0f172a);
          margin: 0 0 8px;
        }

        .success-text {
          font-size: 15px;
          color: var(--gray-500, #64748b);
          margin: 0;
          line-height: 1.5;
        }

        .resend-section {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid var(--gray-200, #e2e8f0);
        }

        .resend-timer {
          font-size: 14px;
          color: var(--gray-500, #64748b);
          margin: 0;
        }

        .countdown {
          font-weight: 600;
          color: var(--blu-primary, #0066ff);
          font-variant-numeric: tabular-nums;
        }

        .resend-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          background: transparent;
          color: var(--blu-primary, #0066ff);
          border: 1px solid var(--blu-primary, #0066ff);
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .resend-btn:hover:not(:disabled) {
          background: rgba(0, 102, 255, 0.05);
        }

        .resend-btn:active:not(:disabled) {
          transform: scale(0.98);
        }

        .resend-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .terms-notice {
          font-size: 12px;
          color: var(--gray-400, #94a3b8);
          text-align: center;
          margin: 16px 0 0;
          line-height: 1.5;
        }

        .terms-notice a {
          color: var(--gray-500, #64748b);
          text-decoration: underline;
        }

        .terms-notice a:hover {
          color: var(--blu-primary, #0066ff);
        }

        .message {
          margin-top: 20px;
          padding: 14px 16px;
          border-radius: 12px;
          font-size: 14px;
          text-align: center;
        }

        .message.error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .message.error p {
          color: var(--data-red, #ef4444);
          margin: 0;
        }

        .back-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 28px;
          font-size: 14px;
          font-weight: 500;
          color: var(--gray-500, #64748b);
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .back-link:hover {
          color: var(--blu-primary, #0066ff);
        }

        .dev-login-section {
          margin-top: 20px;
        }

        .dev-login-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

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

        .dev-login-divider span {
          font-size: 11px;
          font-weight: 700;
          color: #b45309;
          letter-spacing: 0.1em;
          white-space: nowrap;
        }

        .dev-login-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .dev-login-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
        }

        .dev-login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (prefers-reduced-motion: reduce) {
          .login-container {
            opacity: 1;
            transform: none;
            transition: none;
          }
          .blob { animation: none; }
          .spinner { animation: none; }
        }

        @media (max-width: 480px) {
          .login-page { padding: 20px; }
          .login-card { padding: 24px; border-radius: 20px; }
          .form-input { padding: 16px; }
          .submit-btn { padding: 16px 20px; }
        }
      `}</style>
    </div>
  );
}
