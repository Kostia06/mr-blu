import { useAuthStore } from '@/stores/authStore'
import { BusinessSettings } from '@/components/settings/BusinessSettings'

export function BusinessPage() {
  const user = useAuthStore((s) => s.user)
  return <BusinessSettings user={user} />
}
