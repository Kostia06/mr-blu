import { useLocalSearchParams } from 'expo-router';
import { ServiceDetailView } from '@/components/settings/ServiceDetailView';

export default function ServiceDetailViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <ServiceDetailView id={id!} />;
}
