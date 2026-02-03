// Tax Handling Test Cases (15 scenarios)
// Tests for tax-related voice commands and regional presets

import type { AITestCase } from '../types';
import { equals, exists, greaterThan, contains, approxEquals } from '../types';

export const taxHandlingTests: AITestCase[] = [
	{
		id: 'TX-001',
		category: 'tax_handling',
		description: 'GST only (5%)',
		input: 'Invoice for Mike, 1000 plus GST',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Mike' },
			taxRate: 5
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Mike'),
			equals('data.taxRate', 5),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'critical',
		tags: ['tax', 'GST', 'federal']
	},
	{
		id: 'TX-002',
		category: 'tax_handling',
		description: 'HST Ontario (13%)',
		input: 'Invoice for John, 2000 with Ontario tax',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'John' },
			taxRate: 13
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'John'),
			equals('data.taxRate', 13),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'critical',
		tags: ['tax', 'HST', 'Ontario']
	},
	{
		id: 'TX-003',
		category: 'tax_handling',
		description: 'BC taxes (GST + PST = 12%)',
		input: 'Invoice for Sarah, 1500 with BC taxes',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Sarah' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Sarah'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'critical',
		tags: ['tax', 'GST', 'PST', 'BC', 'multi-tax']
	},
	{
		id: 'TX-004',
		category: 'tax_handling',
		description: 'Quebec taxes (GST + QST)',
		input: 'Facture pour Jean, 3000 avec TPS et TVQ',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Jean' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Jean'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['tax', 'GST', 'QST', 'Quebec', 'french']
	},
	{
		id: 'TX-005',
		category: 'tax_handling',
		description: 'Custom tax rate (8%)',
		input: 'Invoice for Cost, 5000 plus 8% tax',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Cost' },
			taxRate: 8
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Cost'),
			equals('data.taxRate', 8),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['tax', 'custom', 'percentage']
	},
	{
		id: 'TX-006',
		category: 'tax_handling',
		description: 'Explicit GST and PST',
		input: 'Invoice for Mike, 2000 plus GST and PST',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Mike' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Mike'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['tax', 'GST', 'PST', 'explicit']
	},
	{
		id: 'TX-007',
		category: 'tax_handling',
		description: 'No tax',
		input: 'Invoice for Jackson, 1000 no tax',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Jackson' },
			taxRate: 0
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Jackson'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['tax', 'no-tax', 'zero']
	},
	{
		id: 'TX-008',
		category: 'tax_handling',
		description: 'Tax exempt',
		input: 'Invoice for Sarah, tax exempt, 800',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Sarah' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Sarah'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['tax', 'exempt']
	},
	{
		id: 'TX-009',
		category: 'tax_handling',
		description: 'First Nations exemption',
		input: 'Invoice for John, first nations exemption, 1500',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'John' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'John'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['tax', 'exempt', 'first-nations']
	},
	{
		id: 'TX-010',
		category: 'tax_handling',
		description: 'Prices include tax (inclusive)',
		input: 'Invoice for Mike, 1130 price includes tax',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Mike' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Mike'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['tax', 'inclusive']
	},
	{
		id: 'TX-011',
		category: 'tax_handling',
		description: 'Alberta default (GST only)',
		input: 'Invoice for Cost in Alberta, 2500',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Cost' },
			taxRate: 5
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Cost'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['tax', 'GST', 'Alberta', 'regional']
	},
	{
		id: 'TX-012',
		category: 'tax_handling',
		description: 'Manitoba taxes',
		input: 'Invoice for Dave, Manitoba, 3000',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Dave' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Dave'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['tax', 'GST', 'PST', 'Manitoba', 'regional']
	},
	{
		id: 'TX-013',
		category: 'tax_handling',
		description: 'Mixed tax on items',
		input: 'Invoice: labor 500 no tax, materials 200 plus GST',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice'
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			greaterThan('data.confidence.overall', 0.6)
		],
		priority: 'low',
		tags: ['tax', 'item-level', 'mixed']
	},
	{
		id: 'TX-014',
		category: 'tax_handling',
		description: 'Specific HST rate (15%)',
		input: 'Invoice for John, 2000 with 15% HST',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'John' },
			taxRate: 15
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'John'),
			equals('data.taxRate', 15),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['tax', 'HST', 'atlantic']
	},
	{
		id: 'TX-015',
		category: 'tax_handling',
		description: 'Add tax to existing',
		input: "Update Mike's invoice to add GST",
		// Parser interprets "update" as a transform operation (modifying existing document)
		expectedIntent: 'document_transform',
		expectedData: {
			source: { clientName: 'Mike' }
		},
		validationRules: [
			// Parser should identify Mike as the source client
			greaterThan('data.confidence.overall', 0.5)
		],
		priority: 'low',
		tags: ['tax', 'update', 'add', 'transform']
	}
];
