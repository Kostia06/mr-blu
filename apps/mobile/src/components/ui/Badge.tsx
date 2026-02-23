import { View, Text } from 'react-native';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  children: string;
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: 'bg-gray-100', text: 'text-gray-700' },
  success: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700' },
  error: { bg: 'bg-red-50', text: 'text-red-700' },
  info: { bg: 'bg-blue-50', text: 'text-blue-700' },
};

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const { bg, text } = variantClasses[variant];

  return (
    <View className={`px-2.5 py-1 rounded-chip ${bg}`}>
      <Text className={`text-xs font-medium ${text}`}>{children}</Text>
    </View>
  );
}
