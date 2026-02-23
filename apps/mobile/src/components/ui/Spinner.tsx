import { ActivityIndicator, View } from 'react-native';

interface SpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  fullScreen?: boolean;
}

export function Spinner({ size = 'large', color = '#0066FF', fullScreen = false }: SpinnerProps) {
  if (fullScreen) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size={size} color={color} />
      </View>
    );
  }

  return <ActivityIndicator size={size} color={color} />;
}
