import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GEMINI_API_KEY } from '$env/static/private';
import { logger } from '$lib/server/logger';
import {
	rateLimiters,
	getClientIdentifier,
	rateLimitResponse,
	sanitizeString
} from '$lib/server/security';

// Use direct REST API to avoid Node 25 compatibility issues with google-auth-library
// Using Gemini 2.0 Flash
const GEMINI_API_URL =
	'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface GeminiResponse {
	candidates?: Array<{
		content?: {
			parts?: Array<{
				text?: string;
			}>;
		};
	}>;
	error?: {
		message: string;
		code: number;
	};
}

async function callGemini(prompt: string): Promise<string> {
	if (!GEMINI_API_KEY) {
		throw new Error('GEMINI_API_KEY is not configured');
	}

	const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			contents: [
				{
					parts: [{ text: prompt }]
				}
			],
			generationConfig: {
				temperature: 0.1,
				maxOutputTokens: 2048
			}
		})
	});

	const data: GeminiResponse = await response.json();

	if (data.error) {
		throw new Error(`Gemini API error: ${data.error.message}`);
	}

	const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
	if (!text) {
		throw new Error('No response from Gemini API');
	}

	return text;
}

const PARSE_PROMPT = `You are a voice-to-document parser for a contractor invoicing app.

DETERMINE INTENT:
1. "document_action" - CREATE new invoice/estimate (default for most requests)
2. "information_query" - ASKING about existing data ("what invoices for John?", "how much last month?")
3. "document_clone" - COPY existing doc for different client ("same as John's for Mike")
4. "document_send" - SEND existing doc ("send Jackson's estimate", "email the invoice")
5. "document_transform" - CONVERT type ("turn estimate into invoice")

Convert spoken numbers: "5k"→5000, "five hundred"→500

RESPOND WITH VALID JSON ONLY:

FOR document_action:
{
  "intentType": "document_action",
  "documentType": "invoice" or "estimate",
  "client": {"name": "string or null", "firstName": "string or null", "lastName": "string or null", "email": "string or null", "phone": "string or null", "address": "string or null"},
  "items": [{"description": "string", "quantity": number, "unit": "string", "rate": number, "total": number, "material": "string or null", "measurementType": "sqft/linear_ft/unit/hour/job or null", "dimensions": {"width": number, "length": number, "unit": "ft"} or null}],
  "total": number,
  "taxRate": number or null,
  "taxes": [{"type": "GST/PST/HST/QST/CUSTOM", "name": "string", "rate": number}] or null,
  "dueDate": "YYYY-MM-DD or null",
  "actions": [{"type": "create_document/send_email/send_sms/save_draft", "order": number, "details": {"recipient": "string or null"}}],
  "summary": "Brief description of what will be created",
  "confidence": {"overall": 0-1, "client": 0-1, "items": 0-1, "actions": 0-1}
}

FOR information_query:
{
  "intentType": "information_query",
  "query": {"type": "list/sum/count", "documentTypes": ["invoice"], "clientName": "string or null", "status": "draft/sent/paid/pending/overdue or null", "dateRange": {"period": "this_month/last_month/this_week or null"}},
  "summary": "What user is asking",
  "naturalLanguageQuery": "Rephrased question",
  "confidence": {"overall": 0-1}
}

FOR document_clone:
{
  "intentType": "document_clone",
  "sourceClient": "client to copy FROM",
  "targetClient": {"name": "new client name"},
  "documentType": "invoice/estimate or null",
  "actions": [{"type": "create_document", "order": 1}],
  "summary": "Brief description",
  "confidence": {"overall": 0-1}
}

FOR document_send:
{
  "intentType": "document_send",
  "clientName": "client whose doc to send",
  "documentType": "invoice/estimate or null",
  "selector": "last/latest",
  "deliveryMethod": "email/sms/whatsapp",
  "recipient": {"email": null, "phone": null, "clientName": null},
  "summary": "Brief description",
  "confidence": {"overall": 0-1}
}

FOR document_transform:
{
  "intentType": "document_transform",
  "source": {"clientName": "string", "documentType": "invoice/estimate", "selector": "last"},
  "conversion": {"enabled": true, "targetType": "invoice/estimate"},
  "summary": "Brief description",
  "confidence": {"overall": 0-1}
}

KEY EXAMPLES:
- "Invoice for John 500 dollars" → document_action with client.name="John", total=500
- "Invoice for Mike, flooring 24x26 ft for 3000" → document_action with material="flooring", dimensions
- "What invoices did I send to John?" → information_query
- "Same invoice as John for Mike" → document_clone, sourceClient="John", targetClient.name="Mike"
- "Send Jackson's estimate" → document_send, clientName="Jackson"
- "Turn Jackson's estimate into invoice" → document_transform
- "plus GST" → taxes with GST 5%
- "Ontario tax" → taxes with HST 13%

IMPORTANT: All item descriptions MUST be in English regardless of the input language. Translate any non-English item descriptions to English. Only translate item description text - keep client names, addresses, and other proper nouns as-is.

Tax rates should be whole percentages (e.g., 5 for 5%, 13 for 13%, NOT 0.05 or 0.13).

TRANSCRIPTION:
`;

