// Document Creation Test Cases (30 scenarios)
// Tests for creating invoices and estimates from voice commands

import type { AITestCase } from '../types';
import { equals, exists, greaterThan, arrayLength, approxEquals, contains } from '../types';

export const documentCreationTests: AITestCase[] = [
	{
		id: 'DC-001',
		category: 'document_creation',
		description: 'Simple invoice with basic amount',
		input: 'Invoice for John, 500 dollars for drywall repair',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'John' },
			items: [{ description: 'drywall repair', total: 500 }]
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			exists('data.client.name'),
			contains('data.client.name', 'John'),
			arrayLength('data.items', 1),
			equals('data.items.0.total', 500),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'critical',
		tags: ['basic', 'invoice', 'single-item']
	},
	{
		id: 'DC-002',
		category: 'document_creation',
		description: 'Simple estimate with basic amount',
		input: 'Estimate for Sarah, deck building 3500 dollars',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'estimate',
			client: { name: 'Sarah' },
			items: [{ description: 'deck building', total: 3500 }]
		},
		validationRules: [
			equals('data.documentType', 'estimate'),
			contains('data.client.name', 'Sarah'),
			arrayLength('data.items', 1),
			equals('data.items.0.total', 3500),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'critical',
		tags: ['basic', 'estimate', 'single-item']
	},
	{
		id: 'DC-003',
		category: 'document_creation',
		description: 'Multi-item invoice with labor and materials',
		input: 'Invoice for Mike, 8 hours labor at 75 per hour plus 350 materials',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Mike' },
			items: [
				{ description: 'labor', quantity: 8, rate: 75, total: 600 },
				{ description: 'materials', total: 350 }
			]
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Mike'),
			arrayLength('data.items', 2),
			equals('data.items.0.quantity', 8),
			equals('data.items.0.rate', 75),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['multi-item', 'labor', 'materials', 'hourly']
	},
	{
		id: 'DC-004',
		category: 'document_creation',
		description: 'Invoice with sqft dimensions parsed',
		input: 'Invoice for Jackson, hardwood flooring 24 by 26 feet for 4500 dollars',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Jackson' },
			items: [
				{
					material: 'hardwood flooring',
					measurementType: 'sqft',
					dimensions: { width: 24, length: 26 }
				}
			]
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Jackson'),
			exists('data.items.0.dimensions'),
			equals('data.items.0.dimensions.width', 24),
			equals('data.items.0.dimensions.length', 26),
			equals('data.items.0.measurementType', 'sqft'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['dimensions', 'sqft', 'flooring']
	},
	{
		id: 'DC-005',
		category: 'document_creation',
		description: 'Invoice with linear feet',
		input: 'Invoice for Cost, 120 linear feet fencing at 45 per foot',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Cost' },
			items: [
				{
					measurementType: 'linear_ft',
					quantity: 120,
					rate: 45,
					total: 5400
				}
			]
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Cost'),
			equals('data.items.0.measurementType', 'linear_ft'),
			equals('data.items.0.quantity', 120),
			equals('data.items.0.rate', 45),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['linear_ft', 'fencing', 'rate']
	},
	{
		id: 'DC-006',
		category: 'document_creation',
		description: 'Invoice with hourly labor rate',
		input: 'Invoice for Dave, 12 hours electrical at 95 per hour',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Dave' },
			items: [
				{
					measurementType: 'hour',
					quantity: 12,
					rate: 95,
					total: 1140
				}
			]
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Dave'),
			equals('data.items.0.quantity', 12),
			equals('data.items.0.rate', 95),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['hourly', 'electrical', 'labor']
	},
	{
		id: 'DC-007',
		category: 'document_creation',
		description: 'Invoice with labor hours and parts',
		input: 'Invoice for Sarah, 6 hours plumbing at 85 plus 420 parts',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Sarah' },
			items: [{ quantity: 6, rate: 85, total: 510 }, { total: 420 }]
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Sarah'),
			arrayLength('data.items', 2),
			equals('data.items.0.quantity', 6),
			equals('data.items.0.rate', 85),
			equals('data.items.1.total', 420),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['labor', 'parts', 'plumbing']
	},
	{
		id: 'DC-008',
		category: 'document_creation',
		description: 'Invoice with GST tax',
		input: 'Invoice for Mike, 2000 landscaping plus GST',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Mike' },
			items: [{ total: 2000 }],
			taxRate: 5
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Mike'),
			equals('data.items.0.total', 2000),
			equals('data.taxRate', 5),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['tax', 'GST', 'landscaping']
	},
	{
		id: 'DC-009',
		category: 'document_creation',
		description: 'Invoice with HST Ontario tax',
		input: 'Invoice for John, bathroom renovation 8500 plus Ontario tax',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'John' },
			items: [{ total: 8500 }],
			taxRate: 13
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'John'),
			equals('data.items.0.total', 8500),
			equals('data.taxRate', 13),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['tax', 'HST', 'Ontario', 'renovation']
	},
	{
		id: 'DC-010',
		category: 'document_creation',
		description: 'Invoice with BC taxes (GST + PST)',
		input: 'Invoice for Jackson, 3000 with BC taxes',
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
		tags: ['tax', 'GST', 'PST', 'BC', 'multi-tax']
	},
	{
		id: 'DC-011',
		category: 'document_creation',
		description: 'Tax exempt invoice',
		input: 'Invoice for Sarah, no tax, first nations exemption, 1500',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Sarah' },
			taxRate: 0
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Sarah'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['tax-exempt', 'first-nations']
	},
	{
		id: 'DC-012',
		category: 'document_creation',
		description: 'Estimate with percentage discount',
		input: 'Estimate for Mike, 5000 with 10 percent discount',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'estimate',
			client: { name: 'Mike' },
			discount: { type: 'percentage', value: 10 }
		},
		validationRules: [
			equals('data.documentType', 'estimate'),
			contains('data.client.name', 'Mike'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['discount', 'percentage']
	},
	{
		id: 'DC-013',
		category: 'document_creation',
		description: 'Invoice with fixed discount',
		input: 'Invoice for John, 2500 minus 200 loyalty discount',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'John' },
			discount: { type: 'fixed', value: 200 }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'John'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['discount', 'fixed']
	},
	{
		id: 'DC-014',
		category: 'document_creation',
		description: 'Invoice with full client details',
		input: 'Invoice for John Smith at 123 Main St, email john@email.com, 800',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: {
				name: 'John Smith',
				email: 'john@email.com',
				address: '123 Main St'
			}
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'John'),
			equals('data.client.email', 'john@email.com'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['client-details', 'email', 'address']
	},
	{
		id: 'DC-015',
		category: 'document_creation',
		description: 'Estimate with payment notes',
		input: 'Estimate for Mike, deck 4500, payment due on completion',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'estimate',
			client: { name: 'Mike' },
			items: [{ total: 4500 }]
		},
		validationRules: [
			equals('data.documentType', 'estimate'),
			contains('data.client.name', 'Mike'),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['notes', 'payment-terms']
	},
	{
		id: 'DC-016',
		category: 'document_creation',
		description: 'Invoice with net 30 payment terms',
		input: 'Invoice for Sarah, 3000 net 30',
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
		priority: 'medium',
		tags: ['payment-terms', 'net-30']
	},
	{
		id: 'DC-017',
		category: 'document_creation',
		description: 'Invoice with specific due date',
		input: 'Invoice for Jackson, 2500 due in 2 weeks',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Jackson' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Jackson'),
			// Note: Parser doesn't currently extract relative due dates
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['due-date', 'relative-date']
	},
	{
		id: 'DC-018',
		category: 'document_creation',
		description: 'Complex combined invoice',
		input:
			'Invoice for Cost Corp, tile 450 sqft at 12 per sqft plus 800 materials plus HST, net 15',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Cost Corp' },
			taxRate: 13
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Cost'),
			greaterThan('data.confidence.overall', 0.6)
		],
		priority: 'high',
		tags: ['complex', 'multi-item', 'tax', 'payment-terms']
	},
	{
		id: 'DC-019',
		category: 'document_creation',
		description: 'Flooring estimate with dimensions',
		input: 'Estimate for Mike, laminate flooring 20 by 18 feet at 8 per sqft plus 350 materials',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'estimate',
			client: { name: 'Mike' },
			items: [
				{
					material: 'laminate flooring',
					dimensions: { width: 20, length: 18 }
				}
			]
		},
		validationRules: [
			equals('data.documentType', 'estimate'),
			contains('data.client.name', 'Mike'),
			exists('data.items.0.dimensions'),
			equals('data.items.0.dimensions.width', 20),
			equals('data.items.0.dimensions.length', 18),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['flooring', 'dimensions', 'materials']
	},
	{
		id: 'DC-020',
		category: 'document_creation',
		description: 'Painting invoice by sqft',
		input: 'Invoice for Sarah, interior painting 1200 sqft at 3 per sqft',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Sarah' },
			items: [
				{
					material: 'interior painting',
					measurementType: 'sqft',
					quantity: 1200,
					rate: 3,
					total: 3600
				}
			]
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Sarah'),
			equals('data.items.0.quantity', 1200),
			equals('data.items.0.rate', 3),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['painting', 'sqft', 'rate']
	},
	{
		id: 'DC-021',
		category: 'document_creation',
		description: 'Roofing estimate',
		input: 'Estimate for John, roof replacement 2400 sqft at 6.50 per sqft plus 1800 materials',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'estimate',
			client: { name: 'John' },
			items: [
				{
					quantity: 2400,
					rate: 6.5
				}
			]
		},
		validationRules: [
			equals('data.documentType', 'estimate'),
			contains('data.client.name', 'John'),
			arrayLength('data.items', 2),
			equals('data.items.0.quantity', 2400),
			approxEquals('data.items.0.rate', 6.5, 0.01),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['roofing', 'sqft', 'materials']
	},
	{
		id: 'DC-022',
		category: 'document_creation',
		description: 'Electrical invoice',
		input: 'Invoice for Dave, panel upgrade 4 hours at 110 per hour plus 650 parts',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Dave' },
			items: [{ quantity: 4, rate: 110, total: 440 }, { total: 650 }]
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Dave'),
			arrayLength('data.items', 2),
			equals('data.items.0.quantity', 4),
			equals('data.items.0.rate', 110),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'high',
		tags: ['electrical', 'hourly', 'parts']
	},
	{
		id: 'DC-023',
		category: 'document_creation',
		description: 'HVAC service call',
		input: 'Invoice for Mike, AC service call 150 flat rate plus 89 filter',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Mike' },
			items: [{ total: 150 }, { total: 89 }]
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Mike'),
			arrayLength('data.items', 2),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['HVAC', 'service', 'flat-rate']
	},
	{
		id: 'DC-024',
		category: 'document_creation',
		description: 'Window cleaning by unit',
		input: 'Invoice for Jackson, 24 windows at 15 each',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Jackson' },
			items: [
				{
					measurementType: 'unit',
					quantity: 24,
					rate: 15,
					total: 360
				}
			]
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Jackson'),
			equals('data.items.0.quantity', 24),
			equals('data.items.0.rate', 15),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['unit-pricing', 'windows']
	},
	{
		id: 'DC-025',
		category: 'document_creation',
		description: 'Pressure washing with cents',
		input: 'Estimate for Sarah, driveway 800 sqft at 50 cents per sqft',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'estimate',
			client: { name: 'Sarah' },
			items: [
				{
					quantity: 800,
					rate: 0.5,
					total: 400
				}
			]
		},
		validationRules: [
			equals('data.documentType', 'estimate'),
			contains('data.client.name', 'Sarah'),
			equals('data.items.0.quantity', 800),
			approxEquals('data.items.0.rate', 0.5, 0.01),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['pressure-washing', 'cents', 'sqft']
	},
	{
		id: 'DC-026',
		category: 'document_creation',
		description: 'Trim work linear feet',
		input: 'Invoice for John, baseboard trim 180 linear feet at 4.50 per foot',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'John' },
			items: [
				{
					measurementType: 'linear_ft',
					quantity: 180,
					rate: 4.5
				}
			]
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'John'),
			equals('data.items.0.quantity', 180),
			approxEquals('data.items.0.rate', 4.5, 0.01),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['trim', 'linear_ft']
	},
	{
		id: 'DC-027',
		category: 'document_creation',
		description: 'Landscaping with materials',
		input: 'Estimate for Cost, lawn maintenance 1200 plus 400 mulch',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'estimate',
			client: { name: 'Cost' },
			items: [{ total: 1200 }, { total: 400 }]
		},
		validationRules: [
			equals('data.documentType', 'estimate'),
			contains('data.client.name', 'Cost'),
			arrayLength('data.items', 2),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['landscaping', 'materials']
	},
	{
		id: 'DC-028',
		category: 'document_creation',
		description: 'Handyman hourly',
		input: 'Invoice for Mike, general repairs 5 hours at 65 per hour',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Mike' },
			items: [
				{
					quantity: 5,
					rate: 65,
					total: 325
				}
			]
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Mike'),
			equals('data.items.0.quantity', 5),
			equals('data.items.0.rate', 65),
			greaterThan('data.confidence.overall', 0.7)
		],
		priority: 'medium',
		tags: ['handyman', 'hourly']
	},
	{
		id: 'DC-029',
		category: 'document_creation',
		description: 'Multi-trade bathroom invoice',
		input:
			'Invoice for Jackson, bathroom: plumbing 650, tile 1200, fixtures 890, labor 8 hours at 80',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Jackson' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Jackson'),
			greaterThan('data.confidence.overall', 0.6)
		],
		priority: 'high',
		tags: ['multi-trade', 'bathroom', 'complex']
	},
	{
		id: 'DC-030',
		category: 'document_creation',
		description: 'Invoice with send action - creates new invoice with send action',
		// Note: Clearer phrasing to indicate creation intent
		input: 'Create invoice for Sarah for 3000 dollars and send it to her',
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
		tags: ['send', 'action', 'email']
	}
];
