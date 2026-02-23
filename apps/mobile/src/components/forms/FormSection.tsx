import { View, Text } from 'react-native';

interface FormSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function FormSection({ title, subtitle, children }: FormSectionProps) {
  return (
    <View className="mb-6">
      <Text className="text-lg font-semibold text-gray-900 mb-1">{title}</Text>
      {subtitle && <Text className="text-sm text-gray-500 mb-4">{subtitle}</Text>}
      {children}
    </View>
  );
}
