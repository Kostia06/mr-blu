import OpenAI from 'openai';

export interface ExtractedEntities {
	documentType: 'contract' | 'invoice';
	clientName: string | null;
	clientEmail: string | null;
	clientPhone: string | null;
	clientAddress: string | null;
	projectDescription: string;
	amount: number | null;
	lineItems: Array<{ description: string; quantity: number; rate: number; amount: number }>;
	dueDate: string | null;
	startDate: string | null;
	confidence: number;
}

export async function extractEntities(
	transcript: string,
	apiKey: string
): Promise<ExtractedEntities> {
	if (!apiKey || apiKey === 'your_openai_key') {
		return extractEntitiesMock(transcript);
	}

	const openai = new OpenAI({ apiKey });

	try {
		const response = await openai.chat.completions.create({
			model: 'gpt-4-turbo-preview',
			response_format: { type: 'json_object' },
			messages: [
				{
					role: 'system',
					content: `You extract structured data from contractor voice transcripts.

Return JSON with:
- documentType: "invoice" if mentions money/payment/cost/quote, else "contract"
- clientName: extracted client name or null
- clientEmail: extracted email or null
- clientPhone: extracted phone or null
- clientAddress: extracted address or null
- projectDescription: brief description of work
- amount: total dollar amount or null
- lineItems: array of {description, quantity, rate, amount} or empty array
- dueDate: ISO date string or null
- startDate: ISO date string or null
- confidence: 0-1 how confident you are

Be aggressive about extracting - guess intelligently from context.`
				},
				{
					role: 'user',
					content: transcript
				}
			]
		});

		return JSON.parse(response.choices[0].message.content || '{}');
	} catch (error) {
		console.error('OpenAI extraction error:', error);
		return extractEntitiesMock(transcript);
	}
}

function extractEntitiesMock(transcript: string): ExtractedEntities {
	const text = transcript.toLowerCase();

	// Detect document type
	const invoiceKeywords = [
		'invoice',
		'bill',
		'payment',
		'paid',
		'owe',
		'hours worked',
		'total due'
	];
	const contractKeywords = ['contract', 'agreement', 'quote', 'estimate', 'proposal', 'start date'];

	const invoiceScore = invoiceKeywords.filter((kw) => text.includes(kw)).length;
	const contractScore = contractKeywords.filter((kw) => text.includes(kw)).length;

	const documentType = invoiceScore > contractScore ? 'invoice' : 'contract';

	// Extract client name
	const namePatterns = [
		/(?:for|to|client|customer|mr\.?|mrs\.?|ms\.?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i
	];

	let clientName: string | null = null;
	for (const pattern of namePatterns) {
		const match = transcript.match(pattern);
		if (match) {
			clientName = match[1].trim();
			break;
		}
	}

	// Extract amounts
	const amountMatches = transcript.match(/\$[\d,]+(?:\.\d{2})?/g);
	const amounts = amountMatches ? amountMatches.map((a) => parseFloat(a.replace(/[$,]/g, ''))) : [];
	const amount = amounts.length > 0 ? Math.max(...amounts) : null;

	// Extract email
	const emailMatch = transcript.match(/[\w.-]+@[\w.-]+\.\w+/);
	const clientEmail = emailMatch ? emailMatch[0] : null;

	// Extract phone
	const phoneMatch = transcript.match(
		/(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/
	);
	const clientPhone = phoneMatch ? phoneMatch[0] : null;

	// Generate line items
	const lineItems: ExtractedEntities['lineItems'] = [];
	if (amount) {
		lineItems.push({
			description: 'Services rendered',
			quantity: 1,
			rate: amount,
			amount: amount
		});
	}

	return {
		documentType,
		clientName,
		clientEmail,
		clientPhone,
		clientAddress: null,
		projectDescription: transcript.slice(0, 100) + (transcript.length > 100 ? '...' : ''),
		amount,
		lineItems,
		dueDate: null,
		startDate: null,
		confidence: clientName && amount ? 0.8 : 0.6
	};
}
