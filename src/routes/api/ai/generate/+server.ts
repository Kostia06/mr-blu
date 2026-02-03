import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import OpenAI from 'openai';

export const POST: RequestHandler = async ({ locals, request, platform }) => {
	if (!locals.session) {
		throw error(401, 'Unauthorized');
	}

	const OPENAI_API_KEY = platform?.env?.OPENAI_API_KEY;
	if (!OPENAI_API_KEY) {
		throw error(500, 'OpenAI API key not configured');
	}

	const { prompt, context } = await request.json();

	if (!prompt) {
		throw error(400, 'Missing prompt');
	}

	const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

	try {
		const completion = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{
					role: 'system',
					content: `You are an assistant helping create professional invoices and estimates.
                  Generate clear, professional content based on the user's input.
                  Be concise and business-appropriate.`
				},
				{
					role: 'user',
					content: context ? `Context: ${JSON.stringify(context)}\n\nRequest: ${prompt}` : prompt
				}
			],
			max_tokens: 1000
		});

		return json({
			content: completion.choices[0].message.content
		});
	} catch (err) {
		console.error('AI generation error:', err);
		throw error(500, 'Failed to generate content');
	}
};
