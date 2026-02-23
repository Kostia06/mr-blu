import { useEffect } from 'preact/hooks'
import { supabase } from '@/lib/supabase/client'
import { navigateTo } from '@/lib/navigation'
import { Spinner } from '@/components/ui/Spinner'

export function AuthCallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const next = params.get('next') || '/dashboard'

    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        navigateTo(next)
      } else if (event === 'SIGNED_OUT') {
        navigateTo('/login')
      }
    })

    // Fallback redirect if auth state doesn't fire within 5s
    const timeout = setTimeout(() => navigateTo(next), 5000)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Spinner />
    </div>
  )
}
