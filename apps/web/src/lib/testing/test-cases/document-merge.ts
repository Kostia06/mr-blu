// Document Merge Test Cases (10 scenarios)
// Tests for merging/combining documents from multiple clients

import type { AITestCase } from '../types';
import { equals, exists, greaterThan, contains, arrayLength } from '../types';

export const documentMergeTests: AITestCase[] = [
	{
		id: 'MG-001',
		category: 'document_merge',
		description: 'Merge two source documents',
		input: "Combine John's and Sarah's estimates for Mike",
		expectedIntent: 'document_merge',
		expectedData: {
			sourceClients: ['John', 'Sarah'],
			targetClient: { name: 'Mike' },
			documentType: 'estimate'
		},
		validationRules: [
			arrayLength('data.sourceClients', 2),
			contains('data.targetClient.name', 'Mike'),
			equals('data.documentType', 'estimate'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'critical',
		tags: ['merge', 'two-sources', 'estimate']
	},
	{
		id: 'MG-002',
		category: 'document_merge',
		description: 'Merge three source documents',
		input: "Merge Cost, John, and Dave's invoices for Jackson",
		expectedIntent: 'document_merge',
		expectedData: {
			sourceClients: ['Cost', 'John', 'Dave'],
			targetClient: { name: 'Jackson' },
			documentType: 'invoice'
		},
		validationRules: [
			arrayLength('data.sourceClients', 3),
			contains('data.targetClient.name', 'Jackson'),
			equals('data.documentType', 'invoice'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['merge', 'three-sources', 'invoice']
	},
	{
		id: 'MG-003',
		category: 'document_merge',
		description: 'Merge specific document type',
		input: 'Merge the estimates from Mike and Sarah for Cost Corp',
		expectedIntent: 'document_merge',
		expectedData: {
			sourceClients: ['Mike', 'Sarah'],
			targetClient: { name: 'Cost Corp' },
			documentType: 'estimate'
		},
		validationRules: [
			arrayLength('data.sourceClients', 2),
			contains('data.targetClient.name', 'Cost'),
			equals('data.documentType', 'estimate'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['merge', 'estimate', 'business']
	},
	{
		id: 'MG-004',
		category: 'document_merge',
		description: 'Merge for new client',
		input: "Combine John's and Cost's items for new client Robert",
		expectedIntent: 'document_merge',
		expectedData: {
			sourceClients: ['John', 'Cost'],
			targetClient: { name: 'Robert' }
		},
		validationRules: [
			arrayLength('data.sourceClients', 2),
			contains('data.targetClient.name', 'Robert'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['merge', 'new-client']
	},
	{
		id: 'MG-005',
		category: 'document_merge',
		description: 'Merge with additional item',
		input: 'Merge Mike and Sarah for John and add 500 coordination fee',
		expectedIntent: 'document_merge',
		expectedData: {
			sourceClients: ['Mike', 'Sarah'],
			targetClient: { name: 'John' }
		},
		validationRules: [
			arrayLength('data.sourceClients', 2),
			contains('data.targetClient.name', 'John'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['merge', 'add-item']
	},
	{
		id: 'MG-006',
		category: 'document_merge',
		description: 'Merge business documents',
		input: 'Combine Acme and Beta Corp estimates for NewCorp',
		expectedIntent: 'document_merge',
		expectedData: {
			sourceClients: ['Acme', 'Beta Corp'],
			targetClient: { name: 'NewCorp' },
			documentType: 'estimate'
		},
		validationRules: [
			arrayLength('data.sourceClients', 2),
			contains('data.targetClient.name', 'NewCorp'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['merge', 'business']
	},
	{
		id: 'MG-007',
		category: 'document_merge',
		description: 'Merge last documents',
		input: 'Merge last invoices from John and Mike for Dave',
		expectedIntent: 'document_merge',
		expectedData: {
			sourceClients: ['John', 'Mike'],
			targetClient: { name: 'Dave' },
			documentType: 'invoice'
		},
		validationRules: [
			arrayLength('data.sourceClients', 2),
			contains('data.targetClient.name', 'Dave'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['merge', 'last', 'invoice']
	},
	{
		id: 'MG-008',
		category: 'document_merge',
		description: 'Merge mixed document types',
		input: "Combine John's invoice and Sarah's estimate for Cost",
		expectedIntent: 'document_merge',
		expectedData: {
			sourceClients: ['John', 'Sarah'],
			targetClient: { name: 'Cost' }
		},
		validationRules: [
			arrayLength('data.sourceClients', 2),
			contains('data.targetClient.name', 'Cost'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['merge', 'mixed-types']
	},
	{
		id: 'MG-009',
		category: 'document_merge',
		description: 'Merge and send',
		input: "Merge Cost and John's estimates for Jackson and email it",
		expectedIntent: 'document_merge',
		expectedData: {
			sourceClients: ['Cost', 'John'],
			targetClient: { name: 'Jackson' },
			documentType: 'estimate',
			actions: [{ type: 'create_document' }, { type: 'send_email' }]
		},
		validationRules: [
			arrayLength('data.sourceClients', 2),
			contains('data.targetClient.name', 'Jackson'),
			arrayLength('data.actions', 2),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['merge', 'send', 'action']
	},
	{
		id: 'MG-010',
		category: 'document_merge',
		description: 'Merge specific document numbers',
		input: 'Combine EST-001 and EST-002 for Mike',
		expectedIntent: 'document_merge',
		expectedData: {
			targetClient: { name: 'Mike' }
		},
		validationRules: [
			contains('data.targetClient.name', 'Mike'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'low',
		tags: ['merge', 'specific-id']
	}
];
