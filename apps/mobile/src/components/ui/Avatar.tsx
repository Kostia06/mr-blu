import { View, Text } from 'react-native';
import { Image } from 'expo-image';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface AvatarProps {
  name: string;
  src?: string;
  size?: AvatarSize;
}

const SIZE_PX: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 56,
  '2xl': 72,
};

const TEXT_SIZES: Record<AvatarSize, string> = {
  xs: 'text-[10px]',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
  '2xl': 'text-xl',
};

const GRADIENT_COLORS = [
  '#3B82F6', '#10B981', '#8B5CF6',
  '#F59E0B', '#F43F5E', '#06B6D4',
];

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENT_COLORS[Math.abs(hash) % GRADIENT_COLORS.length];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function Avatar({ name, src, size = 'md' }: AvatarProps) {
  const px = SIZE_PX[size];

  if (src) {
    return (
      <Image
        source={{ uri: src }}
        style={{ width: px, height: px, borderRadius: px / 2 }}
        contentFit="cover"
        transition={200}
      />
    );
  }

  return (
    <View
      className="rounded-full items-center justify-center"
      style={{ width: px, height: px, backgroundColor: getColor(name) }}
    >
      <Text className={`text-white font-semibold ${TEXT_SIZES[size]}`}>
        {getInitials(name)}
      </Text>
    </View>
  );
}
