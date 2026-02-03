// Clone flow state + logic

import type { CloneData, SourceDocument, LineItem } from './review-types';

export function createCloneFlow() {
	let cloneData = $state<CloneData | null>(null);
	let sourceDocuments = $state<SourceDocument[]>([]);
	let selectedSourceDoc = $state<SourceDocument | null>(null);
	let isSearchingDocs = $state(false);
	let showDocSelection = $state(false);
	let cloneClientSuggestions = $state<{ name: string; similarity: number }[]>([]);

	async function searchSourceDocuments(clientName: string, docType?: string) {
		isSearchingDocs = true;
		cloneClientSuggestions = [];
		try {
			const response = await fetch('/api/documents/search', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					clientName,
					documentType: docType,
					limit: 10
				})
			});
			const result = await response.json();
			if (result.success) {
				sourceDocuments = result.documents;
				showDocSelection = result.documents.length > 1;

				if (result.suggestions?.alternatives) {
					cloneClientSuggestions = result.suggestions.alternatives;
				}

				if (result.documents.length === 1) {
					selectSourceDocument(result.documents[0]);
				} else if (result.documents.length === 0 && cloneClientSuggestions.length === 0) {
					return `No documents found for "${clientName}". Try creating a new document instead.`;
				}
			}
		} catch (error) {
			console.error('Search documents error:', error);
		} finally {
			isSearchingDocs = false;
		}
		return null;
	}

	function selectSourceDocument(doc: SourceDocument) {
		selectedSourceDoc = doc;
		showDocSelection = false;
	}

	function useCloneSuggestedClient(clientName: string) {
		if (cloneData) {
			cloneData = { ...cloneData, sourceClient: clientName };
			searchSourceDocuments(clientName, cloneData.documentType || undefined);
		}
	}

	/**
	 * Apply clone modifications to source document items and return new ParsedData-like result.
	 * The caller is responsible for setting intentType and data on the page.
	 */
	function applyCloneModifications(doc: SourceDocument): {
		items: LineItem[];
		subtotal: number;
		total: number;
	} {
		let items: LineItem[] = (doc.lineItems || []).map((item, index) => {
			const quantity =
				typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 1;
			const total = typeof item.total === 'number' && !isNaN(item.total) ? item.total : 0;
			const rate =
				typeof item.rate === 'number' && !isNaN(item.rate) ? item.rate : total / quantity;

			return {
				id: `item-${Date.now()}-${index}`,
				description: item.description || '',
				quantity,
				unit: item.unit || 'unit',
				rate: isNaN(rate) ? 0 : rate,
				total
			};
		});

		const modifications = cloneData?.modifications;

		const matchesKeyword = (description: string, keyword: string): boolean => {
			const desc = description.toLowerCase();
			const kw = keyword.toLowerCase();

			if (desc.includes(kw)) return true;

			const keywordWords = kw.split(/\s+/).filter((w) => w.length > 2);
			const descWords = desc.split(/\s+/);

			for (const kwWord of keywordWords) {
				for (const descWord of descWords) {
					if (descWord.startsWith(kwWord) || kwWord.startsWith(descWord)) {
						return true;
					}
				}
			}

			const categoryWords = [
				'service',
				'labor',
				'material',
				'fee',
				'cost',
				'charge',
				'work',
				'install',
				'delivery'
			];
			for (const catWord of categoryWords) {
				if (kw.includes(catWord) && desc.includes(catWord)) {
					return true;
				}
			}

			return false;
		};

		if (modifications) {
			// Update existing items
			if (modifications.updateItems && Array.isArray(modifications.updateItems)) {
				for (const update of modifications.updateItems) {
					const matchKeyword = update.match;
					if (!matchKeyword) continue;

					items = items.map((item) => {
						const isMatch = matchesKeyword(item.description, matchKeyword);

						if (isMatch) {
							const safeItemRate =
								typeof item.rate === 'number' && !isNaN(item.rate) ? item.rate : 0;
							const safeItemQty =
								typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 1;

							let newRate = update.newRate != null ? Number(update.newRate) : safeItemRate;
							let newQuantity =
								update.newQuantity != null ? Number(update.newQuantity) : safeItemQty;

							if (isNaN(newRate)) newRate = safeItemRate;
							if (isNaN(newQuantity)) newQuantity = safeItemQty;

							const newTotal = newRate * newQuantity;

							return {
								...item,
								description: update.newDescription || item.description,
								rate: newRate,
								quantity: newQuantity,
								total: isNaN(newTotal) ? 0 : newTotal
							};
						}
						return item;
					});
				}
			}

			// Handle legacy format
			if ((modifications as Record<string, unknown>).newAmount && !modifications.updateItems) {
				const newAmount = (modifications as Record<string, unknown>).newAmount as number;
				if (items.length > 0) {
					items[0] = {
						...items[0],
						rate: newAmount,
						total: newAmount * items[0].quantity
					};
				}
			}

			// Remove items
			if (modifications.removeItems && Array.isArray(modifications.removeItems)) {
				const removeKeywords = modifications.removeItems;
				items = items.filter((item) => {
					return !removeKeywords.some((keyword: string) =>
						matchesKeyword(item.description, keyword)
					);
				});
			}

			// Add new items
			if (modifications.addItems && Array.isArray(modifications.addItems)) {
				for (const newItem of modifications.addItems) {
					items.push({
						id: `item-${Date.now()}-${items.length}`,
						description: newItem.description,
						quantity: newItem.quantity || 1,
						unit: newItem.unit || 'unit',
						rate: newItem.rate || 0,
						total: (newItem.quantity || 1) * (newItem.rate || 0)
					});
				}
			}
		}

		const subtotal = items.reduce((sum, item) => sum + item.total, 0);
		const total = modifications?.newTotal ?? subtotal;

		return { items, subtotal, total };
	}

	return {
		get cloneData() {
			return cloneData;
		},
		set cloneData(v) {
			cloneData = v;
		},
		get sourceDocuments() {
			return sourceDocuments;
		},
		get selectedSourceDoc() {
			return selectedSourceDoc;
		},
		set selectedSourceDoc(v) {
			selectedSourceDoc = v;
		},
		get isSearchingDocs() {
			return isSearchingDocs;
		},
		get showDocSelection() {
			return showDocSelection;
		},
		get cloneClientSuggestions() {
			return cloneClientSuggestions;
		},
		searchSourceDocuments,
		selectSourceDocument,
		useCloneSuggestedClient,
		applyCloneModifications
	};
}
