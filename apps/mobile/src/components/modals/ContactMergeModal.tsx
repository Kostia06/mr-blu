import { useState, useEffect } from 'react';
import { View, Text, Modal, Pressable, ScrollView } from 'react-native';
import { Users, ArrowRight, Check, X } from 'lucide-react-native';
import { useI18nStore } from '@/lib/i18n';

interface ClientData {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

interface Difference {
  field: string;
  old: string | null;
  new: string | null;
}

type MergeDecision = 'keep' | 'use_new' | 'update';

interface ContactMergeModalProps {
  visible: boolean;
  onClose: () => void;
  existingData: ClientData;
  newData: ClientData;
  differences: Difference[];
  onDecision: (decision: MergeDecision) => void;
}

const FIELD_LABELS: Record<string, string> = {
  email: 'Email',
  phone: 'Phone',
  address: 'Address',
};

function formatFieldLabel(field: string): string {
  return FIELD_LABELS[field] || field;
}

interface OptionConfig {
  decision: MergeDecision;
  iconBg: string;
  iconColor: string;
  titleKey: string;
  description: string;
  isHighlighted: boolean;
  icon: React.ReactNode;
}

export function ContactMergeModal({
  visible,
  onClose,
  existingData,
  newData,
  differences,
  onDecision,
}: ContactMergeModalProps) {
  const { t } = useI18nStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedOption, setSelectedOption] = useState<MergeDecision | null>(null);

  useEffect(() => {
    if (visible) {
      setIsProcessing(false);
      setSelectedOption(null);
    }
  }, [visible]);

  function handleClose() {
    if (isProcessing) return;
    onClose();
  }

  function handleDecision(decision: MergeDecision) {
    if (isProcessing) return;
    setIsProcessing(true);
    setSelectedOption(decision);
    onDecision(decision);
  }

  const options: OptionConfig[] = [
    {
      decision: 'keep',
      iconBg: 'bg-gray-100',
      iconColor: '#475569',
      titleKey: 'merge.keepExisting',
      description: 'Use existing client data, ignore new',
      isHighlighted: false,
      icon: <Check size={18} color="#475569" />,
    },
    {
      decision: 'use_new',
      iconBg: 'bg-amber-50',
      iconColor: '#F59E0B',
      titleKey: 'merge.useNew',
      description: 'Use new data for this document only',
      isHighlighted: false,
      icon: <ArrowRight size={18} color="#F59E0B" />,
    },
    {
      decision: 'update',
      iconBg: 'bg-blue-50',
      iconColor: '#0066FF',
      titleKey: 'merge.updateBoth',
      description: 'Update client record with new data',
      isHighlighted: true,
      icon: <Users size={18} color="#0066FF" />,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Pressable
        className="flex-1 bg-black/50 justify-end"
        onPress={handleClose}
      >
        {/* Modal content */}
        <Pressable className="w-full" onPress={() => {}}>
          <View className="bg-white rounded-t-3xl px-6 pt-3 pb-10 max-h-[85%]">
            {/* Drag handle */}
            <View className="w-9 h-1.5 bg-gray-300 rounded-full self-center mb-5" />

            {/* Close button */}
            <Pressable
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-gray-100 items-center justify-center z-10"
              onPress={handleClose}
              hitSlop={8}
            >
              <X size={18} color="#64748B" />
            </Pressable>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Icon + title */}
              <View className="items-center mb-5">
                <View className="w-[72px] h-[72px] rounded-full bg-amber-50 items-center justify-center mb-4">
                  <Users size={28} color="#F59E0B" />
                </View>
                <Text className="text-[22px] font-bold text-gray-900 text-center mb-2">
                  {t('merge.title')}
                </Text>
                <Text className="text-sm text-gray-500 text-center leading-5">
                  {t('merge.description').replace('{name}', existingData.name)}
                </Text>
              </View>

              {/* Differences */}
              <View className="bg-gray-50 rounded-xl p-3 mb-5">
                {differences.map((diff, index) => (
                  <View
                    key={diff.field}
                    className={`bg-white rounded-lg p-3 ${
                      index < differences.length - 1 ? 'mb-2' : ''
                    }`}
                  >
                    <Text className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                      {formatFieldLabel(diff.field)}
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <Text className="flex-1 text-[13px] text-gray-500 line-through" numberOfLines={2}>
                        {diff.old || '\u2014'}
                      </Text>
                      <ArrowRight size={14} color="#CBD5E1" />
                      <Text className="flex-1 text-[13px] font-semibold text-gray-900 text-right" numberOfLines={2}>
                        {diff.new || '\u2014'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Options */}
              <View className="gap-2.5 mb-4">
                {options.map((option) => {
                  const isSelected = selectedOption === option.decision;
                  const borderClass = option.isHighlighted
                    ? 'border-2 border-blue-200'
                    : 'border-2 border-gray-100';

                  return (
                    <Pressable
                      key={option.decision}
                      className={`flex-row items-center gap-3 p-3.5 rounded-xl ${borderClass} ${
                        isSelected ? 'opacity-50' : ''
                      }`}
                      onPress={() => handleDecision(option.decision)}
                      disabled={isProcessing}
                    >
                      <View
                        className={`w-10 h-10 rounded-[10px] items-center justify-center ${option.iconBg}`}
                      >
                        {option.icon}
                      </View>
                      <View className="flex-1">
                        <Text className="text-[15px] font-semibold text-gray-900">
                          {t(option.titleKey)}
                        </Text>
                        <Text className="text-xs text-gray-500 mt-0.5">
                          {option.description}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Cancel */}
              <Pressable
                className="items-center py-3"
                onPress={handleClose}
                disabled={isProcessing}
              >
                <Text className="text-sm font-medium text-gray-500">
                  {t('common.cancel')}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
