import { useAuthStore } from '@/stores/authStore'
import { ProfileSettings } from '@/components/settings/ProfileSettings'

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  return <ProfileSettings user={user} />
}
