import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { CircleCheck, Eye, Mic } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';

interface DoneStateProps {
  documentId: string | null;
  documentType: string;
  documentNumber: string;
}

export function DoneState({ documentId, documentType, documentNumber }: DoneStateProps) {
  const heading = documentType === 'estimate' ? 'Estimate Created' : 'Invoice Created';
  const description = documentNumber
    ? `${documentNumber} has been saved successfully.`
    : 'Your document has been saved successfully.';

  const handleViewDocument = () => {
    if (documentId) {
      router.replace(`/(tabs)/documents/${documentId}` as never);
    }
  };

  const handleNewRecording = () => {
    router.replace('/(tabs)' as never);
  };

  return (
    <View className="flex-1 items-center justify-center px-6">
      <View className="w-16 h-16 rounded-full bg-emerald-100 items-center justify-center mb-6">
        <CircleCheck size={32} color="#059669" />
      </View>

      <Text className="text-2xl font-bold text-gray-900 text-center mb-2">{heading}</Text>
      <Text className="text-base text-gray-500 text-center mb-8">{description}</Text>

      <View className="w-full gap-3">
        {documentId && (
          <Button
            onPress={handleViewDocument}
            variant="primary"
            fullWidth
            icon={<Eye size={18} color="#fff" />}
          >
            View Document
          </Button>
        )}
        <Button
          onPress={handleNewRecording}
          variant="outline"
          fullWidth
          icon={<Mic size={18} color="#374151" />}
        >
          New Recording
        </Button>
      </View>
    </View>
  );
}
