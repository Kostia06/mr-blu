import { Stack } from 'expo-router';
import { DocumentList } from '@/components/documents/DocumentList';

export default function DocumentsScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DocumentList />
    </>
  );
}
