import { useEffect } from 'preact/hooks'
import { useLocation } from 'wouter'
import { useAuthStore } from '@/stores/authStore'
import { LoginForm } from '@/components/auth/LoginForm'

export function LoginPage() {
  const user = useAuthStore((s) => s.user)
  const [, navigate] = useLocation()

  useEffect(() => {
    if (user) navigate('/dashboard')
  }, [user, navigate])

  const params = new URLSearchParams(window.location.search)
  const errorParam = params.get('error')
  let urlError: string | null = null

  if (errorParam) {
    urlError = errorParam.includes('expired') || errorParam.includes('invalid')
      ? 'auth.linkExpired'
      : 'auth.genericError'
  }

  return <LoginForm urlError={urlError} />
}
