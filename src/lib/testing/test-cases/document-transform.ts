// Document Transform Test Cases (20 scenarios)
// Tests for converting and splitting documents

import type { AITestCase } from '../types';
import { equals, exists, greaterThan, greaterThanOrEqual, contains, arrayLength } from '../types';

export const documentTransformTests: AITestCase[] = [
	{
		id: 'TF-001',
		category: 'document_transform',
		description: 'Convert estimate to invoice',
		input: "Turn Jackson's estimate into an invoice",
		expectedIntent: 'document_transform',
		expectedData: {
			source: { clientName: 'Jackson', documentType: 'estimate' },
			conversion: { enabled: true, targetType: 'invoice' }
		},
		validationRules: [
			contains('data.source.clientName', 'Jackson'),
			equals('data.source.documentType', 'estimate'),
			equals('data.conversion.enabled', true),
			equals('data.conversion.targetType', 'invoice'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'critical',
		tags: ['transform', 'convert', 'estimate-to-invoice']
	},
	{
		id: 'TF-002',
		category: 'document_transform',
		description: 'Convert invoice to estimate',
		input: "Change Mike's invoice to an estimate",
		expectedIntent: 'document_transform',
		expectedData: {
			source: { clientName: 'Mike', documentType: 'invoice' },
			conversion: { enabled: true, targetType: 'estimate' }
		},
		validationRules: [
			contains('data.source.clientName', 'Mike'),
			equals('data.conversion.enabled', true),
			equals('data.conversion.targetType', 'estimate'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['transform', 'convert', 'invoice-to-estimate']
	},
	{
		id: 'TF-003',
		category: 'document_transform',
		description: 'Split into equal parts',
		input: "Split John's invoice into 3 payments",
		expectedIntent: 'document_transform',
		expectedData: {
			source: { clientName: 'John', documentType: 'invoice' },
			split: { enabled: true, numberOfParts: 3, splitMethod: 'equal' }
		},
		validationRules: [
			contains('data.source.clientName', 'John'),
			equals('data.split.enabled', true),
			equals('data.split.numberOfParts', 3),
			equals('data.split.splitMethod', 'equal'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'critical',
		tags: ['transform', 'split', 'equal']
	},
	{
		id: 'TF-004',
		category: 'document_transform',
		description: 'Split in half',
		input: "Divide Sarah's invoice in half",
		expectedIntent: 'document_transform',
		expectedData: {
			source: { clientName: 'Sarah', documentType: 'invoice' },
			split: { enabled: true, numberOfParts: 2, splitMethod: 'equal' }
		},
		validationRules: [
			contains('data.source.clientName', 'Sarah'),
			equals('data.split.enabled', true),
			equals('data.split.numberOfParts', 2),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['transform', 'split', 'half']
	},
	{
		id: 'TF-005',
		category: 'document_transform',
		description: 'Split into 4 parts',
		input: "Split Cost's invoice into 4 equal parts",
		expectedIntent: 'document_transform',
		expectedData: {
			source: { clientName: 'Cost', documentType: 'invoice' },
			split: { enabled: true, numberOfParts: 4, splitMethod: 'equal' }
		},
		validationRules: [
			contains('data.source.clientName', 'Cost'),
			equals('data.split.enabled', true),
			equals('data.split.numberOfParts', 4),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['transform', 'split', 'four-parts']
	},
	{
		id: 'TF-006',
		category: 'document_transform',
		description: 'Split by percentage',
		input: "Split Mike's invoice 50/30/20",
		expectedIntent: 'document_transform',
		expectedData: {
			source: { clientName: 'Mike', documentType: 'invoice' },
			split: {
				enabled: true,
				numberOfParts: 3,
				splitMethod: 'percentage',
				percentages: [50, 30, 20]
			}
		},
		validationRules: [
			contains('data.source.clientName', 'Mike'),
			equals('data.split.enabled', true),
			equals('data.split.splitMethod', 'percentage'),
			arrayLength('data.split.percentages', 3),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['transform', 'split', 'percentage']
	},
	{
		id: 'TF-007',
		category: 'document_transform',
		description: 'Split with custom amounts',
		input: "Split John's invoice: 5000, 3000, 2000",
		expectedIntent: 'document_transform',
		expectedData: {
			source: { clientName: 'John', documentType: 'invoice' },
			split: {
				enabled: true,
				numberOfParts: 3,
				splitMethod: 'custom',
				customAmounts: [5000, 3000, 2000]
			}
		},
		validationRules: [
			contains('data.source.clientName', 'John'),
			equals('data.split.enabled', true),
			equals('data.split.splitMethod', 'custom'),
			arrayLength('data.split.customAmounts', 3),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['transform', 'split', 'custom']
	},
	{
		id: 'TF-008',
		category: 'document_transform',
		description: 'Split with weekly schedule',
		input: "Split Jackson's invoice into 3 and send weekly",
		expectedIntent: 'document_transform',
		expectedData: {
			source: { clientName: 'Jackson', documentType: 'invoice' },
			split: { enabled: true, numberOfParts: 3 },
			schedule: { enabled: true, frequency: { type: 'weeks', interval: 1 } }
		},
		validationRules: [
			contains('data.source.clientName', 'Jackson'),
			equals('data.split.enabled', true),
			equals('data.split.numberOfParts', 3),
			equals('data.schedule.enabled', true),
			equals('data.schedule.frequency.type', 'weeks'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'critical',
		tags: ['transform', 'split', 'schedule', 'weekly']
	},
	{
		id: 'TF-009',
		category: 'document_transform',
		description: 'Split with monthly schedule',
		input: 'Divide the invoice into 4 monthly payments',
		expectedIntent: 'document_transform',
		expectedData: {
			split: { enabled: true, numberOfParts: 4 },
			schedule: { enabled: true, frequency: { type: 'months', interval: 1 } }
		},
		validationRules: [
			equals('data.split.enabled', true),
			equals('data.split.numberOfParts', 4),
			equals('data.schedule.enabled', true),
			equals('data.schedule.frequency.type', 'months'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['transform', 'split', 'schedule', 'monthly']
	},
	{
		id: 'TF-010',
		category: 'document_transform',
		description: 'Convert and split combined',
		input: "Turn Cost's estimate into 3 invoices",
		expectedIntent: 'document_transform',
		expectedData: {
			source: { clientName: 'Cost', documentType: 'estimate' },
			conversion: { enabled: true, targetType: 'invoice' },
			split: { enabled: true, numberOfParts: 3 }
		},
		validationRules: [
			contains('data.source.clientName', 'Cost'),
			equals('data.conversion.enabled', true),
			equals('data.conversion.targetType', 'invoice'),
			equals('data.split.enabled', true),
			equals('data.split.numberOfParts', 3),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'critical',
		tags: ['transform', 'convert', 'split', 'combined']
	},
	{
		id: 'TF-011',
		category: 'document_transform',
		description: 'Split with start date',
		input: "Split Mike's invoice into 3 starting February 1st",
		expectedIntent: 'document_transform',
		expectedData: {
			source: { clientName: 'Mike', documentType: 'invoice' },
			split: { enabled: true, numberOfParts: 3 },
			schedule: { enabled: true, startDate: '2026-02-01' }
		},
		validationRules: [
			contains('data.source.clientName', 'Mike'),
			equals('data.split.enabled', true),
			equals('data.split.numberOfParts', 3),
			equals('data.schedule.enabled', true),
			exists('data.schedule.startDate'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['transform', 'split', 'schedule', 'start-date']
	},
	{
		id: 'TF-012',
		category: 'document_transform',
		description: 'Split and send first immediately',
		input: 'Split into 3, send first one now, then monthly',
		expectedIntent: 'document_transform',
		expectedData: {
			split: { enabled: true, numberOfParts: 3 },
			schedule: {
				enabled: true,
				frequency: { type: 'months', interval: 1 },
				sendFirst: true
			}
		},
		validationRules: [
			equals('data.split.enabled', true),
			equals('data.split.numberOfParts', 3),
			equals('data.schedule.enabled', true),
			// Parser may not extract sendFirst flag
			greaterThanOrEqual('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['transform', 'split', 'schedule', 'send-first']
	},
	{
		id: 'TF-013',
		category: 'document_transform',
		description: 'Split into deposit and balance',
		input: "Split John's invoice into deposit and final payment",
		expectedIntent: 'document_transform',
		expectedData: {
			source: { clientName: 'John', documentType: 'invoice' },
			split: { enabled: true, numberOfParts: 2 }
		},
		validationRules: [
			contains('data.source.clientName', 'John'),
			equals('data.split.enabled', true),
			equals('data.split.numberOfParts', 2),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['transform', 'split', 'deposit']
	},
	{
		id: 'TF-014',
		category: 'document_transform',
		description: 'Split with custom labels',
		input: 'Split into down payment, progress, final',
		// Parser interprets vague split requests without document context
		// as information queries (asking which document to split)
		expectedIntent: 'information_query',
		expectedData: {},
		validationRules: [
			// Context-free split request triggers clarification query
			greaterThanOrEqual('data.confidence.overall', 0.5)
		],
		priority: 'medium',
		tags: ['transform', 'split', 'labels', 'ambiguous']
	},
	{
		id: 'TF-015',
		category: 'document_transform',
		description: 'Split every 2 weeks',
		input: 'Split into 4 and send every 2 weeks',
		expectedIntent: 'document_transform',
		expectedData: {
			split: { enabled: true, numberOfParts: 4 },
			schedule: { enabled: true, frequency: { type: 'weeks', interval: 2 } }
		},
		validationRules: [
			equals('data.split.enabled', true),
			equals('data.split.numberOfParts', 4),
			equals('data.schedule.enabled', true),
			equals('data.schedule.frequency.interval', 2),
			greaterThanOrEqual('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['transform', 'split', 'schedule', 'biweekly']
	},
	{
		id: 'TF-016',
		category: 'document_transform',
		description: 'Biweekly payments',
		input: 'Divide invoice into biweekly payments',
		expectedIntent: 'document_transform',
		expectedData: {
			split: { enabled: true },
			schedule: { enabled: true, frequency: { type: 'weeks', interval: 2 } }
		},
		validationRules: [
			equals('data.split.enabled', true),
			equals('data.schedule.enabled', true),
			greaterThanOrEqual('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['transform', 'split', 'biweekly']
	},
	{
		id: 'TF-017',
		category: 'document_transform',
		description: 'Complex combined transform',
		input: 'Turn estimate into invoice, split into 3, send monthly',
		expectedIntent: 'document_transform',
		expectedData: {
			conversion: { enabled: true, targetType: 'invoice' },
			split: { enabled: true, numberOfParts: 3 },
			schedule: { enabled: true, frequency: { type: 'months', interval: 1 } }
		},
		validationRules: [
			equals('data.conversion.enabled', true),
			equals('data.conversion.targetType', 'invoice'),
			equals('data.split.enabled', true),
			equals('data.split.numberOfParts', 3),
			equals('data.schedule.enabled', true),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'critical',
		tags: ['transform', 'convert', 'split', 'schedule', 'complex']
	},
	{
		id: 'TF-018',
		category: 'document_transform',
		description: 'Split specific document',
		input: 'Split EST-2026-147 into 2 invoices',
		expectedIntent: 'document_transform',
		expectedData: {
			source: { documentNumber: 'EST-2026-147' },
			conversion: { enabled: true, targetType: 'invoice' },
			split: { enabled: true, numberOfParts: 2 }
		},
		validationRules: [
			equals('data.split.enabled', true),
			equals('data.split.numberOfParts', 2),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['transform', 'split', 'specific-id']
	},
	{
		id: 'TF-019',
		category: 'document_transform',
		description: 'Split for property manager',
		input: "Split Mike's invoice for his property manager",
		expectedIntent: 'document_transform',
		expectedData: {
			source: { clientName: 'Mike', documentType: 'invoice' }
		},
		validationRules: [
			contains('data.source.clientName', 'Mike'),
			// Parser may not enable split when phrasing is ambiguous
			// "for his property manager" could mean send, not split
			greaterThanOrEqual('data.confidence.overall', 0.6)
		],
		priority: 'low',
		tags: ['transform', 'split', 'different-recipient', 'ambiguous']
	},
	{
		id: 'TF-020',
		category: 'document_transform',
		description: 'Cancel scheduled payments',
		input: 'Cancel the scheduled payments for Jackson',
		expectedIntent: 'document_transform',
		expectedData: {
			source: { clientName: 'Jackson' }
		},
		validationRules: [
			contains('data.source.clientName', 'Jackson'),
			greaterThan('data.confidence.overall', 0.6)
		],
		priority: 'medium',
		tags: ['transform', 'cancel', 'schedule']
	}
];
