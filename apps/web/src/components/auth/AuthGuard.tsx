import { useEffect, useState, useCallback } from 'preact/hooks'
import { useLocation } from 'wouter'
import { Mail, RefreshCw, LogOut } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useI18nStore } from '@/lib/i18n'
import { supabase } from '@/lib/supabase/client'
import { Spinner } from '@/components/ui/Spinner'

const POLL_INTERVAL = 5000
const WHITELIST_CHECK_INTERVAL = 30000

interface AuthGuardProps {
  children: preact.ComponentChildren
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, initialized, setSession, setUser, setInitialized } = useAuthStore()
  const [, navigate] = useLocation()

  useEffect(() => {
    if (initialized) return

    let cancelled = false

    async function restoreSession() {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        if (!cancelled) {
          setSession(session)
          setUser(session.user)
          setInitialized(true)
        }
        return
      }

      // iOS Safari can delay localStorage access on cold loads.
      // Retry once after a short wait before giving up.
      await new Promise((r) => setTimeout(r, 300))
      if (cancelled) return

      const { data: retry } = await supabase.auth.getSession()

      if (!cancelled) {
        setSession(retry.session)
        setUser(retry.session?.user ?? null)
        setInitialized(true)
      }
    }

    restoreSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [initialized, setSession, setUser, setInitialized])

  useEffect(() => {
    if (initialized && !user) {
      navigate('/login')
    }
  }, [initialized, user, navigate])

  // Periodically verify the user is still on the whitelist
  useEffect(() => {
    if (!user?.email) return

    let cancelled = false

    async function checkWhitelist() {
      const { data } = await supabase.rpc('is_email_allowed', { check_email: user!.email })
      if (cancelled) return
      if (!data) {
        await supabase.auth.signOut()
        setSession(null)
        setUser(null)
      }
    }

    checkWhitelist()
    const interval = setInterval(checkWhitelist, WHITELIST_CHECK_INTERVAL)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [user?.email, setSession, setUser])

  if (!initialized || !user) {
    return (
      <div class="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  const isEmailConfirmed = !!user.email_confirmed_at

  if (!isEmailConfirmed) {
    return <EmailConfirmationGate email={user.email ?? ''} />
  }

  return <>{children}</>
}

function EmailConfirmationGate({ email }: { email: string }) {
  const { t } = useI18nStore()
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const { setSession, setUser } = useAuthStore()

  const handleResend = useCallback(async () => {
    setResending(true)
    setResent(false)
    try {
      await supabase.auth.resend({ type: 'signup', email })
      setResent(true)
    } finally {
      setResending(false)
    }
  }, [email])

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
  }, [setSession, setUser])

  // Poll for email confirmation
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data: { user: refreshed } } = await supabase.auth.getUser()
      if (refreshed?.email_confirmed_at) {
        setUser(refreshed)
      }
    }, POLL_INTERVAL)

    return () => clearInterval(interval)
  }, [setUser])

  return (
    <div class="min-h-screen flex items-center justify-center px-4">
      <div class="w-full max-w-sm text-center space-y-6">
        <div class="mx-auto w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
          <Mail class="w-8 h-8 text-blue-500" />
        </div>

        <div class="space-y-2">
          <h1 class="text-xl font-semibold text-gray-900">
            {t('auth.confirmEmailGateTitle')}
          </h1>
          <p class="text-sm text-gray-500">
            {t('auth.confirmEmailGateDesc', { email })}
          </p>
        </div>

        <div class="space-y-3">
          <button
            onClick={handleResend}
            disabled={resending}
            class="w-full inline-flex items-center justify-center gap-2 min-h-[48px] px-5 font-semibold text-sm text-white bg-blue-500 rounded-xl active:scale-[0.97] transition-transform disabled:opacity-50"
          >
            {resending ? <Spinner size="sm" /> : <RefreshCw class="w-4 h-4" />}
            {t('auth.resendConfirmation')}
          </button>

          {resent && (
            <p class="text-sm text-green-600 font-medium">
              {t('auth.resendSuccess')}
            </p>
          )}

          <button
            onClick={handleSignOut}
            class="w-full inline-flex items-center justify-center gap-2 min-h-[44px] text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <LogOut class="w-4 h-4" />
            {t('auth.signOutInstead')}
          </button>
        </div>
      </div>
    </div>
  )
}
