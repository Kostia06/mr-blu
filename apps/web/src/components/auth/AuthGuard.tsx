import { useEffect } from 'preact/hooks'
import { useLocation } from 'wouter'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase/client'
import { Spinner } from '@/components/ui/Spinner'

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

  if (!initialized || !user) {
    return (
      <div class="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return <>{children}</>
}
