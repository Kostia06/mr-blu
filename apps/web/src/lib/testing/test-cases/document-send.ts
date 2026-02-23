// Document Send Test Cases (15 scenarios)
// Tests for finding and sending existing documents

import type { AITestCase } from '../types';
import { equals, exists, greaterThan, contains } from '../types';

export const documentSendTests: AITestCase[] = [
	{
		id: 'DS-001',
		category: 'document_send',
		description: 'Simple email send',
		input: 'Send the invoice to John',
		expectedIntent: 'document_send',
		expectedData: {
			clientName: 'John',
			documentType: 'invoice',
			deliveryMethod: 'email'
		},
		validationRules: [
			contains('data.clientName', 'John'),
			equals('data.documentType', 'invoice'),
			equals('data.deliveryMethod', 'email'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'critical',
		tags: ['send', 'email', 'invoice']
	},
	{
		id: 'DS-002',
		category: 'document_send',
		description: 'Send last document',
		input: "Send Jackson's last estimate",
		expectedIntent: 'document_send',
		expectedData: {
			clientName: 'Jackson',
			documentType: 'estimate',
			selector: 'last',
			deliveryMethod: 'email'
		},
		validationRules: [
			contains('data.clientName', 'Jackson'),
			equals('data.documentType', 'estimate'),
			equals('data.selector', 'last'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['send', 'last', 'estimate']
	},
	{
		id: 'DS-003',
		category: 'document_send',
		description: 'Email specific document type',
		input: "Email Mike's invoice",
		expectedIntent: 'document_send',
		expectedData: {
			clientName: 'Mike',
			documentType: 'invoice',
			deliveryMethod: 'email'
		},
		validationRules: [
			contains('data.clientName', 'Mike'),
			equals('data.documentType', 'invoice'),
			equals('data.deliveryMethod', 'email'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['send', 'email', 'invoice']
	},
	{
		id: 'DS-004',
		category: 'document_send',
		description: 'SMS send',
		input: 'Text the invoice to Sarah',
		expectedIntent: 'document_send',
		expectedData: {
			clientName: 'Sarah',
			documentType: 'invoice',
			deliveryMethod: 'sms'
		},
		validationRules: [
			contains('data.clientName', 'Sarah'),
			equals('data.documentType', 'invoice'),
			equals('data.deliveryMethod', 'sms'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['send', 'sms', 'text']
	},
	{
		id: 'DS-005',
		category: 'document_send',
		description: 'WhatsApp send',
		input: "Send Mike's estimate via WhatsApp",
		expectedIntent: 'document_send',
		expectedData: {
			clientName: 'Mike',
			documentType: 'estimate',
			deliveryMethod: 'whatsapp'
		},
		validationRules: [
			contains('data.clientName', 'Mike'),
			equals('data.documentType', 'estimate'),
			equals('data.deliveryMethod', 'whatsapp'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['send', 'whatsapp']
	},
	{
		id: 'DS-006',
		category: 'document_send',
		description: 'Send to specific email',
		input: "Send Jackson's invoice to john@company.com",
		expectedIntent: 'document_send',
		expectedData: {
			clientName: 'Jackson',
			documentType: 'invoice',
			deliveryMethod: 'email',
			recipient: { email: 'john@company.com' }
		},
		validationRules: [
			contains('data.clientName', 'Jackson'),
			equals('data.documentType', 'invoice'),
			equals('data.recipient.email', 'john@company.com'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['send', 'email', 'specific-recipient']
	},
	{
		id: 'DS-007',
		category: 'document_send',
		description: 'Send to another client',
		input: "Send Cost's invoice to Jackson",
		expectedIntent: 'document_send',
		expectedData: {
			clientName: 'Cost',
			documentType: 'invoice',
			deliveryMethod: 'email',
			recipient: { clientName: 'Jackson' }
		},
		validationRules: [
			contains('data.clientName', 'Cost'),
			equals('data.documentType', 'invoice'),
			contains('data.recipient.clientName', 'Jackson'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['send', 'cross-client']
	},
	{
		id: 'DS-008',
		category: 'document_send',
		description: 'Send most recent',
		input: 'Send the most recent estimate for Mike',
		expectedIntent: 'document_send',
		expectedData: {
			clientName: 'Mike',
			documentType: 'estimate',
			selector: 'recent',
			deliveryMethod: 'email'
		},
		validationRules: [
			contains('data.clientName', 'Mike'),
			equals('data.documentType', 'estimate'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['send', 'recent']
	},
	{
		id: 'DS-009',
		category: 'document_send',
		description: 'Send to business',
		input: 'Email the invoice to Acme Corp',
		expectedIntent: 'document_send',
		expectedData: {
			clientName: 'Acme Corp',
			documentType: 'invoice',
			deliveryMethod: 'email'
		},
		validationRules: [
			contains('data.clientName', 'Acme'),
			equals('data.documentType', 'invoice'),
			equals('data.deliveryMethod', 'email'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['send', 'business']
	},
	{
		id: 'DS-010',
		category: 'document_send',
		description: 'Confirm send action',
		input: "Take John's estimate and send it now",
		expectedIntent: 'document_send',
		expectedData: {
			clientName: 'John',
			documentType: 'estimate',
			deliveryMethod: 'email'
		},
		validationRules: [
			contains('data.clientName', 'John'),
			equals('data.documentType', 'estimate'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['send', 'confirm']
	},
	{
		id: 'DS-011',
		category: 'document_send',
		description: 'Re-send document',
		input: 'Re-send the invoice to Sarah',
		expectedIntent: 'document_send',
		expectedData: {
			clientName: 'Sarah',
			documentType: 'invoice',
			deliveryMethod: 'email'
		},
		validationRules: [
			contains('data.clientName', 'Sarah'),
			equals('data.documentType', 'invoice'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['send', 'resend']
	},
	{
		id: 'DS-012',
		category: 'document_send',
		description: 'Send specific invoice number',
		input: 'Send invoice INV-2026-001 to Mike',
		expectedIntent: 'document_send',
		expectedData: {
			clientName: 'Mike',
			documentType: 'invoice',
			deliveryMethod: 'email'
		},
		validationRules: [
			contains('data.clientName', 'Mike'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['send', 'specific-id']
	},
	{
		id: 'DS-013',
		category: 'document_send',
		description: 'Send via multiple methods',
		input: "Send to John's email and phone",
		expectedIntent: 'document_send',
		expectedData: {
			clientName: 'John'
		},
		validationRules: [
			contains('data.clientName', 'John'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'low',
		tags: ['send', 'multi-method']
	},
	{
		id: 'DS-014',
		category: 'document_send',
		description: 'Send with message',
		input: 'Send invoice to Mike with message payment due Friday',
		expectedIntent: 'document_send',
		expectedData: {
			clientName: 'Mike',
			documentType: 'invoice',
			deliveryMethod: 'email'
		},
		validationRules: [
			contains('data.clientName', 'Mike'),
			equals('data.documentType', 'invoice'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['send', 'message']
	},
	{
		id: 'DS-015',
		category: 'document_send',
		description: 'Send to different recipient',
		input: "Email Sarah's invoice to her accountant bob@email.com",
		expectedIntent: 'document_send',
		expectedData: {
			clientName: 'Sarah',
			documentType: 'invoice',
			deliveryMethod: 'email',
			recipient: { email: 'bob@email.com' }
		},
		validationRules: [
			contains('data.clientName', 'Sarah'),
			equals('data.documentType', 'invoice'),
			equals('data.recipient.email', 'bob@email.com'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['send', 'third-party']
	}
];
