import { View, Text } from 'react-native';
import { GlassCard } from '@/components/ui/GlassCard';

type FormSectionVariant = 'default' | 'card';

interface FormSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: FormSectionVariant;
}

export function FormSection({ title, subtitle, children, variant = 'default' }: FormSectionProps) {
  const header = (
    <>
      <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
        {title}
      </Text>
      {subtitle && <Text className="text-xs text-gray-400 mb-3">{subtitle}</Text>}
      {!subtitle && <View className="mb-3" />}
    </>
  );

  if (variant === 'card') {
    return (
      <View className="mb-6">
        <GlassCard>
          {header}
          {children}
        </GlassCard>
      </View>
    );
  }

  return (
    <View className="mb-6">
      {header}
      {children}
    </View>
  );
}
