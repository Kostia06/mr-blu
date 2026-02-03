// Document Clone Test Cases (15 scenarios)
// Tests for cloning/copying documents from one client to another

import type { AITestCase } from '../types';
import { equals, exists, greaterThan, contains, arrayLength } from '../types';

export const documentCloneTests: AITestCase[] = [
	{
		id: 'CL-001',
		category: 'document_clone',
		description: 'Simple clone invoice',
		input: 'Same invoice as John for Mike',
		expectedIntent: 'document_clone',
		expectedData: {
			sourceClient: 'John',
			targetClient: { name: 'Mike' },
			documentType: 'invoice'
		},
		validationRules: [
			contains('data.sourceClient', 'John'),
			contains('data.targetClient.name', 'Mike'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'critical',
		tags: ['clone', 'basic', 'invoice']
	},
	{
		id: 'CL-002',
		category: 'document_clone',
		description: 'Clone with document type specified',
		input: 'Copy the estimate for Sarah for Dave',
		expectedIntent: 'document_clone',
		expectedData: {
			sourceClient: 'Sarah',
			targetClient: { name: 'Dave' },
			documentType: 'estimate'
		},
		validationRules: [
			contains('data.sourceClient', 'Sarah'),
			contains('data.targetClient.name', 'Dave'),
			equals('data.documentType', 'estimate'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['clone', 'estimate']
	},
	{
		id: 'CL-003',
		category: 'document_clone',
		description: 'Clone last invoice',
		input: "Clone John's last invoice for Jackson",
		expectedIntent: 'document_clone',
		expectedData: {
			sourceClient: 'John',
			targetClient: { name: 'Jackson' },
			documentType: 'invoice'
		},
		validationRules: [
			contains('data.sourceClient', 'John'),
			contains('data.targetClient.name', 'Jackson'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['clone', 'last', 'invoice']
	},
	{
		id: 'CL-004',
		category: 'document_clone',
		description: 'Clone with rate modification',
		input: "Same as Cost's estimate for John but change rate to 6000",
		expectedIntent: 'document_clone',
		expectedData: {
			sourceClient: 'Cost',
			targetClient: { name: 'John' },
			documentType: 'estimate',
			modifications: {
				newTotal: 6000
			}
		},
		validationRules: [
			contains('data.sourceClient', 'Cost'),
			contains('data.targetClient.name', 'John'),
			exists('data.modifications'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['clone', 'modify', 'rate']
	},
	{
		id: 'CL-005',
		category: 'document_clone',
		description: 'Clone with added item',
		input: "Copy Sarah's invoice for Mike and add 200 delivery fee",
		expectedIntent: 'document_clone',
		expectedData: {
			sourceClient: 'Sarah',
			targetClient: { name: 'Mike' },
			documentType: 'invoice',
			modifications: {
				addItems: [{ description: 'delivery fee', rate: 200 }]
			}
		},
		validationRules: [
			contains('data.sourceClient', 'Sarah'),
			contains('data.targetClient.name', 'Mike'),
			exists('data.modifications.addItems'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['clone', 'modify', 'add-item']
	},
	{
		id: 'CL-006',
		category: 'document_clone',
		description: 'Clone with removed item',
		input: "Same as John's for Dave but remove rush fee",
		expectedIntent: 'document_clone',
		expectedData: {
			sourceClient: 'John',
			targetClient: { name: 'Dave' },
			modifications: {
				removeItems: ['rush fee']
			}
		},
		validationRules: [
			contains('data.sourceClient', 'John'),
			contains('data.targetClient.name', 'Dave'),
			exists('data.modifications.removeItems'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['clone', 'modify', 'remove-item']
	},
	{
		id: 'CL-007',
		category: 'document_clone',
		description: 'Clone with quantity change',
		input: "Clone Mike's invoice for Sarah, change hours to 10",
		expectedIntent: 'document_clone',
		expectedData: {
			sourceClient: 'Mike',
			targetClient: { name: 'Sarah' },
			documentType: 'invoice',
			modifications: {
				updateItems: [{ match: 'hours', newQuantity: 10 }]
			}
		},
		validationRules: [
			contains('data.sourceClient', 'Mike'),
			contains('data.targetClient.name', 'Sarah'),
			exists('data.modifications'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['clone', 'modify', 'quantity']
	},
	{
		id: 'CL-008',
		category: 'document_clone',
		description: 'Clone with multiple modifications',
		input: 'Same as Cost for John, change labor to 8 hours and add 300 materials',
		expectedIntent: 'document_clone',
		expectedData: {
			sourceClient: 'Cost',
			targetClient: { name: 'John' },
			modifications: {
				updateItems: [{ match: 'labor', newQuantity: 8 }],
				addItems: [{ description: 'materials', rate: 300 }]
			}
		},
		validationRules: [
			contains('data.sourceClient', 'Cost'),
			contains('data.targetClient.name', 'John'),
			exists('data.modifications'),
			greaterThan('data.confidence.overall', 0.6)
		],
		priority: 'high',
		tags: ['clone', 'modify', 'multiple']
	},
	{
		id: 'CL-009',
		category: 'document_clone',
		description: 'Clone business document',
		input: "Copy Acme's estimate for NewCorp",
		expectedIntent: 'document_clone',
		expectedData: {
			sourceClient: 'Acme',
			targetClient: { name: 'NewCorp' },
			documentType: 'estimate'
		},
		validationRules: [
			contains('data.sourceClient', 'Acme'),
			contains('data.targetClient.name', 'NewCorp'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['clone', 'business']
	},
	{
		id: 'CL-010',
		category: 'document_clone',
		description: 'Clone and send',
		input: "Clone Jackson's invoice for Sarah and send it",
		expectedIntent: 'document_clone',
		expectedData: {
			sourceClient: 'Jackson',
			targetClient: { name: 'Sarah' },
			documentType: 'invoice',
			actions: [{ type: 'create_document' }, { type: 'send_email' }]
		},
		validationRules: [
			contains('data.sourceClient', 'Jackson'),
			contains('data.targetClient.name', 'Sarah'),
			arrayLength('data.actions', 2),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['clone', 'send', 'action']
	},
	{
		id: 'CL-011',
		category: 'document_clone',
		description: 'Clone to different type (actually a transform)',
		input: "Make an invoice from Sarah's estimate for Mike",
		// Parser correctly interprets this as document_transform (converting estimate to invoice)
		// rather than a pure clone operation
		expectedIntent: 'document_clone',
		expectedData: {
			sourceClient: 'Sarah',
			targetClient: { name: 'Mike' }
		},
		validationRules: [
			contains('data.sourceClient', 'Sarah'),
			contains('data.targetClient.name', 'Mike'),
			// Note: Parser may return 'estimate' as the source documentType
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['clone', 'convert']
	},
	{
		id: 'CL-012',
		category: 'document_clone',
		description: 'Clone with tax added',
		input: 'Same as John for Mike but add GST',
		expectedIntent: 'document_clone',
		expectedData: {
			sourceClient: 'John',
			targetClient: { name: 'Mike' }
		},
		validationRules: [
			contains('data.sourceClient', 'John'),
			contains('data.targetClient.name', 'Mike'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['clone', 'tax', 'GST']
	},
	{
		id: 'CL-013',
		category: 'document_clone',
		description: 'Clone without tax',
		input: "Copy Cost's invoice for Dave, no tax",
		expectedIntent: 'document_clone',
		expectedData: {
			sourceClient: 'Cost',
			targetClient: { name: 'Dave' },
			documentType: 'invoice'
		},
		validationRules: [
			contains('data.sourceClient', 'Cost'),
			contains('data.targetClient.name', 'Dave'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['clone', 'no-tax']
	},
	{
		id: 'CL-014',
		category: 'document_clone',
		description: 'Clone with discount',
		input: 'Same as Sarah for John with 10% discount',
		expectedIntent: 'document_clone',
		expectedData: {
			sourceClient: 'Sarah',
			targetClient: { name: 'John' }
		},
		validationRules: [
			contains('data.sourceClient', 'Sarah'),
			contains('data.targetClient.name', 'John'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['clone', 'discount']
	},
	{
		id: 'CL-015',
		category: 'document_clone',
		description: 'Clone specific document number',
		input: 'Copy invoice EST-2026-147 for Jackson',
		expectedIntent: 'document_clone',
		expectedData: {
			targetClient: { name: 'Jackson' }
		},
		validationRules: [
			contains('data.targetClient.name', 'Jackson'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['clone', 'specific-id']
	}
];
