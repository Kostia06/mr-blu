import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useReviewOrchestrator } from '@/hooks/review/useReviewOrchestrator';
import type { ParsedData } from '@/lib/review/review-types';

import { GlassBackground } from '@/components/layout/GlassBackground';
import { ReviewHeader } from './ReviewHeader';
import { ReviewLoadingState } from './ReviewLoadingState';
import { ReviewPreviewCard } from './ReviewPreviewCard';
import { ReviewLineItems } from './ReviewLineItems';
import { ReviewActions } from './ReviewActions';
import { ReviewExecuteButton } from './ReviewExecuteButton';
import { SummaryCard } from './SummaryCard';
import { AlertCard } from './AlertCard';
import { DoneState } from './DoneState';
import { QueryResultsFlow } from './QueryResultsFlow';
import { CloneDocumentFlow } from './CloneDocumentFlow';
import { MergeDocumentsFlow } from './MergeDocumentsFlow';
import { SendDocumentFlow } from './SendDocumentFlow';
import { TransformReview } from './TransformReview';

export function ReviewPage() {
  const { data: rawData, transcript: rawTranscript } = useLocalSearchParams<{
    data?: string;
    transcript?: string;
  }>();

  const state = useReviewOrchestrator({ rawData, rawTranscript });

  if (state.isParsing) {
    return (
      <GlassBackground>
        <ReviewHeader intentType={null} />
        <ReviewLoadingState />
      </GlassBackground>
    );
  }

  if (state.allActionsComplete) {
    return (
      <GlassBackground>
        <ReviewHeader intentType={state.intentType} />
        <DoneState
          documentId={state.savedDocumentId}
          documentType={state.data.documentType}
          documentNumber={(state.data as Record<string, unknown>).documentNumber as string || ''}
        />
      </GlassBackground>
    );
  }

  if (state.intentType === 'information_query') {
    return (
      <GlassBackground>
        <ReviewHeader intentType={state.intentType} />
        <QueryResultsFlow
          queryData={state.queryData}
          queryResult={state.queryResult}
          isLoading={state.isQueryLoading}
        />
      </GlassBackground>
    );
  }

  if (state.intentType === 'document_clone') {
    return (
      <GlassBackground>
        <ReviewHeader intentType={state.intentType} />
        <CloneDocumentFlow
          cloneData={state.clone.cloneData}
          sourceDocuments={state.clone.sourceDocuments}
          selectedSourceDoc={state.clone.selectedSourceDoc}
          isSearching={state.clone.isSearchingDocs}
          showDocSelection={state.clone.showDocSelection}
          clientSuggestions={state.clone.cloneClientSuggestions}
          onSelectDocument={state.clone.selectSourceDocument}
          onUseSuggestedClient={state.clone.useCloneSuggestedClient}
          onConfirm={state.handleCloneConfirm}
        />
      </GlassBackground>
    );
  }

  if (state.intentType === 'document_merge') {
    return (
      <GlassBackground>
        <ReviewHeader intentType={state.intentType} />
        <MergeDocumentsFlow
          mergeData={state.merge.mergeData}
          mergeSourceSelections={state.merge.mergeSourceSelections}
          allSourcesSelected={state.merge.allMergeSourcesSelected}
          onSelectDocument={state.merge.selectMergeSourceDocument}
          onConfirmMerge={state.handleMergeConfirm}
        />
      </GlassBackground>
    );
  }

  if (state.intentType === 'document_send') {
    return (
      <GlassBackground>
        <ReviewHeader intentType={state.intentType} />
        <SendDocumentFlow
          sendData={state.send.sendData}
          sendDocument={state.send.sendDocument}
          isSending={state.send.isSendingDocument}
          sendError={state.send.sendError}
          sendSuccess={state.send.sendSuccess}
          editableSendEmail={state.send.editableSendEmail}
          editableSendPhone={state.send.editableSendPhone}
          onEmailChange={state.send.setEditableSendEmail}
          onPhoneChange={state.send.setEditableSendPhone}
          onExecuteSend={() => state.send.executeSendDocument()}
          isEditingDocument={state.send.isEditingSendDocument}
          sendDocumentItems={state.send.sendDocumentItems}
          sendDocumentSubtotal={state.send.sendDocumentSubtotal}
          sendDocumentTaxRate={state.send.sendDocumentTaxRate}
          sendDocumentTotal={state.send.sendDocumentTotal}
          onLoadForEditing={state.send.loadSendDocumentForEditing}
          onSaveChanges={state.send.saveSendDocumentChanges}
          onCancelEditing={state.send.cancelSendDocumentEditing}
          onUpdateSendItem={state.send.updateSendItemTotal}
          onRemoveSendItem={state.send.removeSendItem}
          onAddSendItem={state.send.addSendItem}
          isSavingDocument={state.send.isSavingSendDocument}
        />
      </GlassBackground>
    );
  }

  if (state.intentType === 'document_transform') {
    return (
      <GlassBackground>
        <ReviewHeader intentType={state.intentType} />
        <TransformReview
          transformData={state.transform.transformData}
          transformSourceDoc={state.transform.transformSourceDoc}
          isSearching={state.transform.isSearchingTransformSource}
          isExecuting={state.transform.isExecutingTransform}
          transformError={state.transform.transformError}
          transformSuccess={state.transform.transformSuccess}
          transformResult={state.transform.transformResult}
          clientSuggestions={state.transform.transformClientSuggestions}
          searchedClient={state.transform.transformSearchedClient}
          manualSearchQuery={state.transform.manualClientSearchQuery}
          manualSearchResults={state.transform.manualClientSearchResults}
          isSearchingManual={state.transform.isSearchingManualClient}
          onRetryWithClient={state.transform.retryTransformWithClient}
          onManualSearchChange={(q) => {
            state.transform.setManualClientSearchQuery(q);
            state.transform.handleManualClientSearch(q);
          }}
          onExecuteTransform={state.transform.handleExecuteTransform}
          onBack={() => router.back()}
        />
      </GlassBackground>
    );
  }

  return (
    <GlassBackground>
      <ReviewHeader intentType={state.intentType} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          {state.parseError && (
            <View className="mb-4">
              <AlertCard title="Parse Warning" message={state.parseError} variant="warning" />
            </View>
          )}

          {state.data.summary && (
            <View className="mb-4">
              <SummaryCard summary={state.data.summary} />
            </View>
          )}

          <View className="mb-4">
            <ReviewPreviewCard
              data={state.data}
              onUpdateData={state.handleUpdateData}
              clientSuggestions={state.clientSuggestions}
              isSearchingClients={state.isSearchingClients}
              onSearchClients={state.handleSearchClients}
              onSelectClient={state.handleSelectClient}
            />
          </View>

          <View className="mb-4">
            <ReviewLineItems
              items={state.data.items}
              onUpdateItems={(items) => state.handleUpdateData({ items })}
              taxRate={state.data.taxRate}
              onUpdateTaxRate={(rate) => state.handleUpdateData({ taxRate: rate })}
              itemSuggestions={state.itemSuggestions}
            />
          </View>

          <ReviewActions
            actions={state.data.actions}
            data={state.data}
            onUpdateActions={(actions) => state.handleUpdateData({ actions })}
            onUpdateData={state.handleUpdateData}
            hasProfile={!!state.userProfile?.business_name}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <ReviewExecuteButton
        onPress={state.executeAllActions}
        isExecuting={state.isExecuting}
        isLocked={!state.data.client?.name || state.data.items.length === 0}
        label={getExecuteLabel(state.data)}
        total={state.data.total}
      />
    </GlassBackground>
  );
}

function getExecuteLabel(data: ParsedData): string {
  const hasSend = data.actions.some((a) => a.type === 'send_email');
  if (hasSend) return 'Create & Send';
  return data.documentType === 'estimate' ? 'Create Estimate' : 'Create Invoice';
}
