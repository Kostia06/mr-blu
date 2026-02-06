// Transform flow state + logic

import type {
	TransformData,
	TransformSourceDocument,
	TransformClientSuggestion
} from './review-types';

export function createTransformFlow() {
	let transformData = $state<TransformData | null>(null);
	let transformSourceDoc = $state<TransformSourceDocument | null>(null);
	let isSearchingTransformSource = $state(false);
	let isExecutingTransform = $state(false);
	let transformError = $state<string | null>(null);
	let transformSuccess = $state(false);
	let transformResult = $state<{ jobId: string; documentsCreated: number } | null>(null);

	// Client suggestions (when client not found)
	let transformClientSuggestions = $state<TransformClientSuggestion[]>([]);
	let transformSearchedClient = $state<string | null>(null);
	let transformSearchedDocType = $state<string | null>(null);
	let showOtherSuggestions = $state(false);

	// Manual client search state
	let manualClientSearchQuery = $state('');
	let manualClientSearchResults = $state<TransformClientSuggestion[]>([]);
	let isSearchingManualClient = $state(false);
	let manualSearchTimeout: ReturnType<typeof setTimeout> | null = null;

	async function findTransformSourceDocument(clientNameOverride?: string) {
		const clientName = clientNameOverride || transformData?.source?.clientName;
		if (!clientName) return;

		isSearchingTransformSource = true;
		transformError = null;
		transformSourceDoc = null;
		transformClientSuggestions = [];
		transformSearchedClient = null;
		transformSearchedDocType = null;

		try {
			const params = new URLSearchParams();
			params.set('clientName', clientName);
			if (transformData?.source?.documentType) {
				params.set('documentType', transformData.source.documentType);
			}
			if (transformData?.source?.selector) {
				params.set('selector', transformData.source.selector);
			}

			const response = await fetch(`/api/transform?${params.toString()}`);
			const result = await response.json();

			if (result.success && result.sourceDocument) {
				transformSourceDoc = {
					id: result.sourceDocument.id,
					type: result.sourceDocument.type,
					number: result.sourceDocument.number,
					total: result.sourceDocument.total,
					clientId: result.sourceDocument.clientId,
					clientName: result.sourceDocument.clientName,
					clientEmail: result.sourceDocument.clientEmail,
					items: result.sourceDocument.items,
					createdAt: new Date(result.sourceDocument.createdAt)
				};
			} else if (result.error === 'client_not_found' && result.suggestions) {
				transformClientSuggestions = result.suggestions || [];
				transformSearchedClient = result.searchedClient || clientName;
				transformSearchedDocType =
					result.searchedDocumentType || transformData?.source?.documentType || null;
				transformError = result.message || `No documents found for "${clientName}"`;
			} else {
				transformError =
					result.message ||
					`No ${transformData?.source?.documentType || 'documents'} found for "${clientName}".`;
			}
		} catch (error) {
			console.error('Find transform source error:', error);
			transformError = 'Failed to find source document. Please try again.';
		} finally {
			isSearchingTransformSource = false;
		}
	}

	function retryTransformWithClient(clientName: string) {
		if (transformData) {
			transformData = {
				...transformData,
				source: {
					...transformData.source,
					clientName: clientName
				}
			};
		}
		findTransformSourceDocument(clientName);
	}

	async function handleExecuteTransform(config: {
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
	}) {
		if (!transformSourceDoc) return;

		isExecutingTransform = true;
		transformError = null;

		try {
			const response = await fetch('/api/transform', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sourceDocumentId: transformSourceDoc.id,
					sourceDocumentType: transformSourceDoc.type,
					conversion: config.conversion,
					split: {
						enabled: config.split.enabled,
						numberOfParts: config.split.numberOfParts,
						method: config.split.method,
						customAmounts: config.split.method === 'custom' ? config.split.amounts : undefined,
						percentages:
							config.split.method === 'percentage'
								? config.split.amounts.map((_, i) =>
										Math.round((config.split.amounts[i] / transformSourceDoc!.total) * 100)
									)
								: undefined,
						labels: config.split.labels
					},
					schedule: config.schedule
				})
			});

			if (!response.ok) {
				const result = await response.json();
				transformError = result.error || 'Transform failed. Please try again.';
				return;
			}

			const result = await response.json();

			if (result.success) {
				transformSuccess = true;
				transformResult = {
					jobId: result.job.id,
					documentsCreated: result.generatedDocument ? 1 : 0
				};
			} else {
				transformError = result.error || 'Transform failed. Please try again.';
			}
		} catch (error) {
			console.error('Execute transform error:', error);
			transformError = 'Transform failed. Please try again.';
		} finally {
			isExecutingTransform = false;
		}
	}

	async function searchClientsManually(query: string) {
		if (!query.trim()) {
			manualClientSearchResults = [];
			return;
		}

		isSearchingManualClient = true;
		try {
			const response = await fetch('/api/clients/suggest', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: query, limit: 5 })
			});

			if (response.ok) {
				const result = await response.json();
				if (result.success && result.suggestions) {
					manualClientSearchResults = result.suggestions.map(
						(s: { id: string; name: string; similarity: number }) => ({
							id: s.id,
							name: s.name,
							similarity: s.similarity,
							estimateCount: 0,
							invoiceCount: 0
						})
					);
				}
			}
		} catch (error) {
			console.error('Manual client search error:', error);
		} finally {
			isSearchingManualClient = false;
		}
	}

	function handleManualClientSearch(query: string) {
		if (manualSearchTimeout) {
			clearTimeout(manualSearchTimeout);
		}
		manualSearchTimeout = setTimeout(() => searchClientsManually(query), 300);
	}

	return {
		get transformData() {
			return transformData;
		},
		set transformData(v) {
			transformData = v;
		},
		get transformSourceDoc() {
			return transformSourceDoc;
		},
		set transformSourceDoc(v) {
			transformSourceDoc = v;
		},
		get isSearchingTransformSource() {
			return isSearchingTransformSource;
		},
		get isExecutingTransform() {
			return isExecutingTransform;
		},
		get transformError() {
			return transformError;
		},
		set transformError(v) {
			transformError = v;
		},
		get transformSuccess() {
			return transformSuccess;
		},
		set transformSuccess(v) {
			transformSuccess = v;
		},
		get transformResult() {
			return transformResult;
		},
		set transformResult(v) {
			transformResult = v;
		},
		get transformClientSuggestions() {
			return transformClientSuggestions;
		},
		get transformSearchedClient() {
			return transformSearchedClient;
		},
		get transformSearchedDocType() {
			return transformSearchedDocType;
		},
		get showOtherSuggestions() {
			return showOtherSuggestions;
		},
		set showOtherSuggestions(v) {
			showOtherSuggestions = v;
		},
		get manualClientSearchQuery() {
			return manualClientSearchQuery;
		},
		set manualClientSearchQuery(v) {
			manualClientSearchQuery = v;
		},
		get manualClientSearchResults() {
			return manualClientSearchResults;
		},
		get isSearchingManualClient() {
			return isSearchingManualClient;
		},
		findTransformSourceDocument,
		retryTransformWithClient,
		handleExecuteTransform,
		searchClientsManually,
		handleManualClientSearch
	};
}
