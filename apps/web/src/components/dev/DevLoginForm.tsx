import { useState, useCallback } from 'preact/hooks';
import { Terminal, Loader2, LogIn, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
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
    <div class="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex flex-col items-center justify-center p-6">
      <div class="flex items-center gap-2 py-2 px-4 bg-amber-500/15 border border-amber-500/30 rounded-full text-amber-300 text-xs font-semibold uppercase tracking-wide mb-6">
        <Terminal size={16} />
        <span>Development Mode Only</span>
      </div>

      <div class="w-full max-w-[400px]">
        <div class="text-center mb-6">
          <h1 class="font-mono text-[28px] font-bold text-emerald-500 m-0">Dev Login</h1>
          <p class="mt-2 text-sm text-slate-400">
            Quick authentication for localhost development
          </p>
        </div>

        <div class="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-7 border border-slate-400/10 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
          {/* Mode Toggle */}
          <div class="flex gap-2 mb-6 p-1 bg-slate-900/50 rounded-[10px]">
            <button
              class={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 border-none rounded-lg text-sm font-medium cursor-pointer transition-colors',
                mode === 'login'
                  ? 'bg-emerald-500/15 text-emerald-500'
                  : 'bg-transparent text-slate-400'
              )}
              onClick={() => setMode('login')}
            >
              <LogIn size={16} /> Sign In
            </button>
            <button
              class={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 border-none rounded-lg text-sm font-medium cursor-pointer transition-colors',
                mode === 'signup'
                  ? 'bg-emerald-500/15 text-emerald-500'
                  : 'bg-transparent text-slate-400'
              )}
              onClick={() => setMode('signup')}
            >
              <UserPlus size={16} /> Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div class="mb-4">
              <label class="block text-[13px] font-medium text-slate-400 mb-1.5 font-mono">Email</label>
              <input
                type="email"
                value={email}
                onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                placeholder="dev@example.com"
                class="w-full py-3 px-3.5 border border-slate-400/20 bg-slate-900/60 text-slate-200 rounded-[10px] text-[15px] font-mono box-border outline-none focus:border-emerald-500 transition-colors"
                required
                autoComplete="email"
              />
            </div>

            <div class="mb-4">
              <label class="block text-[13px] font-medium text-slate-400 mb-1.5 font-mono">Password</label>
              <input
                type="password"
                value={password}
                onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                placeholder="••••••••"
                class="w-full py-3 px-3.5 border border-slate-400/20 bg-slate-900/60 text-slate-200 rounded-[10px] text-[15px] font-mono box-border outline-none focus:border-emerald-500 transition-colors"
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              class="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 mt-2 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none rounded-[10px] text-[15px] font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : mode === 'login' ? (
                <LogIn size={20} />
              ) : (
                <UserPlus size={20} />
              )}
              <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
            </button>
          </form>

          {error && (
            <div class="flex items-start gap-2.5 mt-4 py-3 px-3.5 rounded-[10px] text-sm bg-red-500/10 border border-red-500/20 text-red-400">
              <AlertCircle size={16} />
              <p class="m-0 leading-snug">{error}</p>
            </div>
          )}

          {success && (
            <div class="flex items-start gap-2.5 mt-4 py-3 px-3.5 rounded-[10px] text-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle size={16} />
              <p class="m-0 leading-snug">{success}</p>
            </div>
          )}

          <div class="flex items-center my-6 gap-3">
            <hr class="flex-1 border-none border-t border-slate-400/20" />
            <span class="text-xs font-medium text-slate-500 uppercase tracking-wide">Tips</span>
            <hr class="flex-1 border-none border-t border-slate-400/20" />
          </div>

          <div class="text-[13px] text-slate-400 leading-relaxed">
            <p class="mb-2">1. Create an account with any email (e.g., <code class="py-0.5 px-1.5 bg-emerald-500/10 rounded text-xs font-mono text-emerald-500">dev@example.com</code>)</p>
            <p class="mb-2">2. Supabase may auto-confirm in dev mode, or check your email</p>
            <p class="m-0">3. Default password suggestion: <code class="py-0.5 px-1.5 bg-emerald-500/10 rounded text-xs font-mono text-emerald-500">devpass123</code></p>
          </div>
        </div>

        <a href="/login" class="block mt-5 text-center text-sm text-slate-500 no-underline hover:text-slate-300 transition-colors">
          Use production login (magic link) →
        </a>
      </div>
    </div>
  );
}
