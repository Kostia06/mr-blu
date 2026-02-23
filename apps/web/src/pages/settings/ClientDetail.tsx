import { useRoute } from 'wouter';
import { ClientDetailView } from '@/components/settings/ClientDetailView';

export function ClientDetailPage() {
  const [, params] = useRoute('/dashboard/settings/clients/:id');
  const clientId = params?.id;

  if (!clientId) return null;

  return <ClientDetailView clientId={clientId} />;
}
