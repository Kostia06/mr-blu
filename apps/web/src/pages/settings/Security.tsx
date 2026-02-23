import { useAuthStore } from '@/stores/authStore'
import { SecuritySettings } from '@/components/settings/SecuritySettings'

export function SecurityPage() {
  const user = useAuthStore((s) => s.user)
  return <SecuritySettings user={user} />
}
