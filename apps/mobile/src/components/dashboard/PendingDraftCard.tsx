import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Clock, ChevronRight } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { useI18nStore } from '@/lib/i18n';
import { formatSmartTime } from '@/lib/utils/format';

interface PendingDraftCardProps {
  review: {
    id: string;
    summary?: string;
    created_at: string;
    intent_type?: string;
  };
}

export function PendingDraftCard({ review }: PendingDraftCardProps) {
  const { t, locale } = useI18nStore();

  return (
    <Card
      onPress={() => router.push(`/review?session=${review.id}`)}
      className="border border-amber-200 bg-amber-50"
    >
      <View className="flex-row items-center mb-2">
        <Clock size={16} color="#F59E0B" />
        <Text className="text-sm font-medium text-amber-700 ml-2">
          {t('dashboard.pendingReview')}
        </Text>
        <View className="flex-1" />
        <Text className="text-xs text-amber-500">
          {formatSmartTime(review.created_at, locale)}
        </Text>
      </View>
      <Text className="text-sm text-gray-700" numberOfLines={2}>
        {review.summary || t('dashboard.tapToContinue')}
      </Text>
      <View className="flex-row items-center justify-end mt-2">
        <Text className="text-sm font-medium text-blu-primary mr-1">
          {t('common.continue')}
        </Text>
        <ChevronRight size={16} color="#0066FF" />
      </View>
    </Card>
  );
}
