import { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import {
  FileText,
  ArrowRight,
  RefreshCw,
  Check,
  AlertCircle,
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { SummaryCard } from './SummaryCard';
import { AlertCard } from './AlertCard';
import { TransformClientSelector } from './TransformClientSelector';
import type {
  TransformData,
  TransformSourceDocument,
  TransformClientSuggestion,
} from '@/lib/review/review-types';

interface TransformReviewProps {
  transformData: TransformData | null;
  transformSourceDoc: TransformSourceDocument | null;
  isSearching: boolean;
  isExecuting: boolean;
  transformError: string | null;
  transformSuccess: boolean;
  transformResult: { jobId: string; documentsCreated: number } | null;
  clientSuggestions: TransformClientSuggestion[];
  searchedClient: string | null;
  manualSearchQuery: string;
  manualSearchResults: TransformClientSuggestion[];
  isSearchingManual: boolean;
  onRetryWithClient: (name: string) => void;
  onManualSearchChange: (query: string) => void;
  onExecuteTransform: (config: TransformConfig) => void;
  onBack: () => void;
}

interface TransformConfig {
  conversion: { enabled: boolean; targetType: 'invoice' | 'estimate' };
  split: {
    enabled: boolean;
    numberOfParts: number;
    method: 'equal' | 'custom' | 'percentage';
    amounts: number[];
    labels: string[];
  };
  schedule: {
    enabled: boolean;
    frequency: { type: 'days' | 'weeks' | 'months'; interval: number } | null;
    startDate: Date | null;
    sendFirst: boolean;
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function TransformReview({
  transformData,
  transformSourceDoc,
  isSearching,
  isExecuting,
  transformError,
  transformSuccess,
  transformResult,
  clientSuggestions,
  searchedClient,
  manualSearchQuery,
  manualSearchResults,
  isSearchingManual,
  onRetryWithClient,
  onManualSearchChange,
  onExecuteTransform,
  onBack,
}: TransformReviewProps) {
  const [showClientSelector, setShowClientSelector] = useState(false);

  if (!transformData) return null;

  if (transformSuccess && transformResult) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-16 h-16 rounded-full bg-emerald-100 items-center justify-center mb-4">
          <Check size={32} color="#059669" />
        </View>
        <Text className="text-xl font-bold text-gray-900 text-center mb-2">
          Transform Complete
        </Text>
        <Text className="text-sm text-gray-500 text-center">
          {transformResult.documentsCreated} document(s) created.
        </Text>
      </View>
    );
  }

  if (showClientSelector || (clientSuggestions.length > 0 && !transformSourceDoc)) {
    return (
      <TransformClientSelector
        suggestions={clientSuggestions}
        searchQuery={manualSearchQuery}
        searchResults={manualSearchResults}
        isSearching={isSearchingManual}
        onSearchChange={onManualSearchChange}
        onSelectClient={(name) => {
          setShowClientSelector(false);
          onRetryWithClient(name);
        }}
        onBack={() => setShowClientSelector(false)}
        searchedClient={searchedClient}
      />
    );
  }

  if (isSearching) {
    return (
      <View className="flex-1 items-center justify-center">
        <Spinner />
        <Text className="text-sm text-gray-500 mt-3">Finding source document...</Text>
      </View>
    );
  }

  const sourceType = transformSourceDoc?.type || transformData.source?.documentType || 'invoice';
  const targetType = transformData.conversion?.targetType ||
    (sourceType === 'invoice' ? 'estimate' : 'invoice');

  const handleExecute = useCallback(() => {
    onExecuteTransform({
      conversion: {
        enabled: transformData.conversion?.enabled ?? true,
        targetType,
      },
      split: {
        enabled: false,
        numberOfParts: 1,
        method: 'equal',
        amounts: [],
        labels: [],
      },
      schedule: {
        enabled: false,
        frequency: null,
        startDate: null,
        sendFirst: false,
      },
    });
  }, [transformData, targetType, onExecuteTransform]);

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <SummaryCard summary={transformData.summary} label="Transform" variant="transform-mode" />

      {transformError && (
        <View className="mt-4">
          <AlertCard title="Error" message={transformError} variant="error" />
        </View>
      )}

      {transformSourceDoc && (
        <View className="mt-4 gap-4">
          <Card>
            <Text className="text-xs font-semibold text-gray-500 uppercase mb-3">
              Source Document
            </Text>
            <View className="flex-row items-center gap-2 mb-2">
              <FileText size={16} color="#374151" />
              <Text className="text-sm font-medium text-gray-900">
                {transformSourceDoc.number}
              </Text>
              <Badge variant={sourceType === 'estimate' ? 'warning' : 'info'}>
                {sourceType}
              </Badge>
            </View>
            <Text className="text-xs text-gray-500">{transformSourceDoc.clientName}</Text>
            <Text className="text-base font-bold text-gray-900 mt-2">
              {formatCurrency(transformSourceDoc.total)}
            </Text>

            {transformSourceDoc.items.length > 0 && (
              <View className="mt-3 pt-3 border-t border-gray-100">
                {transformSourceDoc.items.slice(0, 5).map((item) => (
                  <View key={item.id} className="flex-row justify-between py-1">
                    <Text className="text-xs text-gray-600 flex-1" numberOfLines={1}>
                      {item.description}
                    </Text>
                    <Text className="text-xs font-medium text-gray-900 ml-2">
                      {formatCurrency(item.total)}
                    </Text>
                  </View>
                ))}
                {transformSourceDoc.items.length > 5 && (
                  <Text className="text-xs text-gray-400 mt-1">
                    +{transformSourceDoc.items.length - 5} more items
                  </Text>
                )}
              </View>
            )}
          </Card>

          <View className="flex-row items-center justify-center gap-3">
            <Badge variant={sourceType === 'estimate' ? 'warning' : 'info'}>
              {sourceType}
            </Badge>
            <ArrowRight size={18} color="#9CA3AF" />
            <Badge variant={targetType === 'estimate' ? 'warning' : 'info'}>
              {targetType}
            </Badge>
          </View>

          <Button
            onPress={handleExecute}
            variant="primary"
            fullWidth
            loading={isExecuting}
            icon={<RefreshCw size={18} color="#fff" />}
          >
            {isExecuting ? 'Transforming...' : `Convert to ${targetType}`}
          </Button>
        </View>
      )}

      {!transformSourceDoc && !isSearching && (
        <View className="mt-4 items-center">
          <AlertCircle size={32} color="#D1D5DB" />
          <Text className="text-sm text-gray-500 mt-2 text-center">
            {transformError || 'No source document found'}
          </Text>
          <View className="mt-4">
            <Button
              onPress={() => setShowClientSelector(true)}
              variant="outline"
            >
              Search Client
            </Button>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
