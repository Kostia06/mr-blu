import { useAuthStore } from '@/stores/authStore'
import { NotificationsSettings } from '@/components/settings/NotificationsSettings'

export function NotificationsPage() {
  const user = useAuthStore((s) => s.user)
  return <NotificationsSettings user={user} />
}
