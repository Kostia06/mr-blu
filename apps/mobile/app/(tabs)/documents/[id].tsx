import { useLocalSearchParams } from 'expo-router';
import { DocumentDetail } from '@/components/documents/DocumentDetail';

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DocumentDetail documentId={id!} />;
}