export const POST: RequestHandler = async ({ request, locals }) => {
	// Check authentication (session already validated in auth guard hook)
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = session.user.id;
	const rateLimit = rateLimiters.ai(userId);
	if (!rateLimit.allowed) {
		return rateLimitResponse(rateLimit.resetIn);
	}

	try {
		const { transcription } = await request.json();

		if (!transcription || typeof transcription !== 'string') {
			return json({ error: 'Missing transcription' }, { status: 400 });
		}

		// Sanitize and limit transcription length
		const sanitizedTranscription = sanitizeString(transcription, {
			maxLength: 10000,
			allowNewlines: true
		});

		if (!sanitizedTranscription.trim()) {
			return json({ error: 'Transcription is empty' }, { status: 400 });
		}

		// Call Gemini API via REST
		const text = await callGemini(PARSE_PROMPT + sanitizedTranscription);

		// Extract JSON from response (handle markdown code blocks if present)
		let jsonStr = text;
		const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
		if (jsonMatch) {
			jsonStr = jsonMatch[1];
		}

		// Parse the JSON response
		const parsed = JSON.parse(jsonStr);

		// Handle based on intent type
		if (parsed.intentType === 'information_query') {
			// Return query data for the frontend to execute
			return json({
				success: true,
				intentType: 'information_query',
				data: {
					query: parsed.query,
					summary: parsed.summary,
					naturalLanguageQuery: parsed.naturalLanguageQuery,
					confidence: parsed.confidence
				}
			});
		}

		if (parsed.intentType === 'document_clone') {
			// Return clone data for the frontend to search and select source document
			return json({
				success: true,
				intentType: 'document_clone',
				data: {
					sourceClient: parsed.sourceClient,
					targetClient: parsed.targetClient,
					documentType: parsed.documentType,
					modifications: parsed.modifications || {},
					actions: (parsed.actions || []).map((action: Record<string, unknown>, index: number) => ({
						...action,
						id: `action-${Date.now()}-${index}`,
						order: action.order ?? index + 1,
						status: 'pending'
					})),
					summary: parsed.summary,
					confidence: parsed.confidence
				}
			});
		}

		if (parsed.intentType === 'document_send') {
			// Return send data for the frontend to find and send existing document
			return json({
				success: true,
				intentType: 'document_send',
				data: {
					clientName: parsed.clientName,
					documentType: parsed.documentType,
					selector: parsed.selector || 'last',
					deliveryMethod: parsed.deliveryMethod || 'email',
					recipient: parsed.recipient || {},
					summary: parsed.summary,
					confidence: parsed.confidence
				}
			});
		}

		if (parsed.intentType === 'document_transform') {
			// Return transform data for the frontend to find source document and convert it
			return json({
				success: true,
				intentType: 'document_transform',
				data: {
					source: {
						clientName: parsed.source?.clientName || null,
						documentType: parsed.source?.documentType || null,
						selector: parsed.source?.selector || 'last',
						documentNumber: parsed.source?.documentNumber || null
					},
					conversion: {
						enabled: parsed.conversion?.enabled || false,
						targetType: parsed.conversion?.targetType || 'invoice'
					},
					actions: (parsed.actions || []).map((action: Record<string, unknown>, index: number) => ({
						...action,
						id: `action-${Date.now()}-${index}`,
						order: action.order ?? index + 1
					})),
					summary: parsed.summary,
					confidence: parsed.confidence || {
						overall: 0.8,
						source: 0.8,
						conversion: 0.8
					}
				}
			});
		}

		// Default: document_action
		// Generate IDs for items
		if (parsed.items) {
			parsed.items = parsed.items.map((item: Record<string, unknown>, index: number) => ({
				...item,
				id: `item-${Date.now()}-${index}`
			}));
		}

		// Create default line item if total exists but no items
		// This handles cases like "Invoice for Abel for $500" where AI returns total without items
		if ((!parsed.items || parsed.items.length === 0) && parsed.total > 0) {
			parsed.items = [
				{
					id: `item-${Date.now()}-0`,
					description: 'Service',
					quantity: 1,
					unit: 'unit',
					rate: parsed.total,
					total: parsed.total
				}
			];
		}

		// Generate IDs for actions and ensure order
		if (parsed.actions) {
			parsed.actions = parsed.actions.map((action: Record<string, unknown>, index: number) => ({
				...action,
				id: `action-${Date.now()}-${index}`,
				order: action.order ?? index + 1,
				status: 'pending'
			}));
		} else {
			// Default to just create_document if no actions specified
			parsed.actions = [
				{
					id: `action-${Date.now()}-0`,
					type: 'create_document',
					order: 1,
					status: 'pending',
					details: {}
				}
			];
		}

		// Calculate subtotal if not present
		if (!parsed.subtotal && parsed.items) {
			parsed.subtotal = parsed.items.reduce(
				(sum: number, item: { total?: number }) => sum + (item.total || 0),
				0
			);
		}

		// Handle multi-tax support
		if (parsed.taxes && Array.isArray(parsed.taxes) && parsed.taxes.length > 0) {
			// Calculate combined tax rate and amounts from taxes array
			let totalTaxAmount = 0;
			const taxCalculationMode = parsed.taxCalculationMode || 'exclusive';

			if (taxCalculationMode === 'exclusive') {
				// Taxes added to subtotal
				for (const tax of parsed.taxes) {
					if (!tax.isExempt) {
						const taxAmount = (parsed.subtotal || 0) * (tax.rate / 100);
						tax.amount = Math.round(taxAmount * 100) / 100;
						totalTaxAmount += tax.amount;
					} else {
						tax.amount = 0;
					}
				}
			} else {
				// Prices include tax - back-calculate
				const combinedRate = parsed.taxes.reduce(
					(sum: number, tax: { rate: number; isExempt?: boolean }) =>
						sum + (tax.isExempt ? 0 : tax.rate / 100),
					0
				);
				const backCalculatedSubtotal =
					Math.round(((parsed.subtotal || 0) / (1 + combinedRate)) * 100) / 100;
				parsed.subtotal = backCalculatedSubtotal;

				for (const tax of parsed.taxes) {
					if (!tax.isExempt) {
						const taxAmount = backCalculatedSubtotal * (tax.rate / 100);
						tax.amount = Math.round(taxAmount * 100) / 100;
						totalTaxAmount += tax.amount;
					} else {
						tax.amount = 0;
					}
				}
			}

			parsed.taxAmount = totalTaxAmount;
			parsed.taxRate = parsed.taxes.reduce(
				(sum: number, tax: { rate: number; isExempt?: boolean }) =>
					sum + (tax.isExempt ? 0 : tax.rate),
				0
			);

			if (!parsed.total) {
				parsed.total = (parsed.subtotal || 0) + totalTaxAmount;
			}
		} else if (parsed.taxRate && parsed.subtotal) {
			// Legacy single-tax calculation
			parsed.taxAmount = parsed.subtotal * (parsed.taxRate / 100);
			if (!parsed.total) {
				parsed.total = parsed.subtotal + parsed.taxAmount;
			}
		}

		// Normalize tax rates that come as decimals (0.05 → 5)
		if (parsed.taxRate && parsed.taxRate > 0 && parsed.taxRate < 1) {
			parsed.taxRate = parsed.taxRate * 100;
		}
		if (parsed.taxes && Array.isArray(parsed.taxes)) {
			for (const tax of parsed.taxes) {
				if (tax.rate && tax.rate > 0 && tax.rate < 1) {
					tax.rate = tax.rate * 100;
				}
			}
		}

		return json({
			success: true,
			intentType: 'document_action',
			data: parsed
		});
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		logger.error('ai_parse', err.message, {
			stack: err.stack,
			user_id: locals.session?.user?.id,
			request_path: '/api/ai/parse',
			request_method: 'POST'
		});

		// Check for rate limit error
		const errorMessage = error instanceof Error ? error.message : String(error);
		const isRateLimited =
			errorMessage.includes('429') ||
			errorMessage.includes('RESOURCE_EXHAUSTED') ||
			errorMessage.includes('quota');

		// Extract retry delay if available
		let retryMessage = '';
		const retryMatch = errorMessage.match(/retry in (\d+(?:\.\d+)?)/i);
		if (retryMatch) {
			const seconds = Math.ceil(parseFloat(retryMatch[1]));
			retryMessage = ` Please try again in ${seconds} seconds.`;
		}

		// Return a fallback response with empty structure
		return json({
			success: false,
			intentType: 'document_action',
			error: isRateLimited
				? `AI service is temporarily busy.${retryMessage} You can enter details manually below.`
				: error instanceof Error
					? error.message
					: 'Failed to parse transcription',
			isRateLimited,
			data: {
				documentType: 'invoice',
				client: { name: null, email: null, phone: null, address: null },
				items: [],
				subtotal: 0,
				taxRate: null,
				taxAmount: 0,
				total: 0,
				dueDate: null,
				actions: [
					{
						id: 'action-fallback-0',
						type: 'create_document',
						order: 1,
						status: 'pending',
						details: {}
					}
				],
				summary: isRateLimited
					? 'AI service busy. Please enter details manually or try again shortly.'
					: 'Could not parse the transcription. Please enter details manually.',
				confidence: { overall: 0, client: 0, items: 0, actions: 0 }
			}
		});
	}
};
