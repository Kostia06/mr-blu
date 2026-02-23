import { View, Text } from 'react-native';
import { Sparkles } from 'lucide-react-native';

type SummaryVariant = 'default' | 'info-query' | 'clone-mode' | 'send-mode' | 'transform-mode';

interface SummaryCardProps {
  summary: string;
  label?: string;
  variant?: SummaryVariant;
}

const variantStyles: Record<SummaryVariant, { bg: string; iconColor: string; labelColor: string; textColor: string }> = {
  default: { bg: 'bg-blue-50', iconColor: '#2563EB', labelColor: 'text-blue-700', textColor: 'text-blue-900' },
  'info-query': { bg: 'bg-purple-50', iconColor: '#7C3AED', labelColor: 'text-purple-700', textColor: 'text-purple-900' },
  'clone-mode': { bg: 'bg-amber-50', iconColor: '#D97706', labelColor: 'text-amber-700', textColor: 'text-amber-900' },
  'send-mode': { bg: 'bg-emerald-50', iconColor: '#059669', labelColor: 'text-emerald-700', textColor: 'text-emerald-900' },
  'transform-mode': { bg: 'bg-indigo-50', iconColor: '#4F46E5', labelColor: 'text-indigo-700', textColor: 'text-indigo-900' },
};

export function SummaryCard({ summary, label = 'AI Summary', variant = 'default' }: SummaryCardProps) {
  const styles = variantStyles[variant];

  return (
    <View className={`flex-row items-start p-4 rounded-xl ${styles.bg}`}>
      <Sparkles size={18} color={styles.iconColor} />
      <View className="flex-1 ml-3">
        <Text className={`text-xs font-semibold uppercase tracking-wide ${styles.labelColor}`}>
          {label}
        </Text>
        <Text className={`text-sm mt-1 leading-5 ${styles.textColor}`}>{summary}</Text>
      </View>
    </View>
  );
}
