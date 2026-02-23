import { useAuthStore } from '@/stores/authStore'
import { LanguageSettings } from '@/components/settings/LanguageSettings'

export function LanguagePage() {
  const user = useAuthStore((s) => s.user)
  return <LanguageSettings user={user} />
}
