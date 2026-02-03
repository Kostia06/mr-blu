// Merge flow state + logic

import type { MergeData, MergeSourceSelection, SourceDocument, LineItem } from './review-types';

export function createMergeFlow() {
	let mergeData = $state<MergeData | null>(null);
	let mergeSourceSelections = $state<MergeSourceSelection[]>([]);
	let showMergeSelection = $state(false);

	const allMergeSourcesSelected = $derived(
		mergeSourceSelections.length > 0 &&
			mergeSourceSelections.every((sel) => sel.selectedDoc !== null)
	);

	async function searchMergeSourceDocuments(clientName: string, index: number, docType?: string) {
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
				mergeSourceSelections = mergeSourceSelections.map((sel, i) => {
					if (i === index) {
						return {
							...sel,
							documents: result.documents,
							isSearching: false,
							selectedDoc: result.documents.length === 1 ? result.documents[0] : null
						};
					}
					return sel;
				});
			} else {
				mergeSourceSelections = mergeSourceSelections.map((sel, i) => {
					if (i === index) {
						return { ...sel, isSearching: false };
					}
					return sel;
				});
			}
		} catch (error) {
			console.error('Search merge documents error:', error);
			mergeSourceSelections = mergeSourceSelections.map((sel, i) => {
				if (i === index) {
					return { ...sel, isSearching: false };
				}
				return sel;
			});
		}
	}

	function selectMergeSourceDocument(index: number, doc: SourceDocument) {
		mergeSourceSelections = mergeSourceSelections.map((sel, i) => {
			if (i === index) {
				return { ...sel, selectedDoc: doc };
			}
			return sel;
		});
	}

	/**
	 * Combine items from all selected source documents.
	 * Returns the combined items and totals. Caller sets intentType and data.
	 */
	function getCombinedMergeItems(): { items: LineItem[]; subtotal: number } {
		let combinedItems: LineItem[] = [];
		let itemIndex = 0;

		for (const sel of mergeSourceSelections) {
			if (sel.selectedDoc?.lineItems) {
				for (const item of sel.selectedDoc.lineItems) {
					const quantity =
						typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 1;
					const total = typeof item.total === 'number' && !isNaN(item.total) ? item.total : 0;
					const rate =
						typeof item.rate === 'number' && !isNaN(item.rate) ? item.rate : total / quantity;

					combinedItems.push({
						id: `item-${Date.now()}-${itemIndex++}`,
						description: item.description || '',
						quantity,
						unit: item.unit || 'unit',
						rate: isNaN(rate) ? 0 : rate,
						total
					});
				}
			}
		}

		const subtotal = combinedItems.reduce((sum, item) => sum + item.total, 0);
		return { items: combinedItems, subtotal };
	}

	return {
		get mergeData() {
			return mergeData;
		},
		set mergeData(v) {
			mergeData = v;
		},
		get mergeSourceSelections() {
			return mergeSourceSelections;
		},
		set mergeSourceSelections(v) {
			mergeSourceSelections = v;
		},
		get showMergeSelection() {
			return showMergeSelection;
		},
		set showMergeSelection(v) {
			showMergeSelection = v;
		},
		get allMergeSourcesSelected() {
			return allMergeSourcesSelected;
		},
		searchMergeSourceDocuments,
		selectMergeSourceDocument,
		getCombinedMergeItems
	};
}
