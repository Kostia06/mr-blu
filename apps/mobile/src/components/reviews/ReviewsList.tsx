import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  Check,
  XCircle,
  RefreshCw,
  FileText,
  Receipt,
  Calculator,
  Search,
  Trash2,
  Play,
  Sparkles,
  Mic,
  MessageCircle,
} from 'lucide-react-native';
import { useI18nStore } from '@/lib/i18n';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import { fetchReviewSessions, deleteReviewSession } from '@/lib/api/reviews';
import type { ReviewSession } from '@/lib/api/reviews';
import { GlassBackground } from '@/components/layout/GlassBackground';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

type StatusFilter = 'all' | 'pending' | 'in_progress' | 'completed';

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'completed':
      return 'success' as const;
    case 'cancelled':
      return 'error' as const;
    case 'in_progress':
      return 'info' as const;
    default:
      return 'warning' as const;
  }
}

function getStatusLabel(status: string): string {
  return status.replace('_', ' ');
}

function getDocTypeIcon(type: string | null | undefined) {
  if (type === 'estimate') return Calculator;
  if (type === 'contract') return FileText;
  return Receipt;
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return Check;
    case 'cancelled':
      return XCircle;
    case 'in_progress':
      return RefreshCw;
    default:
      return Clock;
  }
}

function getIconColor(status: string): string {
  switch (status) {
    case 'completed':
      return '#10B981';
    case 'cancelled':
      return '#EF4444';
    case 'in_progress':
      return '#0EA5E9';
    default:
      return '#F59E0B';
  }
}

function getIconBgClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-emerald-50';
    case 'cancelled':
      return 'bg-red-50';
    case 'in_progress':
      return 'bg-sky-50';
    default:
      return 'bg-amber-50';
  }
}

function formatReviewDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getActionSummary(review: ReviewSession): string {
  if (review.intent_type === 'information_query') return 'Information query';

  const actions = review.actions || [];
  const completed = actions.filter((a) => a.status === 'completed').length;
  const total = actions.length;

  if (total === 0) return 'No actions';
  if (completed === total) return `${total} action${total > 1 ? 's' : ''} completed`;
  return `${completed}/${total} actions done`;
}

