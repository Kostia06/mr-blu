import { View, Pressable, type ViewStyle } from 'react-native';
import { GlassCard } from './GlassCard';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
  style?: ViewStyle;
  variant?: 'solid' | 'glass';
}

export function Card({ children, onPress, className = '', style, variant = 'solid' }: CardProps) {
  if (variant === 'glass') {
    return (
      <GlassCard onPress={onPress} className={className} style={style}>
        {children}
      </GlassCard>
    );
  }

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
