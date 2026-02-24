import { useState, useCallback } from 'preact/hooks';
import { Terminal, Loader2, LogIn, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { devLogin, AuthError } from '@/lib/api/auth';

type Mode = 'login' | 'signup';

export function DevLoginForm() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('dev@example.com');
  const [password, setPassword] = useState('devpass123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await devLogin(email, password);
      setSuccess('Signed in successfully! Redirecting...');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message || 'Authentication failed');
      } else {
        setError('Network error. Is the server running?');
      }
    } finally {
      setLoading(false);
    }
  }, [email, password]);

  return (
    <div style={pageStyle}>
      <div style={bannerStyle}>
        <Terminal size={16} />
        <span>Development Mode Only</span>
      </div>

      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={titleStyle}>Dev Login</h1>
          <p style={{ marginTop: '8px', fontSize: '14px', color: '#94a3b8' }}>
            Quick authentication for localhost development
          </p>
        </div>

        <div style={cardStyle}>
          {/* Mode Toggle */}
          <div style={toggleGroupStyle}>
            <button
              style={{ ...toggleBtnStyle, ...(mode === 'login' ? toggleActiveStyle : {}) }}
              onClick={() => setMode('login')}
            >
              <LogIn size={16} /> Sign In
            </button>
            <button
              style={{ ...toggleBtnStyle, ...(mode === 'signup' ? toggleActiveStyle : {}) }}
              onClick={() => setMode('signup')}
            >
              <UserPlus size={16} /> Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                placeholder="dev@example.com"
                style={inputStyle}
                required
                autoComplete="email"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                value={password}
                onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                placeholder="••••••••"
                style={inputStyle}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={6}
              />
            </div>

            <button type="submit" disabled={loading} style={submitStyle}>
              {loading ? (
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              ) : mode === 'login' ? (
                <LogIn size={20} />
              ) : (
                <UserPlus size={20} />
              )}
              <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
            </button>
          </form>

          {error && (
            <div style={{ ...messageStyle, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
              <AlertCircle size={16} />
              <p style={{ margin: 0, lineHeight: '1.4' }}>{error}</p>
            </div>
          )}

          {success && (
            <div style={{ ...messageStyle, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
              <CheckCircle size={16} />
              <p style={{ margin: 0, lineHeight: '1.4' }}>{success}</p>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0 16px', gap: '12px' }}>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(148, 163, 184, 0.2)' }} />
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tips</span>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(148, 163, 184, 0.2)' }} />
          </div>

          <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>
            <p style={{ margin: '0 0 8px' }}>1. Create an account with any email (e.g., <code style={codeStyle}>dev@example.com</code>)</p>
            <p style={{ margin: '0 0 8px' }}>2. Supabase may auto-confirm in dev mode, or check your email</p>
            <p style={{ margin: 0 }}>3. Default password suggestion: <code style={codeStyle}>devpass123</code></p>
          </div>
        </div>

        <a href="/login" style={prodLinkStyle}>Use production login (magic link) →</a>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const pageStyle: Record<string, string> = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
};

const bannerStyle: Record<string, string> = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 16px',
  background: 'rgba(245, 158, 11, 0.15)',
  border: '1px solid rgba(245, 158, 11, 0.3)',
  borderRadius: '100px',
  color: '#fbbf24',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '24px',
};

const titleStyle: Record<string, string> = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: '28px',
  fontWeight: '700',
  color: '#10b981',
  margin: '0',
};

const cardStyle: Record<string, string> = {
  background: 'rgba(30, 41, 59, 0.8)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  padding: '28px',
  borderRadius: '16px',
  border: '1px solid rgba(148, 163, 184, 0.1)',
  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
};

const toggleGroupStyle: Record<string, string> = {
  display: 'flex',
  gap: '8px',
  marginBottom: '24px',
  padding: '4px',
  background: 'rgba(15, 23, 42, 0.5)',
  borderRadius: '10px',
};

const toggleBtnStyle: Record<string, string> = {
  flex: '1',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '10px',
  background: 'transparent',
  border: 'none',
  borderRadius: '8px',
  color: '#94a3b8',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
};

const toggleActiveStyle: Record<string, string> = {
  background: 'rgba(16, 185, 129, 0.15)',
  color: '#10b981',
};

const labelStyle: Record<string, string> = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '500',
  color: '#94a3b8',
  marginBottom: '6px',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
};

const inputStyle: Record<string, string> = {
  width: '100%',
  padding: '12px 14px',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  background: 'rgba(15, 23, 42, 0.6)',
  color: '#e2e8f0',
  borderRadius: '10px',
  fontSize: '15px',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  boxSizing: 'border-box',
};

const submitStyle: Record<string, string> = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  padding: '14px 24px',
  marginTop: '8px',
  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  color: 'white',
  border: 'none',
  borderRadius: '10px',
  fontSize: '15px',
  fontWeight: '600',
  cursor: 'pointer',
};

const messageStyle: Record<string, string> = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
  marginTop: '16px',
  padding: '12px 14px',
  borderRadius: '10px',
  fontSize: '14px',
};

const codeStyle: Record<string, string> = {
  padding: '2px 6px',
  background: 'rgba(16, 185, 129, 0.1)',
  borderRadius: '4px',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: '12px',
  color: '#10b981',
};

const prodLinkStyle: Record<string, string> = {
  display: 'block',
  marginTop: '20px',
  textAlign: 'center',
  fontSize: '14px',
  color: '#64748b',
  textDecoration: 'none',
};
