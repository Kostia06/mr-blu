import { View, Text, TextInput, Pressable, FlatList } from 'react-native';
import { Search, User, ChevronLeft, Star } from 'lucide-react-native';
import { Spinner } from '@/components/ui/Spinner';
import type { TransformClientSuggestion } from '@/lib/review/review-types';

interface TransformClientSelectorProps {
  suggestions: TransformClientSuggestion[];
  searchQuery: string;
  searchResults: TransformClientSuggestion[];
  isSearching: boolean;
  onSearchChange: (query: string) => void;
  onSelectClient: (name: string) => void;
  onBack: () => void;
  searchedClient: string | null;
}

export function TransformClientSelector({
  suggestions,
  searchQuery,
  searchResults,
  isSearching,
  onSearchChange,
  onSelectClient,
  onBack,
  searchedClient,
}: TransformClientSelectorProps) {
  const displayList = searchQuery.trim() ? searchResults : suggestions;
  const bestMatch = suggestions.length > 0 ? suggestions[0] : null;

  return (
    <View className="flex-1 px-4 pt-4">
      <Pressable onPress={onBack} className="flex-row items-center mb-4" hitSlop={8}>
        <ChevronLeft size={20} color="#374151" />
        <Text className="text-sm font-medium text-gray-700 ml-1">Back</Text>
      </Pressable>

      {searchedClient && (
        <Text className="text-sm text-gray-500 mb-3">
          No documents found for "{searchedClient}". Select a client:
        </Text>
      )}

      <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4">
        <Search size={18} color="#9CA3AF" />
        <TextInput
          className="flex-1 ml-2 text-base text-gray-900"
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search clients..."
          placeholderTextColor="#94A3B8"
          autoCapitalize="none"
        />
        {isSearching && <Spinner size="small" />}
      </View>

      <FlatList
        data={displayList}
        keyExtractor={(item) => item.id}
        renderItem={({ item: client, index }) => {
          const isBestMatch = !searchQuery.trim() && index === 0 && bestMatch?.id === client.id;
          return (
            <Pressable
              onPress={() => onSelectClient(client.name)}
              className={`flex-row items-center p-4 mb-2 rounded-xl border ${
                isBestMatch ? 'border-blu-primary bg-blue-50' : 'border-gray-100 bg-white'
              } active:opacity-90`}
            >
              <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center mr-3">
                <User size={16} color="#6B7280" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm font-medium text-gray-900">{client.name}</Text>
                  {isBestMatch && <Star size={12} color="#0066FF" fill="#0066FF" />}
                </View>
                <Text className="text-xs text-gray-500 mt-0.5">
                  {Math.round(client.similarity * 100)}% match
                  {client.estimateCount > 0 && ` | ${client.estimateCount} estimates`}
                  {client.invoiceCount > 0 && ` | ${client.invoiceCount} invoices`}
                </Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          !isSearching ? (
            <View className="items-center py-8">
              <User size={32} color="#D1D5DB" />
              <Text className="text-sm text-gray-400 mt-2">No clients found</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
