import { View, Text, FlatList, Pressable } from 'react-native';
import { FileText, Users, Check } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { SummaryCard } from './SummaryCard';
import type { CloneData, SourceDocument } from '@/lib/review/review-types';

interface CloneDocumentFlowProps {
  cloneData: CloneData | null;
  sourceDocuments: SourceDocument[];
  selectedSourceDoc: SourceDocument | null;
  isSearching: boolean;
  showDocSelection: boolean;
  clientSuggestions: Array<{ name: string; similarity: number }>;
  onSelectDocument: (doc: SourceDocument) => void;
  onUseSuggestedClient: (name: string) => void;
  onConfirm: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function CloneDocumentFlow({
  cloneData,
  sourceDocuments,
  selectedSourceDoc,
  isSearching,
  showDocSelection,
  clientSuggestions,
  onSelectDocument,
  onUseSuggestedClient,
  onConfirm,
}: CloneDocumentFlowProps) {
  if (!cloneData) return null;

  return (
    <View className="flex-1 px-4 pt-4">
      <SummaryCard
        summary={cloneData.summary}
        label="Clone"
        variant="clone-mode"
      />

      {isSearching && (
        <View className="items-center py-8">
          <Spinner />
          <Text className="text-sm text-gray-500 mt-3">
            Searching documents for "{cloneData.sourceClient}"...
          </Text>
        </View>
      )}

      {!isSearching && showDocSelection && sourceDocuments.length > 0 && (
        <View className="mt-4">
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            Select source document ({sourceDocuments.length})
          </Text>
          <FlatList
            data={sourceDocuments}
            keyExtractor={(item) => item.id}
            renderItem={({ item: doc }) => {
              const isSelected = selectedSourceDoc?.id === doc.id;
              return (
                <Pressable
                  onPress={() => onSelectDocument(doc)}
                  className={`bg-white border rounded-xl p-4 mb-2 ${
                    isSelected ? 'border-blu-primary' : 'border-gray-100'
                  }`}
                >
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-center gap-2">
                      <FileText size={16} color={isSelected ? '#0066FF' : '#9CA3AF'} />
                      <Text className="text-sm font-medium text-gray-900">{doc.title}</Text>
                    </View>
                    {isSelected && <Check size={18} color="#0066FF" />}
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-gray-500">{doc.client}</Text>
                    <Text className="text-sm font-semibold text-gray-900">
                      {formatCurrency(doc.amount)}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2 mt-1">
                    <Badge variant="default">{doc.type}</Badge>
                    <Text className="text-xs text-gray-400">
                      {new Date(doc.date).toLocaleDateString()}
                    </Text>
                  </View>
                </Pressable>
              );
            }}
          />
        </View>
      )}

      {!isSearching && sourceDocuments.length === 0 && !showDocSelection && (
        <View className="items-center py-8">
          <FileText size={32} color="#D1D5DB" />
          <Text className="text-sm text-gray-500 mt-2">
            No documents found for "{cloneData.sourceClient}"
          </Text>
          {clientSuggestions.length > 0 && (
            <View className="mt-4 w-full">
              <Text className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Did you mean?
              </Text>
              {clientSuggestions.map((suggestion) => (
                <Pressable
                  key={suggestion.name}
                  onPress={() => onUseSuggestedClient(suggestion.name)}
                  className="flex-row items-center py-3 border-b border-gray-100"
                >
                  <Users size={16} color="#6B7280" />
                  <Text className="text-sm font-medium text-gray-900 ml-2 flex-1">
                    {suggestion.name}
                  </Text>
                  <Text className="text-xs text-gray-400">
                    {Math.round(suggestion.similarity * 100)}% match
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      {selectedSourceDoc && !showDocSelection && (
        <View className="mt-4">
          <Card>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-semibold text-gray-900">Selected Source</Text>
              <Badge variant="info">{selectedSourceDoc.type}</Badge>
            </View>
            <Text className="text-sm text-gray-700">{selectedSourceDoc.title}</Text>
            <Text className="text-xs text-gray-500 mt-1">{selectedSourceDoc.client}</Text>
            <Text className="text-base font-bold text-gray-900 mt-2">
              {formatCurrency(selectedSourceDoc.amount)}
            </Text>
          </Card>

          <View className="mt-4">
            <Button onPress={onConfirm} variant="primary" fullWidth>
              Clone Document
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}
