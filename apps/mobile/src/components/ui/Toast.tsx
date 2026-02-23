import { useEffect } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react-native';
import { useToastStore } from '@/stores/toastStore';

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const BG_COLORS = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
};

export function ToastContainer() {
  const { toasts, dismiss } = useToastStore();
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View
      className="absolute left-4 right-4 z-50"
      style={{ top: insets.top + 8 }}
      pointerEvents="box-none"
    >
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type];
        return (
          <View
            key={toast.id}
            className={`${BG_COLORS[toast.type]} rounded-xl px-4 py-3 flex-row items-center mb-2 shadow-lg`}
          >
            <Icon size={20} color="#fff" />
            <Text className="text-white text-sm font-medium flex-1 ml-3">{toast.message}</Text>
            <Pressable onPress={() => dismiss(toast.id)} hitSlop={8}>
              <X size={18} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
