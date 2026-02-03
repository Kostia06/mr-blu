import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GEMINI_API_KEY } from '$env/static/private';
import { sanitizeString } from '$lib/server/security';
import type { AIEditCommand, AIEditResponse } from '$lib/types/review';

// Using Gemini 2.0 Flash - the latest stable flash model
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

const EDIT_PROMPT = `You are an AI assistant for editing invoices and estimates in a contractor/freelancer app.

The user will give you a voice command or text instruction to EDIT an existing document. Parse the command and return a list of edit commands.

EDIT COMMAND TYPES:
- "edit_total" - Change the total amount of an item (payload: { itemIndex: number, newTotal: number })
- "edit_rate" - Change the rate of an item (payload: { itemIndex: number, newRate: number })
- "edit_quantity" - Change quantity (payload: { itemIndex: number, newQuantity: number })
- "add_item" - Add a new line item (payload: { description: string, total: number, quantity?: number, rate?: number })
- "remove_item" - Remove an item (payload: { itemIndex: number } or { description: string })
- "edit_item_description" - Change item description (payload: { itemIndex: number, newDescription: string })
- "change_document_type" - Convert between invoice/estimate (payload: { type: "invoice" | "estimate" })
- "add_tax" - Add or change tax rate (payload: { rate: number })
- "remove_tax" - Remove tax (payload: {})
- "edit_client_email" - Change client email (payload: { email: string })
- "edit_client_phone" - Change client phone (payload: { phone: string })
- "edit_client_name" - Change client name (payload: { name: string })
- "add_discount" - Add discount (payload: { type: "percentage" | "fixed", value: number })
- "remove_discount" - Remove discount (payload: {})

Convert spoken numbers to digits (e.g., "five thousand" → 5000, "5k" → 5000).
If the user says "total" without specifying an item, assume they mean the first/main item (itemIndex: 0).

Respond ONLY with valid JSON in this format:
{
  "changes": [
    {
      "type": "edit_total",
      "payload": { "itemIndex": 0, "newTotal": 3500 },
      "description": "Change total to $3,500",
      "beforeValue": "$3,000",
      "afterValue": "$3,500"
    }
  ],
  "summary": "Brief summary of all changes"
}

EXAMPLES:
- "Change total to 3500" → edit_total with newTotal: 3500
- "Add a 500 dollar delivery fee" → add_item with description: "Delivery fee", total: 500
- "Make it an estimate" → change_document_type with type: "estimate"
- "Add 8% tax" → add_tax with rate: 8
- "Remove tax" → remove_tax
- "Change rate to 15 dollars per sqft" → edit_rate with newRate: 15
- "Add 10% discount" → add_discount with type: "percentage", value: 10
- "Send to john@email.com instead" → edit_client_email with email: "john@email.com"
- "Change quantity to 100" → edit_quantity with newQuantity: 100

USER INPUT:
`;

export const POST: RequestHandler = async ({ request, locals }) => {
	// Session already validated in auth guard hook
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { input } = await request.json();

		if (!input || typeof input !== 'string') {
			return json({ error: 'Missing input' }, { status: 400 });
		}

		// Sanitize input
		const sanitizedInput = sanitizeString(input, {
			maxLength: 1000,
			allowNewlines: false
		});

		if (!sanitizedInput.trim()) {
			return json({ error: 'Input is empty' }, { status: 400 });
		}

		// Call Gemini API
		const text = await callGemini(EDIT_PROMPT + sanitizedInput);

		// Extract JSON from response
		let jsonStr = text;
		const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
		if (jsonMatch) {
			jsonStr = jsonMatch[1];
		}

		// Parse the JSON response
		const parsed: AIEditResponse = JSON.parse(jsonStr);

		// Validate response structure
		if (!parsed.changes || !Array.isArray(parsed.changes)) {
			return json({
				changes: [],
				summary: "Couldn't understand that command. Try being more specific."
			});
		}

		return json({
			changes: parsed.changes,
			summary: parsed.summary || 'Changes detected'
		});
	} catch (error) {
		console.error('Parse edit error:', error);

		// Return empty changes on error
		return json({
			changes: [],
			summary: "Couldn't parse the edit command. Please try again."
		});
	}
};
