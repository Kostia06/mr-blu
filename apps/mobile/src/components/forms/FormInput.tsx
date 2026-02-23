import { View, Text, TextInput, type TextInputProps } from 'react-native';

interface FormInputProps extends Omit<TextInputProps, 'className'> {
  label: string;
  error?: string;
  hint?: string;
}

export function FormInput({ label, error, hint, ...props }: FormInputProps) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1.5">{label}</Text>
      <TextInput
        className={`bg-white border rounded-input px-4 py-3 text-base text-gray-900 ${
          error ? 'border-red-400' : 'border-gray-200'
        }`}
        placeholderTextColor="#94A3B8"
        {...props}
      />
      {error && <Text className="text-xs text-red-500 mt-1">{error}</Text>}
      {hint && !error && <Text className="text-xs text-gray-400 mt-1">{hint}</Text>}
    </View>
  );
}
