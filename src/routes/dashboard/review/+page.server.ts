import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	const session = locals.session;
	if (!session) {
		throw redirect(303, '/login');
	}

	const transcript = url.searchParams.get('transcript');
	const sessionId = url.searchParams.get('session');
	const resumeId = url.searchParams.get('resume');

	// Valid entry: has transcript (coming from recording via URL)
	if (transcript) {
		return { entryMode: 'new' as const, transcript };
	}

	// Valid entry: has session ID (resuming via database)
	if (sessionId) {
		const { data: reviewSession, error } = await locals.supabase
			.from('review_sessions')
			.select('*')
			.eq('id', sessionId)
			.eq('user_id', session.user.id)
			.eq('status', 'in_progress')
			.single();

		if (error || !reviewSession) {
			// Session not found or completed - redirect to dashboard
			throw redirect(303, '/dashboard');
		}

		return {
			entryMode: 'resume' as const,
			reviewSession
		};
	}

	// Valid entry: has resume ID (legacy sessionStorage-based resume)
	if (resumeId) {
		return { entryMode: 'legacy_resume' as const, resumeId };
	}

	// No URL params - allow page to load, client will check sessionStorage
	// This handles the flow where transcript is passed via sessionStorage
	return { entryMode: 'sessionStorage' as const };
};
