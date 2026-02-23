import { View, Text, FlatList, Pressable } from 'react-native';
import { FileText, Check, Layers } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { SummaryCard } from './SummaryCard';
import type { MergeData, MergeSourceSelection, SourceDocument } from '@/lib/review/review-types';

interface MergeDocumentsFlowProps {
  mergeData: MergeData | null;
  mergeSourceSelections: MergeSourceSelection[];
  allSourcesSelected: boolean;
  onSelectDocument: (index: number, doc: SourceDocument) => void;
  onConfirmMerge: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function MergeDocumentsFlow({
  mergeData,
  mergeSourceSelections,
  allSourcesSelected,
  onSelectDocument,
  onConfirmMerge,
}: MergeDocumentsFlowProps) {
  if (!mergeData) return null;

  return (
    <View className="flex-1 px-4 pt-4">
      <SummaryCard summary={mergeData.summary} label="Merge" variant="clone-mode" />

      <View className="mt-4 gap-4">
        {mergeSourceSelections.map((selection, index) => (
          <View key={selection.clientName}>
            <View className="flex-row items-center gap-2 mb-2">
              <Layers size={16} color="#374151" />
              <Text className="text-sm font-semibold text-gray-700">
                {selection.clientName}
              </Text>
              {selection.selectedDoc && <Check size={16} color="#059669" />}
            </View>

            {selection.isSearching ? (
              <View className="items-center py-4">
                <Spinner size="small" />
                <Text className="text-xs text-gray-500 mt-2">Searching...</Text>
              </View>
            ) : selection.documents.length === 0 ? (
              <View className="items-center py-4 bg-gray-50 rounded-xl">
                <FileText size={24} color="#D1D5DB" />
                <Text className="text-xs text-gray-400 mt-1">No documents found</Text>
              </View>
            ) : (
              selection.documents.map((doc) => {
                const isSelected = selection.selectedDoc?.id === doc.id;
                return (
                  <Pressable
                    key={doc.id}
                    onPress={() => onSelectDocument(index, doc)}
                    className={`bg-white border rounded-xl p-3 mb-2 ${
                      isSelected ? 'border-blu-primary' : 'border-gray-100'
                    }`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
                          {doc.title}
                        </Text>
                        <View className="flex-row items-center gap-2 mt-0.5">
                          <Badge variant="default">{doc.type}</Badge>
                          <Text className="text-xs text-gray-500">
                            {formatCurrency(doc.amount)}
                          </Text>
                        </View>
                      </View>
                      {isSelected && (
                        <View className="w-6 h-6 rounded-full bg-blu-primary items-center justify-center">
                          <Check size={14} color="#fff" />
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        ))}
      </View>

      {allSourcesSelected && (
        <View className="mt-6">
          <Card>
            <Text className="text-sm font-semibold text-gray-900 mb-1">Ready to merge</Text>
            <Text className="text-xs text-gray-500">
              {mergeSourceSelections.length} documents selected. Items will be combined into a
              single {mergeData.documentType || 'document'}.
            </Text>
          </Card>
          <View className="mt-3">
            <Button onPress={onConfirmMerge} variant="primary" fullWidth>
              Merge Documents
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}
