import { useRoute } from 'wouter';
import { ServiceDetailView } from '@/components/settings/ServiceDetailView';

export function ServiceDetailPage() {
  const [, params] = useRoute('/dashboard/settings/service-book/:id');
  const serviceId = params?.id;

  if (!serviceId) return null;

  return <ServiceDetailView serviceId={serviceId} />;
}