export function ReviewsList() {
  const insets = useSafeAreaInsets();
  const { t } = useI18nStore();
  const userId = useAuthStore((s) => s.user?.id);
  const toast = useToastStore();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const { data: reviews = [], isLoading, refetch } = useQuery({
    queryKey: ['reviews', userId],
    enabled: !!userId,
    queryFn: () => fetchReviewSessions(userId!),
  });

  const filteredReviews = useMemo(() => {
    if (statusFilter === 'all') return reviews;
    return reviews.filter((r) => r.status === statusFilter);
  }, [reviews, statusFilter]);

  const pendingCount = useMemo(
    () => reviews.filter((r) => r.status === 'pending' || r.status === 'in_progress').length,
    [reviews]
  );

  const completedCount = useMemo(
    () => reviews.filter((r) => r.status === 'completed').length,
    [reviews]
  );

  const handleReviewPress = useCallback((review: ReviewSession) => {
    router.push(`/review?resume=${review.id}` as never);
  }, []);

  const handleDelete = useCallback(
    (review: ReviewSession) => {
      Alert.alert(
        'Delete Review',
        'Delete this review session?',
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.delete'),
            style: 'destructive',
            onPress: async () => {
              const result = await deleteReviewSession(review.id);
              if (result.success) {
                toast.success('Review deleted');
                queryClient.invalidateQueries({ queryKey: ['reviews'] });
              } else {
                toast.error(result.error || 'Failed to delete');
              }
            },
          },
        ]
      );
    },
    [t, toast, queryClient]
  );

  const tabs: { key: StatusFilter; label: string; icon?: React.ReactNode }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending', icon: <Clock size={13} color={statusFilter === 'pending' ? '#FFF' : '#475569'} /> },
    { key: 'in_progress', label: 'In Progress', icon: <RefreshCw size={13} color={statusFilter === 'in_progress' ? '#FFF' : '#475569'} /> },
    { key: 'completed', label: 'Done', icon: <Check size={13} color={statusFilter === 'completed' ? '#FFF' : '#475569'} /> },
  ];

  const renderItem = useCallback(
    ({ item }: { item: ReviewSession }) => {
      const isQuery = item.intent_type === 'information_query';
      const docType =
        item.created_document_type ||
        (item.parsed_data as { documentType?: string })?.documentType;
      const DocIcon = isQuery ? Search : getDocTypeIcon(docType);
      const iconColor = getIconColor(item.status);
      const iconBg = getIconBgClass(item.status);
      const isResumable = item.status === 'pending' || item.status === 'in_progress';

      return (
        <Card
          onPress={() => handleReviewPress(item)}
          className="mx-5 mb-2"
        >
          <View className="flex-row">
            {/* Icon */}
            <View className={`w-11 h-11 rounded-xl items-center justify-center mr-3 ${iconBg}`}>
              <DocIcon size={20} color={iconColor} />
            </View>

            {/* Content */}
            <View className="flex-1 mr-2">
              {/* Title + date */}
              <View className="flex-row justify-between items-start mb-1.5">
                <Text className="text-[15px] font-semibold text-gray-900 flex-1 mr-2" numberOfLines={2}>
                  {item.summary || 'Processing...'}
                </Text>
                <Text className="text-xs text-gray-400">
                  {formatReviewDate(item.created_at)}
                </Text>
              </View>

              {/* Meta row */}
              <View className="flex-row items-center gap-2 mb-1.5">
                <Badge variant={getStatusBadgeVariant(item.status)}>
                  {getStatusLabel(item.status)}
                </Badge>
                <Text className="text-xs text-gray-500">
                  {getActionSummary(item)}
                </Text>
              </View>

              {/* Transcript preview */}
              {item.original_transcript && (
                <Text className="text-[13px] italic text-gray-500 leading-5" numberOfLines={2}>
                  "{item.original_transcript.slice(0, 100)}
                  {item.original_transcript.length > 100 ? '...' : ''}"
                </Text>
              )}
            </View>

            {/* Actions column */}
            <View className="items-end justify-between">
              {isResumable && (
                <View className="flex-row items-center gap-1 bg-blu-primary rounded-full px-2.5 py-1.5">
                  <Play size={10} color="#FFF" />
                  <Text className="text-[11px] font-semibold text-white">Resume</Text>
                </View>
              )}
              <Pressable
                className="w-8 h-8 rounded-[10px] bg-gray-100 items-center justify-center mt-1"
                onPress={() => handleDelete(item)}
                hitSlop={6}
              >
                <Trash2 size={15} color="#94A3B8" />
              </Pressable>
            </View>
          </View>
        </Card>
      );
    },
    [handleReviewPress, handleDelete]
  );

  const renderHeader = useCallback(
    () => (
      <View className="px-5 mb-4">
        {/* Stats row */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 flex-row items-center gap-3 p-3 rounded-xl">
            <View className="w-10 h-10 rounded-xl bg-amber-50 items-center justify-center">
              <Clock size={20} color="#F59E0B" />
            </View>
            <View>
              <Text className="text-xl font-bold text-gray-900 leading-tight">{pendingCount}</Text>
              <Text className="text-xs text-gray-500">Pending</Text>
            </View>
          </View>

          <View className="flex-1 flex-row items-center gap-3 p-3 rounded-xl">
            <View className="w-10 h-10 rounded-xl bg-emerald-50 items-center justify-center">
              <Check size={20} color="#10B981" />
            </View>
            <View>
              <Text className="text-xl font-bold text-gray-900 leading-tight">{completedCount}</Text>
              <Text className="text-xs text-gray-500">Completed</Text>
            </View>
          </View>

          <View className="flex-1 flex-row items-center gap-3 p-3 rounded-xl">
            <View className="w-10 h-10 rounded-xl bg-gray-100 items-center justify-center">
              <MessageCircle size={20} color="#64748B" />
            </View>
            <View>
              <Text className="text-xl font-bold text-gray-900 leading-tight">{reviews.length}</Text>
              <Text className="text-xs text-gray-500">Total</Text>
            </View>
          </View>
        </View>

        {/* Filter tabs */}
        <View className="flex-row gap-2">
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setStatusFilter(tab.key)}
              className={`flex-row items-center gap-1.5 px-4 py-2.5 rounded-full ${
                statusFilter === tab.key ? 'bg-blu-primary' : 'bg-white/50'
              }`}
            >
              {tab.icon}
              <Text
                className={`text-[13px] font-medium ${
                  statusFilter === tab.key ? 'text-white' : 'text-gray-600'
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    ),
    [pendingCount, completedCount, reviews.length, statusFilter, tabs]
  );

  const renderEmpty = useCallback(
    () => (
      <EmptyState
        icon={<Sparkles size={48} color="#0066FF" />}
        title={
          statusFilter === 'all'
            ? 'No reviews yet'
            : `No ${statusFilter.replace('_', ' ')} reviews`
        }
        description="Start a voice recording to create your first review"
        actionLabel="Start Recording"
        onAction={() => router.push('/(tabs)')}
      />
    ),
    [statusFilter]
  );

  return (
    <GlassBackground>
      <ScreenHeader title="Past Reviews" showBack />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0066FF" />
        </View>
      ) : (
        <FlatList
          data={filteredReviews}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={() => refetch()} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </GlassBackground>
  );
}
