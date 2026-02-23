import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FileText, ChevronRight } from 'lucide-react-native';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useAppStateStore } from '@/stores/appStateStore';
import { useI18nStore } from '@/lib/i18n';
import { formatCurrency, formatSmartTime } from '@/lib/utils/format';
import { parseWithAI } from '@/lib/api/external';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Avatar } from '@/components/ui/Avatar';
import { RecordButton } from './RecordButton';
import { PendingDraftCard } from './PendingDraftCard';
import { GlassBackground } from '@/components/layout/GlassBackground';
import { formatDuration } from '@/lib/utils/format';

export function DashboardHome() {
  const insets = useSafeAreaInsets();
  const { t, locale } = useI18nStore();
  const { data, isLoading, refetch } = useDashboardData();
  const recording = useVoiceRecording();
  const setProcessingTransition = useAppStateStore((s) => s.setProcessingTransition);

  const isRecordingActive = recording.state === 'recording' || recording.state === 'paused';

  async function handleRecordPress() {
    if (recording.state === 'idle') {
      await recording.startRecording();
    } else if (recording.state === 'recording') {
      await recording.pauseRecording();
    } else if (recording.state === 'paused') {
      await recording.resumeRecording();
    }
  }

  async function handleStopAndProcess() {
    const transcript = await recording.stopRecording();
    if (!transcript.trim()) return;

    setProcessingTransition(true);
    try {
      const parsed = await parseWithAI(transcript);
      router.push({
        pathname: '/review',
        params: { data: JSON.stringify(parsed), transcript },
      });
    } catch (error) {
      console.error('Parse error:', error);
    } finally {
      setProcessingTransition(false);
    }
  }

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'success' as const;
      case 'sent':
      case 'pending': return 'warning' as const;
      case 'overdue': return 'error' as const;
      default: return 'default' as const;
    }
  };

  return (
    <GlassBackground>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => refetch()} />
        }
      >
        <View className="px-5">
          {/* Greeting */}
          <Text className="text-2xl font-bold text-gray-900 mb-1">
            {data?.firstName
              ? `${t('dashboard.welcome').replace('!', `, ${data.firstName}!`)}`
              : t('dashboard.welcome')}
          </Text>
          <Text className="text-gray-500 mb-6">{t('dashboard.subtitle')}</Text>

          {/* Recording Area */}
          <View className="items-center py-8 mb-6">
            <RecordButton
              state={recording.state}
              audioLevel={recording.audioLevel}
              onPress={handleRecordPress}
              onLongPress={isRecordingActive ? handleStopAndProcess : undefined}
            />

            {isRecordingActive && (
              <View className="items-center mt-4">
                <Text className="text-lg font-mono text-gray-900">
                  {formatDuration(recording.duration)}
                </Text>
                {recording.transcript && (
                  <Text className="text-sm text-gray-600 mt-2 text-center px-8" numberOfLines={3}>
                    {recording.transcript}
                    {recording.interimTranscript ? ` ${recording.interimTranscript}` : ''}
                  </Text>
                )}
                <Pressable
                  onPress={handleStopAndProcess}
                  className="mt-4 bg-gray-900 px-6 py-2.5 rounded-chip"
                >
                  <Text className="text-white font-semibold">
                    {t('dashboard.stopAndProcess')}
                  </Text>
                </Pressable>
              </View>
            )}

            {!isRecordingActive && recording.state === 'idle' && (
              <Text className="text-sm text-gray-400 mt-3">
                {t('dashboard.tapToCreate')}
              </Text>
            )}

            {recording.state === 'processing' && (
              <View className="items-center mt-4">
                <Spinner size="small" />
                <Text className="text-sm text-gray-500 mt-2">Processing...</Text>
              </View>
            )}
          </View>

          {/* Pending Review */}
          {data?.pendingReview && (
            <View className="mb-6">
              <PendingDraftCard review={data.pendingReview} />
            </View>
          )}

          {/* Stats */}
          {data?.stats && (
            <View className="flex-row gap-3 mb-6">
              <Card className="flex-1">
                <Text className="text-xs text-gray-500">{t('dashboard.invoices')}</Text>
                <Text className="text-lg font-bold text-gray-900">
                  {formatCurrency(data.stats.totalInvoiced)}
                </Text>
              </Card>
              <Card className="flex-1">
                <Text className="text-xs text-gray-500">Pending</Text>
                <Text className="text-lg font-bold text-data-amber">
                  {data.stats.pendingCount}
                </Text>
              </Card>
            </View>
          )}

          {/* Recent Documents */}
          {data?.recentDocuments && data.recentDocuments.length > 0 && (
            <View>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-semibold text-gray-900">Recent</Text>
                <Pressable onPress={() => router.push('/(tabs)/documents')}>
                  <Text className="text-sm text-blu-primary font-medium">
                    {t('dashboard.viewAll')}
                  </Text>
                </Pressable>
              </View>

              {data.recentDocuments.map((doc) => (
                <Card
                  key={doc.id}
                  onPress={() => router.push(`/(tabs)/documents/${doc.id}`)}
                  className="mb-2"
                >
                  <View className="flex-row items-center">
                    <Avatar name={doc.client} size="sm" />
                    <View className="flex-1 ml-3">
                      <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
                        {doc.client}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {doc.type} · {formatSmartTime(doc.date, locale)}
                      </Text>
                    </View>
                    {doc.amount > 0 && (
                      <Text className="text-sm font-semibold text-gray-900">
                        {formatCurrency(doc.amount)}
                      </Text>
                    )}
                    <Badge variant={statusBadgeVariant(doc.status)}>
                      {doc.status}
                    </Badge>
                  </View>
                </Card>
              ))}
            </View>
          )}

          {isLoading && !data && <Spinner fullScreen />}
        </View>
      </ScrollView>
    </GlassBackground>
  );
}
