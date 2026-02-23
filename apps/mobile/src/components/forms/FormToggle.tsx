import { View, Text, Switch, Platform } from 'react-native';

interface FormToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}

export function FormToggle({ label, description, value, onToggle }: FormToggleProps) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <View className="flex-1 mr-4">
        <Text className="text-base text-gray-900">{label}</Text>
        {description && <Text className="text-sm text-gray-500 mt-0.5">{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#CBD5E1', true: '#0066FF' }}
        thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
        ios_backgroundColor="#CBD5E1"
      />
    </View>
  );
}
