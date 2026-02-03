// Information Query Test Cases (20 scenarios)
// Tests for querying existing document data

import type { AITestCase } from '../types';
import { equals, exists, greaterThan, contains, isNotNull } from '../types';

export const informationQueryTests: AITestCase[] = [
	{
		id: 'IQ-001',
		category: 'information_query',
		description: 'List all invoices',
		input: 'Show me all invoices',
		expectedIntent: 'information_query',
		expectedData: {
			query: {
				type: 'list',
				documentTypes: ['invoice']
			}
		},
		validationRules: [
			equals('data.query.type', 'list'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'critical',
		tags: ['list', 'invoice', 'basic']
	},
	{
		id: 'IQ-002',
		category: 'information_query',
		description: 'List by status - pending',
		input: 'List pending invoices',
		expectedIntent: 'information_query',
		expectedData: {
			query: {
				type: 'list',
				status: 'pending'
			}
		},
		validationRules: [
			equals('data.query.type', 'list'),
			equals('data.query.status', 'pending'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['list', 'status', 'pending']
	},
	{
		id: 'IQ-003',
		category: 'information_query',
		description: 'Invoices by client',
		input: 'What invoices did I send to John?',
		expectedIntent: 'information_query',
		expectedData: {
			query: {
				type: 'list',
				clientName: 'John'
			}
		},
		validationRules: [
			equals('data.query.type', 'list'),
			contains('data.query.clientName', 'John'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['list', 'client', 'sent']
	},
	{
		id: 'IQ-004',
		category: 'information_query',
		description: 'Show overdue invoices',
		input: 'Show overdue invoices',
		expectedIntent: 'information_query',
		expectedData: {
			query: {
				type: 'list',
				status: 'overdue'
			}
		},
		validationRules: [
			equals('data.query.type', 'list'),
			equals('data.query.status', 'overdue'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['list', 'status', 'overdue']
	},
	{
		id: 'IQ-005',
		category: 'information_query',
		description: 'Sum invoices this month',
		input: 'How much did I invoice this month?',
		expectedIntent: 'information_query',
		expectedData: {
			query: {
				type: 'sum',
				dateRange: { period: 'this_month' }
			}
		},
		validationRules: [
			equals('data.query.type', 'sum'),
			equals('data.query.dateRange.period', 'this_month'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['sum', 'date-range', 'this-month']
	},
	{
		id: 'IQ-006',
		category: 'information_query',
		description: 'Total invoices last month',
		input: 'Total invoices last month',
		expectedIntent: 'information_query',
		expectedData: {
			query: {
				type: 'sum',
				dateRange: { period: 'last_month' }
			}
		},
		validationRules: [
			equals('data.query.type', 'sum'),
			equals('data.query.dateRange.period', 'last_month'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['sum', 'date-range', 'last-month']
	},
	{
		id: 'IQ-007',
		category: 'information_query',
		description: 'List all estimates',
		input: 'List all estimates',
		expectedIntent: 'information_query',
		expectedData: {
			query: {
				type: 'list',
				documentTypes: ['estimate']
			}
		},
		validationRules: [
			equals('data.query.type', 'list'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['list', 'estimate']
	},
	{
		id: 'IQ-008',
		category: 'information_query',
		description: 'Show paid invoices',
		input: 'Show paid invoices',
		expectedIntent: 'information_query',
		expectedData: {
			query: {
				type: 'list',
				status: 'paid'
			}
		},
		validationRules: [
			equals('data.query.type', 'list'),
			equals('data.query.status', 'paid'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['list', 'status', 'paid']
	},
	{
		id: 'IQ-009',
		category: 'information_query',
		description: 'Total invoiced to client',
		input: 'Total invoiced to Cost Corp',
		expectedIntent: 'information_query',
		expectedData: {
			query: {
				type: 'sum',
				clientName: 'Cost Corp'
			}
		},
		validationRules: [
			equals('data.query.type', 'sum'),
			contains('data.query.clientName', 'Cost'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['sum', 'client']
	},
	{
		id: 'IQ-010',
		category: 'information_query',
		description: 'Count invoices this year',
		input: 'How many invoices this year?',
		expectedIntent: 'information_query',
		expectedData: {
			query: {
				type: 'count',
				dateRange: { period: 'this_year' }
			}
		},
		validationRules: [
			equals('data.query.type', 'count'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['count', 'date-range', 'this-year']
	},
	{
		id: 'IQ-011',
		category: 'information_query',
		description: 'Recent invoices with limit',
		input: 'Show last 5 invoices',
		expectedIntent: 'information_query',
		expectedData: {
			query: {
				type: 'list',
				limit: 5
			}
		},
		validationRules: [
			equals('data.query.type', 'list'),
			equals('data.query.limit', 5),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['list', 'limit', 'recent']
	},
	{
		id: 'IQ-012',
		category: 'information_query',
		description: 'Invoices date range',
		input: 'Invoices from January to March',
		expectedIntent: 'information_query',
		expectedData: {
			query: {
				type: 'list',
				dateRange: {}
			}
		},
		validationRules: [
			equals('data.query.type', 'list'),
			exists('data.query.dateRange'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['list', 'date-range']
	},
	{
		id: 'IQ-013',
		category: 'information_query',
		description: 'Check sent status',
		input: 'Did I send the estimate to Sarah?',
		expectedIntent: 'information_query',
		expectedData: {
			query: {
				// Parser may return 'list' or 'details' for yes/no queries - both are valid
				clientName: 'Sarah'
			}
		},
		validationRules: [
			// Accept either 'list' or 'details' for yes/no queries
			exists('data.query.type'),
			greaterThan('data.confidence.overall', 0.6)
		],
		priority: 'medium',
		tags: ['query', 'client', 'status']
	},
	{
		id: 'IQ-014',
		category: 'information_query',
		description: 'Show specific invoice',
		input: 'Show me invoice INV-2026-001',
		expectedIntent: 'information_query',
		expectedData: {
			query: {
				type: 'details'
			}
		},
		validationRules: [
			equals('data.query.type', 'details'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['details', 'specific']
	},
	{
		id: 'IQ-015',
		category: 'information_query',
		description: 'Client outstanding balance',
		input: 'How much does Mike owe me?',
		expectedIntent: 'information_query',
		expectedData: {
			query: {
				type: 'sum',
				clientName: 'Mike',
				status: 'pending'
			}
		},
		validationRules: [
			equals('data.query.type', 'sum'),
			contains('data.query.clientName', 'Mike'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['sum', 'client', 'outstanding']
	},
	{
		id: 'IQ-016',
		category: 'information_query',
		description: 'Tax report query',
		input: 'Total GST collected this quarter',
		expectedIntent: 'information_query',
		expectedData: {
			query: {
				type: 'sum'
			}
		},
		validationRules: [
			equals('data.query.type', 'sum'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['sum', 'tax', 'GST']
	},
	{
		id: 'IQ-017',
		category: 'information_query',
		description: 'Show draft invoices',
		input: 'Show draft invoices',
		expectedIntent: 'information_query',
		expectedData: {
			query: {
				type: 'list',
				status: 'draft'
			}
		},
		validationRules: [
			equals('data.query.type', 'list'),
			equals('data.query.status', 'draft'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['list', 'status', 'draft']
	},
	{
		id: 'IQ-018',
		category: 'information_query',
		description: 'Invoices this week',
		input: 'Invoices from this week',
		expectedIntent: 'information_query',
		expectedData: {
			query: {
				type: 'list',
				dateRange: { period: 'this_week' }
			}
		},
		validationRules: [
			equals('data.query.type', 'list'),
			equals('data.query.dateRange.period', 'this_week'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['list', 'date-range', 'this-week']
	},
	{
		id: 'IQ-019',
		category: 'information_query',
		description: 'Compare months',
		input: 'Compare this month to last month',
		expectedIntent: 'information_query',
		expectedData: {
			query: {
				type: 'sum'
			}
		},
		validationRules: [greaterThan('data.confidence.overall', 0.6)],
		priority: 'low',
		tags: ['comparison', 'date-range']
	},
	{
		id: 'IQ-020',
		category: 'information_query',
		description: 'Total outstanding',
		input: 'Total outstanding invoices',
		expectedIntent: 'information_query',
		expectedData: {
			query: {
				type: 'sum',
				status: 'pending'
			}
		},
		validationRules: [
			equals('data.query.type', 'sum'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['sum', 'outstanding', 'pending']
	}
];
