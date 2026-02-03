import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import OpenAI from 'openai';

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.session) {
		throw error(401, 'Unauthorized');
	}

	const OPENAI_API_KEY = platform?.env?.OPENAI_API_KEY;
	if (!OPENAI_API_KEY) {
		throw error(500, 'OpenAI API key not configured');
	}

	const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

	const formData = await request.formData();
	const audioFile = formData.get('audio') as File;

	if (!audioFile) {
		throw error(400, 'No audio file provided');
	}

	try {
		// Transcribe with Whisper
		const transcription = await openai.audio.transcriptions.create({
			file: audioFile,
			model: 'whisper-1',
			language: 'en'
		});

		// Extract structured data with GPT-4
		const extraction = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{
					role: 'system',
					content: `Extract invoice/estimate data from this transcript. Return JSON with:
          - client_name, client_email (if mentioned)
          - line_items: [{description, quantity, unit_price}]
          - notes (any additional context)
          - document_type: "invoice" or "estimate"
          - total (if explicitly mentioned)`
				},
				{ role: 'user', content: transcription.text }
			],
			response_format: { type: 'json_object' }
		});

		const extractedData = JSON.parse(extraction.choices[0].message.content || '{}');

		return json({
			transcript: transcription.text,
			extractedData
		});
	} catch (err) {
		console.error('Transcription error:', err);
		throw error(500, 'Failed to process audio');
	}
};
