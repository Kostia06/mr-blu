import { View } from 'react-native';

interface GlassBackgroundProps {
  children: React.ReactNode;
}

export function GlassBackground({ children }: GlassBackgroundProps) {
  return (
    <View className="flex-1 bg-blu-bg">
      <View className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-20"
        style={{ backgroundColor: '#0066FF', transform: [{ translateX: 80 }, { translateY: -80 }] }}
      />
      <View className="absolute top-1/3 left-0 w-60 h-60 rounded-full opacity-15"
        style={{ backgroundColor: '#3B82F6', transform: [{ translateX: -100 }] }}
      />
      <View className="absolute bottom-20 right-0 w-52 h-52 rounded-full opacity-10"
        style={{ backgroundColor: '#0EA5E9', transform: [{ translateX: 60 }] }}
      />
      {children}
    </View>
  );
}
