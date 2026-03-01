import { useAuthStore } from '@/stores/authStore';
import { BetaManagement } from '@/components/settings/BetaManagement';

export function BetaManagementPage() {
	const user = useAuthStore((s) => s.user);
	return <BetaManagement user={user} />;
}
