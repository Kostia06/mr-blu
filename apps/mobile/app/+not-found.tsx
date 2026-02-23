import { View, Text } from 'react-native';
import { Link } from 'expo-router';

export default function NotFoundScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-blu-bg">
      <Text className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</Text>
      <Link href="/(tabs)" className="text-blu-primary mt-4">
        <Text className="text-blu-primary text-lg">Go Home</Text>
      </Link>
    </View>
  );
}
