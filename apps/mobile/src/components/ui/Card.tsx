import { View, Pressable, type ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
  style?: ViewStyle;
}

export function Card({ children, onPress, className = '', style }: CardProps) {
  const baseClasses = `bg-white rounded-card p-4 shadow-sm ${className}`;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={`${baseClasses} active:opacity-90`}
        style={style}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={baseClasses} style={style}>
      {children}
    </View>
  );
}
