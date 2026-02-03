<script lang="ts">
	import type { MeasurementType } from '$lib/parsing/types';
	import { renderDocumentBody, getTemplateStyles } from '$lib/templates/render';
	import type { DocumentSourceData } from '$lib/templates/types';

	/**
	 * Document data interface for the component props
	 * This maintains backward compatibility with existing usage
	 */
	export interface DocumentData {
		documentType: string;
		documentNumber: string;
		client: {
			name: string;
			email?: string;
			phone?: string;
			address?: string;
		};
		from: {
			name?: string;
			businessName?: string;
			email?: string;
			phone?: string;
			address?: string;
		};
		lineItems: Array<{
			description: string;
			quantity?: number;
			unit: string;
			rate?: number;
			total: number;
			measurementType?: MeasurementType;
			dimensions?: string;
		}>;
		subtotal: number;
		taxRate: number;
		taxAmount: number;
		total: number;
		date: string;
		dueDate?: string;
		paymentTerms?: string;
		notes?: string;
		terms?: string;
		amountDue?: number;
	}

	let { document, forPdf = false }: { document: DocumentData; forPdf?: boolean } = $props();

	// Transform DocumentData to DocumentSourceData format
	const sourceData = $derived<DocumentSourceData>({
		documentType: document.documentType,
		documentNumber: document.documentNumber,
		client: {
			name: document.client.name,
			email: document.client.email,
			phone: document.client.phone,
			address: document.client.address
		},
		from: {
			name: document.from.name,
			businessName: document.from.businessName,
			email: document.from.email,
			phone: document.from.phone,
			address: document.from.address
		},
		lineItems: document.lineItems.map((item) => ({
			description: item.description,
			quantity: item.quantity,
			unit: item.unit,
			rate: item.rate,
			total: item.total,
			measurementType: item.measurementType,
			dimensions: item.dimensions
		})),
		subtotal: document.subtotal,
		taxRate: document.taxRate,
		taxAmount: document.taxAmount,
		total: document.total,
		date: document.date,
		dueDate: document.dueDate,
		paymentTerms: document.paymentTerms,
		notes: document.notes,
		terms: document.terms,
		amountDue: document.amountDue
	});

	// Render the HTML using the shared template
	const renderedHTML = $derived(renderDocumentBody(sourceData, { forPdf }));
</script>

<!-- Inject the template styles -->
<svelte:head>
	{@html `<style>${getTemplateStyles()}</style>`}
</svelte:head>

<!-- Render the document body -->
{@html renderedHTML}
