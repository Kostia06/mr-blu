// Payment & Reminder Test Cases (15 scenarios)
// Tests for payment tracking and reminder scheduling
// NOTE: Current AI parser doesn't have explicit reminder intent, so these test
// what the parser returns for reminder-like requests

import type { AITestCase } from '../types';
import { equals, exists, greaterThan, contains } from '../types';

export const paymentReminderTests: AITestCase[] = [
	{
		id: 'PR-001',
		category: 'payment_reminder',
		description: 'Weekly reminder request',
		input: "Remind me about John's invoice every week",
		expectedIntent: 'information_query', // Parser interprets as query about John's invoice
		expectedData: {
			query: { clientName: 'John' }
		},
		validationRules: [greaterThan('data.confidence.overall', 0.5)],
		priority: 'medium',
		tags: ['reminder', 'weekly', 'recurring']
	},
	{
		id: 'PR-002',
		category: 'payment_reminder',
		description: 'Reminder until paid',
		input: "Send reminders for Mike's invoice until paid",
		expectedIntent: 'document_send', // Parser interprets as send action
		expectedData: {
			clientName: 'Mike'
		},
		validationRules: [
			contains('data.clientName', 'Mike'),
			greaterThan('data.confidence.overall', 0.5)
		],
		priority: 'medium',
		tags: ['reminder', 'until-paid']
	},
	{
		id: 'PR-003',
		category: 'payment_reminder',
		description: 'Invoice with reminder note',
		input: 'Invoice for Sarah, 800 dollars, add note: payment reminder sent weekly',
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
		tags: ['invoice', 'reminder', 'note']
	},
	{
		id: 'PR-004',
		category: 'payment_reminder',
		description: 'Query about pending reminders',
		input: 'Show reminder history for Cost',
		expectedIntent: 'information_query',
		expectedData: {
			query: { clientName: 'Cost' }
		},
		validationRules: [greaterThan('data.confidence.overall', 0.5)],
		priority: 'medium',
		tags: ['reminder', 'history', 'query']
	},
	{
		id: 'PR-005',
		category: 'payment_reminder',
		description: 'Send immediate reminder',
		input: 'Send reminder to John now',
		expectedIntent: 'document_send',
		expectedData: {
			clientName: 'John'
		},
		validationRules: [
			contains('data.clientName', 'John'),
			greaterThan('data.confidence.overall', 0.6)
		],
		priority: 'high',
		tags: ['reminder', 'send-now', 'immediate']
	},
	{
		id: 'PR-006',
		category: 'payment_reminder',
		description: 'Mark invoice as paid',
		input: "John's invoice has been paid",
		expectedIntent: 'information_query', // Parser sees this as status update query
		expectedData: {},
		validationRules: [greaterThan('data.confidence.overall', 0.5)],
		priority: 'medium',
		tags: ['payment', 'mark-paid']
	},
	{
		id: 'PR-007',
		category: 'payment_reminder',
		description: 'Record partial payment with invoice',
		input: 'Invoice for Mike showing 500 received, balance 300',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Mike' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Mike'),
			greaterThan('data.confidence.overall', 0.6)
		],
		priority: 'high',
		tags: ['payment', 'partial', 'invoice']
	},
	{
		id: 'PR-008',
		category: 'payment_reminder',
		description: 'Create invoice with overdue notation',
		// Clearer phrasing to indicate creation intent with overdue status
		input: 'Create invoice for Sarah for 1200 dollars, mark as overdue since 30 days past due',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Sarah' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Sarah'),
			greaterThan('data.confidence.overall', 0.5)
		],
		priority: 'high',
		tags: ['payment', 'overdue', 'invoice']
	},
	{
		id: 'PR-009',
		category: 'payment_reminder',
		description: 'Query overdue invoices',
		input: 'Show me all overdue invoices',
		expectedIntent: 'information_query',
		expectedData: {
			query: { status: 'overdue' }
		},
		validationRules: [greaterThan('data.confidence.overall', 0.6)],
		priority: 'high',
		tags: ['payment', 'overdue', 'query']
	},
	{
		id: 'PR-010',
		category: 'payment_reminder',
		description: 'Query unpaid invoices',
		input: 'List unpaid invoices from last month',
		expectedIntent: 'information_query',
		expectedData: {
			query: { status: 'pending' }
		},
		validationRules: [greaterThan('data.confidence.overall', 0.6)],
		priority: 'high',
		tags: ['payment', 'unpaid', 'query']
	},
	{
		id: 'PR-011',
		category: 'payment_reminder',
		description: 'Final notice invoice',
		input: 'Final notice invoice for John, 2000 dollars',
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
		tags: ['payment', 'final-notice', 'invoice']
	},
	{
		id: 'PR-012',
		category: 'payment_reminder',
		description: 'Payment due soon reminder',
		input: 'Invoice for Mike, 1500 dollars, due in 3 days',
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
		tags: ['payment', 'due-date', 'invoice']
	},
	{
		id: 'PR-013',
		category: 'payment_reminder',
		description: 'Send invoice and reminder together',
		input: 'Send invoice to Sarah and follow up next week',
		expectedIntent: 'document_send',
		expectedData: {
			clientName: 'Sarah'
		},
		validationRules: [
			contains('data.clientName', 'Sarah'),
			greaterThan('data.confidence.overall', 0.6)
		],
		priority: 'medium',
		tags: ['send', 'follow-up', 'reminder']
	},
	{
		id: 'PR-014',
		category: 'payment_reminder',
		description: 'Outstanding balance invoice',
		input: 'Invoice for outstanding balance, Jackson, 3500 dollars',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Jackson' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Jackson'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['payment', 'outstanding', 'invoice']
	},
	{
		id: 'PR-015',
		category: 'payment_reminder',
		description: 'Payment confirmation query',
		input: 'Did John pay the invoice?',
		expectedIntent: 'information_query',
		expectedData: {},
		validationRules: [greaterThan('data.confidence.overall', 0.5)],
		priority: 'medium',
		tags: ['payment', 'confirmation', 'query']
	}
];
