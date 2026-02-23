import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Rocket, Lock } from 'lucide-react-native';

interface ReviewExecuteButtonProps {
  onPress: () => void;
  isExecuting: boolean;
  isLocked: boolean;
  label?: string;
  total?: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function ReviewExecuteButton({
  onPress,
  isExecuting,
  isLocked,
  label = 'Create & Send',
  total,
}: ReviewExecuteButtonProps) {
  const insets = useSafeAreaInsets();
  const isDisabled = isExecuting || isLocked;

  return (
    <View
      className="px-4 pt-3 pb-2 bg-white border-t border-gray-100"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        className={`flex-row items-center justify-center py-4 rounded-button ${
          isDisabled ? 'bg-gray-300' : 'bg-blu-primary active:bg-blu-primary-hover'
        }`}
      >
        {isExecuting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : isLocked ? (
          <Lock size={20} color="#fff" />
        ) : (
          <Rocket size={20} color="#fff" />
        )}
        <Text className="text-white font-semibold text-base ml-2">{label}</Text>
        {total !== undefined && total > 0 && !isExecuting && (
          <View className="bg-white/20 px-2.5 py-0.5 rounded-full ml-3">
            <Text className="text-white text-sm font-medium">{formatCurrency(total)}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}
