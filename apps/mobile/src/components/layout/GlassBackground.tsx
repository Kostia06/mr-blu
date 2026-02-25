import { View } from 'react-native';

interface GlassBackgroundProps {
  children: React.ReactNode;
}

export function GlassBackground({ children }: GlassBackgroundProps) {
  return (
    <View className="flex-1" style={{ backgroundColor: '#dbe8f4' }}>
      <View
        className="absolute w-[300px] h-[300px] rounded-full"
        style={{
          backgroundColor: '#0066FF',
          opacity: 0.12,
          top: -100,
          right: -60,
          transform: [{ scale: 1.5 }],
        }}
      />
      <View
        className="absolute w-[250px] h-[250px] rounded-full"
        style={{
          backgroundColor: '#3B82F6',
          opacity: 0.10,
          bottom: -60,
          left: -80,
          transform: [{ scale: 1.4 }],
        }}
      />
      <View
        className="absolute w-[200px] h-[200px] rounded-full"
        style={{
          backgroundColor: '#0EA5E9',
          opacity: 0.08,
          top: '40%',
          left: '30%',
        }}
      />
      {children}
    </View>
  );
}
