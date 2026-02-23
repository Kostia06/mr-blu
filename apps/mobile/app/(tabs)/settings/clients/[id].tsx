import { useLocalSearchParams } from 'expo-router';
import { ClientDetailView } from '@/components/settings/ClientDetailView';

export default function ClientDetailViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <ClientDetailView id={id!} />;
}
