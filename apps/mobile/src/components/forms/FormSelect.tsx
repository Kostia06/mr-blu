import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react-native';

interface Option {
  label: string;
  value: string;
}

interface FormSelectProps {
  label: string;
  value: string;
  options: Option[];
  onSelect: (value: string) => void;
  placeholder?: string;
}

export function FormSelect({ label, value, options, onSelect, placeholder = 'Select...' }: FormSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1.5">{label}</Text>
      <Pressable
        onPress={() => setIsOpen(true)}
        className="bg-white border border-gray-200 rounded-input px-4 py-3 flex-row items-center justify-between"
      >
        <Text className={selectedOption ? 'text-gray-900 text-base' : 'text-gray-400 text-base'}>
          {selectedOption?.label || placeholder}
        </Text>
        <ChevronDown size={20} color="#94A3B8" />
      </Pressable>

      <Modal visible={isOpen} transparent animationType="slide">
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setIsOpen(false)}
        >
          <View className="bg-white rounded-t-3xl max-h-[60%]">
            <View className="px-6 py-4 border-b border-gray-100">
              <Text className="text-lg font-semibold text-gray-900">{label}</Text>
            </View>
            <ScrollView className="px-2">
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onSelect(option.value);
                    setIsOpen(false);
                  }}
                  className="flex-row items-center justify-between px-4 py-4 border-b border-gray-50"
                >
                  <Text className="text-base text-gray-900">{option.label}</Text>
                  {option.value === value && <Check size={20} color="#0066FF" />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
