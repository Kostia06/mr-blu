import { View, Text, FlatList, Pressable } from 'react-native';
import { router } from 'expo-router';
import { FileText, DollarSign, BarChart3, Users } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { SummaryCard } from './SummaryCard';
import type { QueryData, QueryResult, ClientSuggestion } from '@/lib/review/review-types';

interface QueryResultsFlowProps {
  queryData: QueryData | null;
  queryResult: QueryResult | null;
  isLoading: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

const statusVariants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  paid: 'success',
  sent: 'info',
  draft: 'default',
  overdue: 'error',
  pending: 'warning',
};

export function QueryResultsFlow({
  queryData,
  queryResult,
  isLoading,
}: QueryResultsFlowProps) {
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Spinner />
        <Text className="text-sm text-gray-500 mt-3">Searching documents...</Text>
      </View>
    );
  }

  if (!queryData) return null;

  const summary = queryResult?.summary;
  const documents = queryResult?.documents || [];
  const suggestions = queryResult?.suggestions;
  const answer = queryResult?.answer;

  return (
    <View className="flex-1">
      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListHeaderComponent={
          <View className="gap-4 mb-4">
            <SummaryCard
              summary={queryData.summary || queryData.naturalLanguageQuery}
              label="Query"
              variant="info-query"
            />

            {answer && (
              <Card>
                <Text className="text-base font-semibold text-gray-900 mb-2">Answer</Text>
                <Text className="text-sm text-gray-700 leading-5">{answer}</Text>
              </Card>
            )}

            {summary && (
              <View className="flex-row gap-3">
                <StatBox
                  icon={<FileText size={16} color="#2563EB" />}
                  label="Documents"
                  value={String(summary.count)}
                />
                <StatBox
                  icon={<DollarSign size={16} color="#059669" />}
                  label="Total"
                  value={formatCurrency(summary.totalAmount)}
                />
              </View>
            )}

            {summary?.byStatus && Object.keys(summary.byStatus).length > 0 && (
              <Card>
                <Text className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  By Status
                </Text>
                {Object.entries(summary.byStatus).map(([status, count]) => (
                  <View key={status} className="flex-row items-center justify-between py-1.5">
                    <Badge variant={statusVariants[status] || 'default'}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                    <Text className="text-sm font-medium text-gray-900">{count}</Text>
                  </View>
                ))}
              </Card>
            )}

            {documents.length > 0 && (
              <Text className="text-xs font-semibold text-gray-500 uppercase">
                Documents ({documents.length})
              </Text>
            )}
          </View>
        }
        renderItem={({ item: doc }) => (
          <Pressable
            onPress={() => router.push(`/(tabs)/documents/${doc.id}` as never)}
            className="bg-white border border-gray-100 rounded-xl p-4 mb-2 active:opacity-90"
          >
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
                {doc.title}
              </Text>
              <Badge variant={statusVariants[doc.status] || 'default'}>
                {doc.status}
              </Badge>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-gray-500">{doc.client}</Text>
              <Text className="text-sm font-semibold text-gray-900">
                {formatCurrency(doc.amount)}
              </Text>
            </View>
            <Text className="text-xs text-gray-400 mt-1">
              {new Date(doc.date).toLocaleDateString()}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center py-8">
              <FileText size={32} color="#D1D5DB" />
              <Text className="text-sm text-gray-400 mt-2">No documents found</Text>
              {suggestions?.alternatives && suggestions.alternatives.length > 0 && (
                <View className="mt-4 w-full">
                  <Text className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    Did you mean?
                  </Text>
                  {suggestions.alternatives.map((alt) => (
                    <View key={alt.id} className="flex-row items-center py-2">
                      <Users size={14} color="#9CA3AF" />
                      <Text className="text-sm text-gray-700 ml-2">{alt.name}</Text>
                      <Text className="text-xs text-gray-400 ml-auto">
                        {Math.round(alt.similarity * 100)}% match
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : null
        }
        ListFooterComponent={
          <View className="mt-4">
            <Button onPress={() => router.back()} variant="outline" fullWidth>
              Done
            </Button>
          </View>
        }
      />
    </View>
  );
}

function StatBox({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-1 bg-white border border-gray-100 rounded-xl p-3 items-center">
      {icon}
      <Text className="text-xs text-gray-500 mt-1">{label}</Text>
      <Text className="text-sm font-bold text-gray-900 mt-0.5">{value}</Text>
    </View>
  );
}
