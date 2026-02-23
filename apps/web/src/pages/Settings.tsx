import { useAuthStore } from '@/stores/authStore'
import { SettingsHub } from '@/components/settings/SettingsHub'

export function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  return <SettingsHub user={user} />
}
