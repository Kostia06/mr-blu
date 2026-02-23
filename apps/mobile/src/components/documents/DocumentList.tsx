import { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TextInput, Pressable, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Search, FileText } from 'lucide-react-native';
import { useDocumentsData } from '@/hooks/useDocumentsData';
import { useI18nStore } from '@/lib/i18n';
import { formatCurrency, formatSmartTime, groupDocumentsByMonth } from '@/lib/utils/format';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { DocumentListSkeleton } from './DocumentListSkeleton';
import { GlassBackground } from '@/components/layout/GlassBackground';

type FilterTab = 'all' | 'invoice' | 'estimate' | 'contract';

export function DocumentList() {
  const insets = useSafeAreaInsets();
  const { t, locale } = useI18nStore();
  const { data, isLoading, refetch } = useDocumentsData();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const filteredDocs = useMemo(() => {
    if (!data?.documents) return [];
    let docs = data.documents;

    if (activeTab !== 'all') {
      docs = docs.filter((d) => d.documentType === activeTab);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      docs = docs.filter(
        (d) =>
          d.client.toLowerCase().includes(q) ||
          d.title.toLowerCase().includes(q)
      );
    }

    return docs;
  }, [data?.documents, activeTab, search]);

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'success' as const;
      case 'sent':
      case 'pending': return 'warning' as const;
      case 'overdue': return 'error' as const;
      default: return 'default' as const;
    }
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: t('documents.all') },
    { key: 'invoice', label: t('documents.invoices') },
    { key: 'estimate', label: 'Estimates' },
    { key: 'contract', label: t('documents.contracts') },
  ];

  const renderItem = useCallback(({ item }: { item: typeof filteredDocs[0] }) => (
    <Card
      onPress={() => router.push(`/(tabs)/documents/${item.id}`)}
      className="mx-5 mb-2"
    >
      <View className="flex-row items-center">
        <Avatar name={item.client} size="sm" />
        <View className="flex-1 ml-3">
          <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
            {item.client}
          </Text>
          <Text className="text-xs text-gray-500">
            {item.title} · {formatSmartTime(item.date, locale)}
          </Text>
        </View>
        <View className="items-end">
          {item.amount > 0 && (
            <Text className="text-sm font-semibold text-gray-900 mb-1">
              {formatCurrency(item.amount)}
            </Text>
          )}
          <Badge variant={statusBadgeVariant(item.status)}>
            {item.status}
          </Badge>
        </View>
      </View>
    </Card>
  ), [locale]);

  return (
    <GlassBackground>
      <View style={{ paddingTop: insets.top + 8 }} className="flex-1">
        <View className="px-5 mb-3">
          <Text className="text-2xl font-bold text-gray-900 mb-4">
            {t('documents.title')}
          </Text>

          {/* Search */}
          <View className="flex-row items-center bg-white rounded-input px-4 py-2.5 mb-3 border border-gray-200">
            <Search size={18} color="#94A3B8" />
            <TextInput
              className="flex-1 ml-2 text-base text-gray-900"
              placeholder={t('documents.search')}
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Filter Tabs */}
          <View className="flex-row gap-2">
            {tabs.map((tab) => (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-chip ${
                  activeTab === tab.key ? 'bg-blu-primary' : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    activeTab === tab.key ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {isLoading ? (
          <DocumentListSkeleton />
        ) : filteredDocs.length === 0 ? (
          <EmptyState
            icon={<FileText size={48} color="#CBD5E1" />}
            title={t('documents.empty')}
            description={t('documents.emptySubtitle')}
          />
        ) : (
          <FlatList
            data={filteredDocs}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
              <RefreshControl refreshing={false} onRefresh={() => refetch()} />
            }
          />
        )}
      </View>
    </GlassBackground>
  );
}
