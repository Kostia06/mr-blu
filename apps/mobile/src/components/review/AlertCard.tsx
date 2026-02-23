import { View, Text } from 'react-native';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react-native';

type AlertVariant = 'warning' | 'error' | 'info' | 'success';

interface AlertCardProps {
  title: string;
  message: string;
  variant?: AlertVariant;
}

const variantConfig: Record<AlertVariant, { bg: string; border: string; text: string; icon: string }> = {
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: '#B45309' },
  error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: '#B91C1C' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: '#1D4ED8' },
  success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', icon: '#047857' },
};

const icons: Record<AlertVariant, typeof AlertTriangle> = {
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
  success: CheckCircle,
};

export function AlertCard({ title, message, variant = 'warning' }: AlertCardProps) {
  const config = variantConfig[variant];
  const IconComponent = icons[variant];

  return (
    <View className={`flex-row items-start p-4 rounded-xl border ${config.bg} ${config.border}`}>
      <IconComponent size={20} color={config.icon} />
      <View className="flex-1 ml-3">
        <Text className={`text-sm font-semibold ${config.text}`}>{title}</Text>
        <Text className={`text-sm ${config.text} mt-0.5 opacity-80`}>{message}</Text>
      </View>
    </View>
  );
}
