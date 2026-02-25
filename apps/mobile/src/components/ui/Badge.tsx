import { View, Text } from 'react-native';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
type BadgeStatus = 'draft' | 'sent' | 'pending' | 'paid' | 'overdue' | 'signed';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: string;
  variant?: BadgeVariant;
  status?: BadgeStatus;
  size?: BadgeSize;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: 'bg-gray-100', text: 'text-gray-700' },
  success: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700' },
  error: { bg: 'bg-red-50', text: 'text-red-700' },
  info: { bg: 'bg-blue-50', text: 'text-blue-700' },
};

const STATUS_COLORS: Record<BadgeStatus, { bg: string; text: string; dot: string }> = {
  draft: { bg: '#F2F2F7', text: '#8E8E93', dot: '#8E8E93' },
  sent: { bg: '#E6F0FF', text: '#0066FF', dot: '#0066FF' },
  pending: { bg: 'rgba(245,158,11,0.1)', text: '#F59E0B', dot: '#F59E0B' },
  paid: { bg: '#E8FAE8', text: '#34C759', dot: '#34C759' },
  overdue: { bg: '#FFF0E6', text: '#FF9500', dot: '#FF9500' },
  signed: { bg: 'rgba(99,102,241,0.1)', text: '#6366F1', dot: '#6366F1' },
};

const SIZE_CLASSES: Record<BadgeSize, { container: string; text: string }> = {
  sm: { container: 'px-2 py-0.5', text: 'text-[10px]' },
  md: { container: 'px-2.5 py-1', text: 'text-xs' },
};

export function Badge({ children, variant = 'default', status, size = 'md', dot }: BadgeProps) {
  const sizeStyle = SIZE_CLASSES[size];

  if (status) {
    const colors = STATUS_COLORS[status];
    return (
      <View
        className={`rounded-chip flex-row items-center gap-1.5 ${sizeStyle.container}`}
        style={{ backgroundColor: colors.bg }}
      >
        {dot && (
          <View
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: colors.dot }}
          />
        )}
        <Text className={`font-semibold capitalize ${sizeStyle.text}`} style={{ color: colors.text }}>
          {children}
        </Text>
      </View>
    );
  }

  const { bg, text } = variantClasses[variant];

  return (
    <View className={`rounded-chip ${bg} ${sizeStyle.container}`}>
      <Text className={`font-medium ${text} ${sizeStyle.text}`}>{children}</Text>
    </View>
  );
}
