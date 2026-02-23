import { View } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';

export function DocumentListSkeleton() {
  return (
    <View className="px-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <View key={i} className="bg-white rounded-card p-4 mb-3">
          <View className="flex-row items-center">
            <Skeleton width={40} height={40} borderRadius={20} />
            <View className="flex-1 ml-3">
              <Skeleton width="60%" height={14} />
              <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
            </View>
            <Skeleton width={60} height={14} />
          </View>
        </View>
      ))}
    </View>
  );
}
