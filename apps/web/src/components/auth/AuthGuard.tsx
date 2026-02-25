import { useEffect, useState } from 'preact/hooks'
import { useLocation } from 'wouter'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase/client'
import { Spinner } from '@/components/ui/Spinner'

interface AuthGuardProps {
  children: preact.ComponentChildren
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, setSession, setUser } = useAuthStore()
  const [, navigate] = useLocation()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [setSession, setUser])

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [loading, user, navigate])

  if (loading || !user) {
    return (
      <div class="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return <>{children}</>
}
