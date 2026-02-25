import { View, Text, Pressable, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
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

  const Wrapper = Platform.OS === 'ios' ? BlurView : View;
  const wrapperProps = Platform.OS === 'ios'
    ? { intensity: 60, tint: 'light' as const }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="px-4 pt-3 pb-2 border-t border-white/30"
      style={[
        { paddingBottom: Math.max(insets.bottom, 8) },
        Platform.OS === 'android' ? { backgroundColor: 'rgba(255,255,255,0.85)' } : undefined,
      ]}
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
    </Wrapper>
  );
}
