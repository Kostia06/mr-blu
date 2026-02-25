import { View, Pressable, Platform, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
  style?: ViewStyle;
  padding?: number;
}

const GLASS_BORDER = {
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.6)',
} as const;

const GLASS_BG = {
  backgroundColor: 'rgba(255,255,255,0.55)',
} as const;

function GlassInner({ children, padding = 16 }: { children: React.ReactNode; padding?: number }) {
  return (
    <View style={{ padding, ...GLASS_BG }}>
      {children}
    </View>
  );
}

export function GlassCard({ children, onPress, className = '', style, padding = 16 }: GlassCardProps) {
  const isAndroid = Platform.OS === 'android';

  const content = isAndroid ? (
    <View
      className={`rounded-card overflow-hidden ${className}`}
      style={[
        {
          backgroundColor: 'rgba(255,255,255,0.75)',
          ...GLASS_BORDER,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  ) : (
    <BlurView
      intensity={40}
      tint="light"
      className={`overflow-hidden rounded-card ${className}`}
      style={[GLASS_BORDER, style]}
    >
      <GlassInner padding={padding}>{children}</GlassInner>
    </BlurView>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={{ opacity: 1 }} className="active:opacity-90">
        {content}
      </Pressable>
    );
  }

  return content;
}
