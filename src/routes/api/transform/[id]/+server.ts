import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTransformJob, cancelTransformJob } from '$lib/services/transform';

// GET /api/transform/[id] - Get transform job details
export const GET: RequestHandler = async ({ params, locals }) => {
	// Session already validated in auth guard hook
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = params;

	if (!id) {
		return json({ error: 'Transform job ID is required' }, { status: 400 });
	}

	try {
		const job = await getTransformJob(id);

		if (!job) {
			return json({ error: 'Transform job not found' }, { status: 404 });
		}

		return json({
			success: true,
			job
		});
	} catch (error) {
		console.error('Get transform job error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to get transform job' },
			{ status: 500 }
		);
	}
};

// DELETE /api/transform/[id] - Cancel transform job
export const DELETE: RequestHandler = async ({ params, locals }) => {
	// Session already validated in auth guard hook
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = params;

	if (!id) {
		return json({ error: 'Transform job ID is required' }, { status: 400 });
	}

	try {
		const success = await cancelTransformJob(id);

		if (!success) {
			return json({ error: 'Failed to cancel transform job' }, { status: 400 });
		}

		return json({
			success: true,
			message: 'Transform job cancelled'
		});
	} catch (error) {
		console.error('Cancel transform job error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to cancel transform job' },
			{ status: 500 }
		);
	}
};
