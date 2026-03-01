import { useAuthStore } from '@/stores/authStore';
import { AccountantSharesSettings } from '@/components/settings/AccountantSharesSettings';

export function AccountantSharesPage() {
  const user = useAuthStore((s) => s.user);
  return <AccountantSharesSettings user={user} />;
}
