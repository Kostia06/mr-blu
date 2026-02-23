import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export function ScreenHeader({ title, showBack = false, rightAction }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-row items-center justify-between px-4 pb-3 bg-blu-bg"
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className="flex-row items-center flex-1">
        {showBack && (
          <Pressable
            onPress={() => router.back()}
            className="mr-2 p-1"
            hitSlop={8}
          >
            <ChevronLeft size={24} color="#0F172A" />
          </Pressable>
        )}
        <Text className="text-xl font-bold text-gray-900" numberOfLines={1}>
          {title}
        </Text>
      </View>
      {rightAction && <View className="ml-2">{rightAction}</View>}
    </View>
  );
}
