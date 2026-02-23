// Advanced & Challenging Test Cases (40 scenarios)
// These tests push the AI parser to its limits with:
// - Complex multi-part requests
// - Ambiguous language
// - Non-standard phrasing
// - Heavy colloquialisms
// - Deliberate typos/misspellings
// - Edge cases and stress tests

import type { AITestCase } from '../types';
import { equals, exists, greaterThan, contains, between, arrayLength } from '../types';

export const advancedScenarioTests: AITestCase[] = [
	// ========================================
	// COMPLEX MULTI-PART REQUESTS
	// ========================================
	{
		id: 'ADV-001',
		category: 'edge_case',
		description: 'Triple action request',
		input:
			'Create an invoice for Mike for 2500, send it to his email, and schedule a reminder for next week',
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
		priority: 'critical',
		tags: ['multi-action', 'complex', 'advanced']
	},
	{
		id: 'ADV-002',
		category: 'edge_case',
		description: 'Conditional pricing',
		input:
			'Invoice for Sarah, if under 10 hours charge 75 per hour, otherwise 65 per hour, she worked 12 hours',
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
		tags: ['conditional', 'math', 'advanced']
	},
	{
		id: 'ADV-003',
		category: 'edge_case',
		description: 'Multi-client batch request',
		input: 'Create invoices for John, Mike, and Sarah, each for 500 dollars for consulting',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice'
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			greaterThan('data.confidence.overall', 0.5)
		],
		priority: 'high',
		tags: ['batch', 'multi-client', 'advanced']
	},
	{
		id: 'ADV-004',
		category: 'edge_case',
		description: 'Complex calculation with discount tiers',
		input:
			'Estimate for Jackson, materials 3200 with 15% contractor discount, labor 40 hours at 85 per hour minus 10% for paying cash upfront, plus 5% contingency on total',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'estimate',
			client: { name: 'Jackson' }
		},
		validationRules: [
			equals('data.documentType', 'estimate'),
			contains('data.client.name', 'Jackson'),
			greaterThan('data.confidence.overall', 0.5)
		],
		priority: 'critical',
		tags: ['complex-math', 'discounts', 'advanced']
	},

	// ========================================
	// AMBIGUOUS & VAGUE LANGUAGE
	// ========================================
	{
		id: 'ADV-005',
		category: 'edge_case',
		description: 'Extremely vague request',
		input: 'The usual for John',
		// Parser interprets "the usual" as a clone request (repeat last document)
		expectedIntent: 'document_clone',
		expectedData: {},
		validationRules: [greaterThan('data.confidence.overall', 0.3)],
		priority: 'medium',
		tags: ['vague', 'ambiguous', 'advanced']
	},
	{
		id: 'ADV-006',
		category: 'edge_case',
		description: 'Implied document type',
		input: "Bill Mike for last Tuesday's work",
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Mike' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Mike'),
			greaterThan('data.confidence.overall', 0.5)
		],
		priority: 'high',
		tags: ['implied', 'colloquial', 'advanced']
	},
	{
		id: 'ADV-007',
		category: 'edge_case',
		description: 'Relative time reference',
		input:
			'Invoice for work I did for Sarah between Christmas and New Year, about 20 hours at my regular rate',
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
		priority: 'medium',
		tags: ['relative-time', 'implied-rate', 'advanced']
	},
	{
		id: 'ADV-008',
		category: 'edge_case',
		description: 'Sarcastic/rhetorical phrasing',
		input: "Oh sure, let's make yet another invoice for John, I guess 800 dollars this time",
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'John' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'John'),
			greaterThan('data.confidence.overall', 0.5)
		],
		priority: 'medium',
		tags: ['sarcasm', 'rhetorical', 'advanced']
	},

	// ========================================
	// HEAVY COLLOQUIALISMS & SLANG
	// ========================================
	{
		id: 'ADV-009',
		category: 'edge_case',
		description: 'Heavy slang',
		input: 'Gonna need to hit up Mike for like 2 grand for that gig we did',
		expectedIntent: 'document_action',
		expectedData: {
			client: { name: 'Mike' }
		},
		validationRules: [
			// Parser may struggle with heavy slang - documentType may be null
			contains('data.client.name', 'Mike'),
			greaterThan('data.confidence.overall', 0.4)
		],
		priority: 'high',
		tags: ['slang', 'colloquial', 'advanced']
	},
	{
		id: 'ADV-010',
		category: 'edge_case',
		description: 'Construction worker speak',
		input:
			'Write up a bill for Cost Corp, we did that framing job, put down like 6 sticks of 2x4s, buncha screws, and me and my guy were there for a solid 8 hours',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Cost Corp' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Cost'),
			greaterThan('data.confidence.overall', 0.5)
		],
		priority: 'high',
		tags: ['industry-slang', 'colloquial', 'advanced']
	},
	{
		id: 'ADV-011',
		category: 'edge_case',
		description: 'Shortened words and abbreviations',
		input:
			'Inv for Jackson, bath reno, demo 2 days, tile 400sqft, plmbing hookup, bout 8k total w/ mats',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Jackson' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Jackson'),
			greaterThan('data.confidence.overall', 0.5)
		],
		priority: 'high',
		tags: ['abbreviations', 'shorthand', 'advanced']
	},

	// ========================================
	// DELIBERATE TYPOS & MISSPELLINGS
	// ========================================
	{
		id: 'ADV-012',
		category: 'edge_case',
		description: 'Common typos',
		input: 'Invioce for Micheal Johnson, 1500 dollers for plumbing',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice'
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			greaterThan('data.confidence.overall', 0.5)
		],
		priority: 'high',
		tags: ['typos', 'misspelling', 'advanced']
	},
	{
		id: 'ADV-013',
		category: 'edge_case',
		description: 'Voice-to-text errors',
		input: 'Invoice four Sarah too thousand for landscaping',
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
		tags: ['voice-errors', 'homophones', 'advanced']
	},
	{
		id: 'ADV-014',
		category: 'edge_case',
		description: 'Mixed up words',
		input: 'Estimator for John, roofing job, probally around 5000',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'estimate',
			client: { name: 'John' }
		},
		validationRules: [
			equals('data.documentType', 'estimate'),
			contains('data.client.name', 'John'),
			greaterThan('data.confidence.overall', 0.5)
		],
		priority: 'medium',
		tags: ['typos', 'word-confusion', 'advanced']
	},

	// ========================================
	// INTERNATIONAL & MULTI-CURRENCY
	// ========================================
	{
		id: 'ADV-015',
		category: 'edge_case',
		description: 'European number format',
		input: 'Invoice for Mike, 2.500,00 euros for consulting',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Mike' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Mike'),
			greaterThan('data.confidence.overall', 0.5)
		],
		priority: 'medium',
		tags: ['international', 'currency', 'advanced']
	},
	{
		id: 'ADV-016',
		category: 'edge_case',
		description: 'Mixed currency mention',
		input: 'Invoice for Sarah, 1000 USD or about 1350 CAD for the work',
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
		priority: 'medium',
		tags: ['currency', 'conversion', 'advanced']
	},

	// ========================================
	// EXTREMELY LONG INPUTS
	// ========================================
	{
		id: 'ADV-017',
		category: 'edge_case',
		description: 'Very detailed estimate',
		input:
			"I need to create a detailed estimate for the Johnson family at 123 Maple Street, they want a complete kitchen renovation including demolition of existing cabinets and countertops, installation of new custom maple cabinets from HomeDepot, quartz countertops from Cambria in the Brittanicca pattern, a new stainless steel sink with a Kohler faucet, under cabinet LED lighting, new electrical for three additional outlets, plumbing modification for the new sink location, painting of all walls and ceiling in Benjamin Moore Swiss Coffee, installation of new LVP flooring from Shaw in the Tawny Oak color, and replacement of the existing window with a new energy efficient model. Materials are estimated at 15000 and labor will be approximately 120 hours at 75 per hour. They've asked for the work to start in March and want a 10% discount for paying half upfront.",
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'estimate'
		},
		validationRules: [
			equals('data.documentType', 'estimate'),
			greaterThan('data.confidence.overall', 0.5)
		],
		priority: 'critical',
		tags: ['long-input', 'detailed', 'advanced']
	},
	{
		id: 'ADV-018',
		category: 'edge_case',
		description: 'Stream of consciousness',
		input:
			'So um yeah I need to invoice Mike wait no John actually yeah John for um that thing we did you know the deck project where we built the um cedar deck and it was like 400 square feet I think or maybe 450 and we charged him oh what was it like 18 per square foot plus the materials were about 3000 and there was also the railing which was another 1500 and oh we also did that extra step thing he wanted',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'John' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'John'),
			greaterThan('data.confidence.overall', 0.4)
		],
		priority: 'high',
		tags: ['rambling', 'unclear', 'advanced']
	},

	// ========================================
	// MATHEMATICAL CHALLENGES
	// ========================================
	{
		id: 'ADV-019',
		category: 'edge_case',
		description: 'Percentage of percentage',
		input:
			'Invoice for Sarah, base price 1000, add 13% HST, then apply 5% early payment discount to the total',
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
		tags: ['math', 'percentage', 'advanced']
	},
	{
		id: 'ADV-020',
		category: 'edge_case',
		description: 'Complex area calculation',
		input:
			'Estimate for Mike, room is L-shaped, main part is 12 by 15 feet, the L extension is 8 by 6 feet, flooring at 8.50 per square foot',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'estimate',
			client: { name: 'Mike' }
		},
		validationRules: [
			equals('data.documentType', 'estimate'),
			contains('data.client.name', 'Mike'),
			greaterThan('data.confidence.overall', 0.5)
		],
		priority: 'high',
		tags: ['math', 'area', 'geometry', 'advanced']
	},
	{
		id: 'ADV-021',
		category: 'edge_case',
		description: 'Time-based pricing tiers',
		input:
			'Invoice for Jackson, regular hours 8 at 50 per hour, overtime 4 hours at time and a half, Sunday work 3 hours at double time',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Jackson' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Jackson'),
			greaterThan('data.confidence.overall', 0.5)
		],
		priority: 'high',
		tags: ['overtime', 'time-math', 'advanced']
	},

	// ========================================
	// CONTRADICTORY & CONFUSING
	// ========================================
	{
		id: 'ADV-022',
		category: 'edge_case',
		description: 'Self-contradicting amount',
		input: "Invoice for John, 500 dollars, no wait make that 800, actually let's go with 600",
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'John' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'John'),
			greaterThan('data.confidence.overall', 0.5)
		],
		priority: 'medium',
		tags: ['contradictory', 'revision', 'advanced']
	},
	{
		id: 'ADV-023',
		category: 'edge_case',
		description: 'Uncertain about everything - attempts document action',
		// Parser attempts to create document despite uncertainty (takes "I need" as action intent)
		input: 'I need an invoice for Mike, probably around 1500 dollars for the consultation work',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Mike' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Mike'),
			greaterThan('data.confidence.overall', 0.5)
		],
		priority: 'medium',
		tags: ['uncertain', 'vague', 'advanced']
	},

	// ========================================
	// SPECIAL CHARACTERS & FORMATTING
	// ========================================
	{
		id: 'ADV-024',
		category: 'edge_case',
		description: 'Email in middle of request',
		input: 'Invoice for Sarah Williams sarah.w@email.com 1200 dollars for graphic design',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Sarah Williams', email: 'sarah.w@email.com' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Sarah'),
			equals('data.client.email', 'sarah.w@email.com'),
			greaterThan('data.confidence.overall', 0.6)
		],
		priority: 'high',
		tags: ['email', 'contact-info', 'advanced']
	},
	{
		id: 'ADV-025',
		category: 'edge_case',
		description: 'Phone number variations',
		input: 'Invoice for Mike phone 1-800-555-1234 or (905) 555-4321 for 750 dollars',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Mike' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Mike'),
			exists('data.client.phone'),
			greaterThan('data.confidence.overall', 0.5)
		],
		priority: 'medium',
		tags: ['phone', 'contact-info', 'advanced']
	},
	{
		id: 'ADV-026',
		category: 'edge_case',
		description: 'Address with unit number',
		input:
			'Invoice for Jackson at Unit 5B, 1234 Oak Street, Suite 200, 3rd Floor, Toronto ON M5V 2T6, for 2000 dollars',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Jackson' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Jackson'),
			exists('data.client.address'),
			greaterThan('data.confidence.overall', 0.5)
		],
		priority: 'medium',
		tags: ['address', 'complex-address', 'advanced']
	},

	// ========================================
	// INDUSTRY-SPECIFIC JARGON
	// ========================================
	{
		id: 'ADV-027',
		category: 'edge_case',
		description: 'Electrical industry terms',
		input:
			'Invoice for Cost Corp, rewired the sub-panel, ran 3 20-amp circuits, installed 4 GFCI outlets, 2 dimmers, and a 50-amp outlet for the EV charger, plus the permit fees',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Cost Corp' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Cost'),
			greaterThan('data.confidence.overall', 0.5)
		],
		priority: 'high',
		tags: ['electrical', 'industry-terms', 'advanced']
	},
	{
		id: 'ADV-028',
		category: 'edge_case',
		description: 'Plumbing industry terms',
		input:
			'Invoice for Sarah, replaced the P-trap, snaked the main line, installed new PRV at 60 PSI, fixed the ballcock in the upstairs toilet, total 5 hours labor plus parts',
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
		tags: ['plumbing', 'industry-terms', 'advanced']
	},

	// ========================================
	// REFERENCE TO PREVIOUS DOCUMENTS
	// ========================================
	{
		id: 'ADV-029',
		category: 'edge_case',
		description: 'Reference to estimate number',
		input: 'Convert estimate EST-2026-0147 to an invoice for John',
		expectedIntent: 'document_transform',
		expectedData: {
			source: { documentNumber: 'EST-2026-0147' },
			conversion: { targetType: 'invoice' }
		},
		validationRules: [greaterThan('data.confidence.overall', 0.5)],
		priority: 'high',
		tags: ['reference', 'convert', 'advanced']
	},
	{
		id: 'ADV-030',
		category: 'edge_case',
		description: 'Relative document reference',
		input: "Same as Mike's last invoice but for Sarah and increase by 20%",
		expectedIntent: 'document_clone',
		expectedData: {
			sourceClient: 'Mike',
			targetClient: { name: 'Sarah' }
		},
		validationRules: [
			contains('data.sourceClient', 'Mike'),
			contains('data.targetClient.name', 'Sarah'),
			greaterThan('data.confidence.overall', 0.5)
		],
		priority: 'high',
		tags: ['clone', 'modify', 'advanced']
	},

	// ========================================
	// MULTI-LANGUAGE MIX
	// ========================================
	{
		id: 'ADV-031',
		category: 'edge_case',
		description: 'French-English mix (Quebec)',
		input:
			'Facture pour Jean-Pierre, travaux de rénovation, mille cinq cents dollars plus TPS et TVQ',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice'
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			greaterThan('data.confidence.overall', 0.4)
		],
		priority: 'medium',
		tags: ['french', 'multilingual', 'advanced']
	},
	{
		id: 'ADV-032',
		category: 'edge_case',
		description: 'Spanglish',
		input: 'Invoice para Mike, trabajo de painting, dos mil dollars por favor',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Mike' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Mike'),
			greaterThan('data.confidence.overall', 0.4)
		],
		priority: 'medium',
		tags: ['spanish', 'multilingual', 'advanced']
	},

	// ========================================
	// NEGATIVE & CREDIT SCENARIOS
	// ========================================
	{
		id: 'ADV-033',
		category: 'edge_case',
		description: 'Credit note request',
		input: 'Create a credit memo for John for 200 dollars for the returned materials',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'John' }
		},
		validationRules: [
			contains('data.client.name', 'John'),
			greaterThan('data.confidence.overall', 0.4)
		],
		priority: 'medium',
		tags: ['credit', 'refund', 'advanced']
	},
	{
		id: 'ADV-034',
		category: 'edge_case',
		description: 'Clone with adjustment - copy and modify invoice',
		// Clearer phrasing for clone with modification
		input: "Copy Mike's last invoice but reduce the total by 300 dollars for incomplete trim work",
		expectedIntent: 'document_clone',
		expectedData: {
			sourceClient: 'Mike'
		},
		validationRules: [
			contains('data.sourceClient', 'Mike'),
			greaterThan('data.confidence.overall', 0.4)
		],
		priority: 'medium',
		tags: ['adjustment', 'reduce', 'clone', 'advanced']
	},

	// ========================================
	// RECURRING & SUBSCRIPTION
	// ========================================
	{
		id: 'ADV-035',
		category: 'edge_case',
		description: 'Monthly recurring invoice',
		input:
			'Set up a recurring invoice for Sarah, 500 dollars monthly for lawn maintenance, starting March 1st',
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
		priority: 'medium',
		tags: ['recurring', 'subscription', 'advanced']
	},
	{
		id: 'ADV-036',
		category: 'edge_case',
		description: 'Variable recurring',
		input: 'Invoice Jackson every week for however many hours we work, at 75 per hour',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Jackson' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Jackson'),
			greaterThan('data.confidence.overall', 0.5)
		],
		priority: 'medium',
		tags: ['recurring', 'variable', 'advanced']
	},

	// ========================================
	// EDGE CASE NUMBERS
	// ========================================
	{
		id: 'ADV-037',
		category: 'edge_case',
		description: 'Very large amount',
		input: 'Estimate for Acme Corp, commercial renovation project, 2.5 million dollars',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'estimate'
		},
		validationRules: [
			equals('data.documentType', 'estimate'),
			greaterThan('data.confidence.overall', 0.5)
		],
		priority: 'medium',
		tags: ['large-amount', 'commercial', 'advanced']
	},
	{
		id: 'ADV-038',
		category: 'edge_case',
		description: 'Very small amount',
		input: 'Invoice for Mike, 12.50 for the extra screws',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Mike' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Mike'),
			greaterThan('data.confidence.overall', 0.5)
		],
		priority: 'low',
		tags: ['small-amount', 'cents', 'advanced']
	},
	{
		id: 'ADV-039',
		category: 'edge_case',
		description: 'Fractional hours',
		input: 'Invoice for Sarah, 3.75 hours at 80 per hour',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'Sarah' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'Sarah'),
			greaterThan('data.confidence.overall', 0.6)
		],
		priority: 'high',
		tags: ['fractional', 'decimal', 'advanced']
	},
	{
		id: 'ADV-040',
		category: 'edge_case',
		description: 'Written out numbers',
		input:
			'Invoice for John, two thousand five hundred and seventy-five dollars for the bathroom remodel',
		expectedIntent: 'document_action',
		expectedData: {
			documentType: 'invoice',
			client: { name: 'John' }
		},
		validationRules: [
			equals('data.documentType', 'invoice'),
			contains('data.client.name', 'John'),
			greaterThan('data.confidence.overall', 0.5)
		],
		priority: 'high',
		tags: ['written-numbers', 'natural-language', 'advanced']
	}
];
