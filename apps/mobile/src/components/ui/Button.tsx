import { Pressable, Text, ActivityIndicator, Platform, type ViewStyle } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blu-primary active:bg-blu-primary-hover',
  secondary: 'bg-gray-100 active:bg-gray-200',
  outline: 'border border-gray-300 bg-transparent active:bg-gray-50',
  ghost: 'bg-transparent active:bg-gray-100',
  danger: 'bg-data-red active:bg-red-600',
};

const variantTextClasses: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-gray-900',
  outline: 'text-gray-700',
  ghost: 'text-gray-700',
  danger: 'text-white',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 rounded-lg',
  md: 'px-4 py-3 rounded-button',
  lg: 'px-6 py-4 rounded-button',
};

const sizeTextClasses: Record<ButtonSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

const SHADOW_STYLES: Partial<Record<ButtonVariant, ViewStyle>> = {
  primary: Platform.select({
    ios: {
      shadowColor: '#0066FF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    android: { elevation: 6 },
  }),
  danger: Platform.select({
    ios: {
      shadowColor: '#EF4444',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    android: { elevation: 6 },
  }),
};

export function Button({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  style,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`flex-row items-center justify-center gap-2 ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-50' : ''}`}
      style={[!disabled && SHADOW_STYLES[variant], style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? '#fff' : '#0066FF'}
        />
      ) : (
        <>
          {icon}
          <Text className={`font-semibold ${variantTextClasses[variant]} ${sizeTextClasses[size]}`}>
            {children}
          </Text>
        </>
      )}
    </Pressable>
  );
}
