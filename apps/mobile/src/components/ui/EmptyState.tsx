import { View, Text } from 'react-native';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-12">
      {icon && <View className="mb-4">{icon}</View>}
      <Text className="text-lg font-semibold text-gray-900 text-center mb-2">{title}</Text>
      {description && (
        <Text className="text-sm text-gray-500 text-center mb-6">{description}</Text>
      )}
      {actionLabel && onAction && (
        <Button onPress={onAction} variant="primary" size="md">
          {actionLabel}
        </Button>
      )}
    </View>
  );
}
