import { useState, useMemo, useCallback } from 'react';
import { View, Text, SectionList, TextInput, Pressable, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Search, FileText, ArrowUpDown, ChevronDown } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useDocumentsData } from '@/hooks/useDocumentsData';
import { useI18nStore } from '@/lib/i18n';
import { formatCurrency, formatSmartTime, groupDocumentsByMonth } from '@/lib/utils/format';
import { deleteDocument } from '@/lib/api/documents';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { SwipeableRow } from '@/components/gestures/SwipeableRow';
import { DocumentListSkeleton } from './DocumentListSkeleton';
import { GlassBackground } from '@/components/layout/GlassBackground';
import { useToastStore } from '@/stores/toastStore';

type FilterTab = 'all' | 'invoice' | 'estimate' | 'contract';
type SortKey = 'date' | 'amount' | 'client' | 'status';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'date', label: 'Date' },
  { key: 'amount', label: 'Amount' },
  { key: 'client', label: 'Client' },
  { key: 'status', label: 'Status' },
];

export function DocumentList() {
  const insets = useSafeAreaInsets();
  const { t, locale } = useI18nStore();
  const { data, isLoading, refetch } = useDocumentsData();
  const queryClient = useQueryClient();
  const toast = useToastStore();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [sortBy, setSortBy] = useState<SortKey>('date');
  const [showSort, setShowSort] = useState(false);

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

    if (sortBy !== 'date') {
      docs = [...docs].sort((a, b) => {
        if (sortBy === 'amount') return b.amount - a.amount;
        if (sortBy === 'client') return a.client.localeCompare(b.client);
        if (sortBy === 'status') return a.status.localeCompare(b.status);
        return 0;
      });
    }

    return docs;
  }, [data?.documents, activeTab, search, sortBy]);

  const sections = useMemo(() => {
    const grouped = groupDocumentsByMonth(filteredDocs, locale);
    return Array.from(grouped.entries()).map(([title, items]) => ({
      title,
      data: items,
    }));
  }, [filteredDocs, locale]);

  const statusToBadgeStatus = (status: string) => {
    const validStatuses = ['draft', 'sent', 'pending', 'paid', 'overdue', 'signed'];
    return validStatuses.includes(status) ? status as 'draft' | 'sent' | 'pending' | 'paid' | 'overdue' | 'signed' : undefined;
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: t('documents.all') },
    { key: 'invoice', label: t('documents.invoices') },
    { key: 'estimate', label: 'Estimates' },
    { key: 'contract', label: t('documents.contracts') },
  ];

  const handleDelete = useCallback((id: string, docType: string) => {
    Alert.alert('Delete Document', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDocument(id, docType);
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            toast.success('Document deleted');
          } catch {
            toast.error('Failed to delete');
          }
        },
      },
    ]);
  }, [queryClient, toast]);

  const handleSend = useCallback((id: string) => {
    router.push(`/(tabs)/documents/${id}`);
  }, []);

  const renderItem = useCallback(({ item }: { item: typeof filteredDocs[0] }) => (
    <SwipeableRow
      onDelete={() => handleDelete(item.id, item.documentType)}
      onSend={item.status === 'draft' ? () => handleSend(item.id) : undefined}
    >
      <Card
        variant="glass"
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
            <Badge status={statusToBadgeStatus(item.status)} dot>
              {item.status}
            </Badge>
          </View>
        </View>
      </Card>
    </SwipeableRow>
  ), [locale, handleDelete, handleSend]);

  const renderSectionHeader = useCallback(({ section }: { section: { title: string } }) => (
    <View className="px-5 py-2 mt-2">
      <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {section.title}
      </Text>
    </View>
  ), []);

  return (
    <GlassBackground>
      <View style={{ paddingTop: insets.top + 8 }} className="flex-1">
        <View className="px-5 mb-3">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-2xl font-bold text-gray-900">
              {t('documents.title')}
            </Text>
            <Pressable
              onPress={() => setShowSort(!showSort)}
              className="flex-row items-center gap-1 px-3 py-1.5 rounded-chip"
              style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}
            >
              <ArrowUpDown size={14} color="#6B7280" />
              <Text className="text-xs font-medium text-gray-600 capitalize">{sortBy}</Text>
              <ChevronDown size={12} color="#6B7280" />
            </Pressable>
          </View>

          {/* Sort Dropdown */}
          {showSort && (
            <View className="flex-row flex-wrap gap-2 mb-3">
              {SORT_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.key}
                  onPress={() => { setSortBy(opt.key); setShowSort(false); }}
                  className={`px-3 py-1.5 rounded-chip ${sortBy === opt.key ? 'bg-blu-primary' : ''}`}
                  style={sortBy !== opt.key ? { backgroundColor: 'rgba(255,255,255,0.5)' } : undefined}
                >
                  <Text className={`text-xs font-medium ${sortBy === opt.key ? 'text-white' : 'text-gray-600'}`}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Search */}
          <View className="flex-row items-center rounded-input px-4 py-2.5 mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' }}>
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
                  activeTab === tab.key ? 'bg-blu-primary' : ''
                }`}
                style={activeTab !== tab.key ? { backgroundColor: 'rgba(255,255,255,0.4)' } : undefined}
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
          <SectionList
            sections={sections}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 100 }}
            stickySectionHeadersEnabled={false}
            refreshControl={
              <RefreshControl refreshing={false} onRefresh={() => refetch()} />
            }
          />
        )}
      </View>
    </GlassBackground>
  );
}
