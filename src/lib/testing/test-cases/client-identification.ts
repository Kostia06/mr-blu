// Client Identification Test Cases (10 scenarios)
// Tests for client name parsing and matching

import type { AITestCase } from '../types';
import { equals, exists, greaterThan, contains } from '../types';

export const clientIdentificationTests: AITestCase[] = [
	{
		id: 'CI-001',
		category: 'client_identification',
		description: 'First name only',
		input: 'Invoice for Mike, 500 dollars',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Mike', firstName: 'Mike' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Mike'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'critical',
		tags: ['client', 'first-name']
	},
	{
		id: 'CI-002',
		category: 'client_identification',
		description: 'Full name (first and last)',
		input: 'Invoice for Michael Johnson, 500 dollars',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Michael Johnson', firstName: 'Michael', lastName: 'Johnson' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Michael'),
			contains('data.client.name', 'Johnson'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'critical',
		tags: ['client', 'full-name']
	},
	{
		id: 'CI-003',
		category: 'client_identification',
		description: 'Business name',
		input: 'Invoice for Acme Construction, 5000 dollars',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Acme Construction' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Acme'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['client', 'business']
	},
	{
		id: 'CI-004',
		category: 'client_identification',
		description: 'Client with email',
		input: 'Invoice for John, email john@email.com, 800 dollars',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'John', email: 'john@email.com' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'John'),
			equals('data.client.email', 'john@email.com'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['client', 'email']
	},
	{
		id: 'CI-005',
		category: 'client_identification',
		description: 'Client with phone number',
		input: 'Invoice for Sarah, phone 555-123-4567, 600 dollars',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Sarah', phone: '555-123-4567' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Sarah'),
			exists('data.client.phone'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['client', 'phone']
	},
	{
		id: 'CI-006',
		category: 'client_identification',
		description: 'Client with address',
		input: 'Invoice for Mike at 456 Oak Street, 1200 dollars',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Mike', address: '456 Oak Street' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Mike'),
			exists('data.client.address'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['client', 'address']
	},
	{
		id: 'CI-007',
		category: 'client_identification',
		description: 'Phonetic/spelling variation',
		input: 'Invoice for Johnathen, 500 dollars',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Johnathen' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			exists('data.client.name'),
			greaterThan('data.confidence.overall', 0.6)
		],
		priority: 'medium',
		tags: ['client', 'phonetic', 'spelling']
	},
	{
		id: 'CI-008',
		category: 'client_identification',
		description: 'Partial business name match',
		input: 'Invoice for Cost, 3000 dollars',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Cost' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Cost'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['client', 'partial', 'business']
	},
	{
		id: 'CI-009',
		category: 'client_identification',
		description: 'New client with full details',
		input: 'Invoice for brand new client Robert Brown, 900 dollars',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Robert Brown', firstName: 'Robert', lastName: 'Brown' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Robert'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['client', 'new', 'full-name']
	},
	{
		id: 'CI-010',
		category: 'client_identification',
		description: 'Ambiguous first name only',
		input: 'Invoice for John, 1000 dollars',
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
		tags: ['client', 'ambiguous']
	}
];
