import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { IntentType } from '@/lib/review/review-types';

interface ReviewHeaderProps {
  intentType: IntentType | null;
}

const intentTitles: Record<IntentType, string> = {
  document_action: 'Review',
  information_query: 'Query Results',
  document_clone: 'Clone Document',
  document_merge: 'Merge Documents',
  document_send: 'Send Document',
  document_transform: 'Transform',
};

export function ReviewHeader({ intentType }: ReviewHeaderProps) {
  const insets = useSafeAreaInsets();
  const title = intentType ? intentTitles[intentType] : 'Review';

  return (
    <View
      className="flex-row items-center px-4 pb-3 bg-blu-bg"
      style={{ paddingTop: insets.top + 8 }}
    >
      <Pressable onPress={() => router.back()} className="p-1 mr-2" hitSlop={8}>
        <ChevronLeft size={24} color="#0F172A" />
      </Pressable>
      <Text className="text-xl font-bold text-gray-900 flex-1" numberOfLines={1}>
        {title}
      </Text>
      <View className="w-8" />
    </View>
  );
}
