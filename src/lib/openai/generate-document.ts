import OpenAI from 'openai';
import type { ExtractedEntities } from './extract-entities';

interface Profile {
	full_name: string;
	business_name: string | null;
	phone: string | null;
	email: string;
}

interface Client {
	name: string;
	email: string | null;
	phone: string | null;
	address: string | null;
}

export interface GeneratedInvoice {
	invoiceNumber: string;
	title: string;
	lineItems: Array<{ description: string; quantity: number; rate: number; amount: number }>;
	subtotal: number;
	taxRate: number;
	taxAmount: number;
	total: number;
	dueDate: string;
	notes: string;
}

export interface GeneratedContract {
	title: string;
	scope: string;
	timeline: string;
	paymentTerms: string;
	amount: number;
	materials: string;
	terms: string[];
}

export async function generateDocument(
	transcript: string,
	entities: ExtractedEntities,
	profile: Profile,
	client: Client,
	apiKey: string
): Promise<GeneratedInvoice | GeneratedContract> {
	if (!apiKey || apiKey === 'your_openai_key') {
		return entities.documentType === 'invoice'
			? generateInvoiceMock(entities, client)
			: generateContractMock(entities, profile, client);
	}

	const openai = new OpenAI({ apiKey });

	const prompt =
		entities.documentType === 'invoice'
			? generateInvoicePrompt(transcript, entities, profile, client)
			: generateContractPrompt(transcript, entities, profile, client);

	try {
		const response = await openai.chat.completions.create({
			model: 'gpt-4-turbo-preview',
			response_format: { type: 'json_object' },
			messages: [
				{ role: 'system', content: prompt.system },
				{ role: 'user', content: prompt.user }
			]
		});

		return JSON.parse(response.choices[0].message.content || '{}');
	} catch (error) {
		console.error('Document generation error:', error);
		return entities.documentType === 'invoice'
			? generateInvoiceMock(entities, client)
			: generateContractMock(entities, profile, client);
	}
}

function generateInvoicePrompt(
	transcript: string,
	entities: ExtractedEntities,
	profile: Profile,
	client: Client
) {
	return {
		system: `You generate professional invoices for contractors. Return JSON with:
- invoiceNumber: string (format INV-XXXX)
- title: string
- lineItems: array of {description, quantity, rate, amount}
- subtotal: number
- taxRate: number (0 if not mentioned)
- taxAmount: number
- total: number
- dueDate: ISO date string (default 30 days from now)
- notes: string (payment instructions)

Use professional but simple language.`,
		user: `Contractor: ${profile.business_name || profile.full_name}
Client: ${client.name}
Transcript: "${transcript}"
Extracted: ${JSON.stringify(entities)}

Generate a complete invoice.`
	};
}

function generateContractPrompt(
	transcript: string,
	entities: ExtractedEntities,
	profile: Profile,
	client: Client
) {
	return {
		system: `You generate professional contracts for contractors. Return JSON with:
- title: string
- scope: string (detailed work description)
- timeline: string (start/end dates)
- paymentTerms: string
- amount: number
- materials: string (if applicable)
- terms: array of strings (contract terms)

Use professional but simple language suitable for blue-collar contractors.`,
		user: `Contractor: ${profile.business_name || profile.full_name}
Client: ${client.name}
Transcript: "${transcript}"
Extracted: ${JSON.stringify(entities)}

Generate a complete contract.`
	};
}

function generateInvoiceMock(entities: ExtractedEntities, client: Client): GeneratedInvoice {
	const subtotal = entities.amount || 0;
	const taxRate = 0;
	const taxAmount = 0;
	const total = subtotal + taxAmount;

	const dueDate = new Date();
	dueDate.setDate(dueDate.getDate() + 30);

	return {
		invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
		title: `Invoice for ${client.name}`,
		lineItems:
			entities.lineItems.length > 0
				? entities.lineItems
				: [{ description: 'Services rendered', quantity: 1, rate: subtotal, amount: subtotal }],
		subtotal,
		taxRate,
		taxAmount,
		total,
		dueDate: dueDate.toISOString().split('T')[0],
		notes: 'Payment due within 30 days. Thank you for your business!'
	};
}

function generateContractMock(
	entities: ExtractedEntities,
	profile: Profile,
	client: Client
): GeneratedContract {
	return {
		title: `Service Agreement - ${client.name}`,
		scope: entities.projectDescription || 'Services to be performed as discussed.',
		timeline: entities.startDate ? `Starting ${entities.startDate}` : 'To be determined',
		paymentTerms: entities.amount
			? `Total: $${entities.amount.toLocaleString()}. 30% deposit due at signing, balance upon completion.`
			: 'Payment terms to be determined.',
		amount: entities.amount || 0,
		materials: 'Materials as needed for project completion.',
		terms: [
			'Work will be performed in a professional manner according to industry standards.',
			'Any changes to scope must be agreed upon in writing.',
			'Contractor maintains appropriate insurance coverage.',
			'All work warranted for one (1) year from completion.',
			'Either party may cancel with 48 hours written notice.'
		]
	};
}
