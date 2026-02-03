import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const association = {
		applinks: {
			apps: [],
			details: [
				{
					appID: 'TEAMID.com.mrblu.app',
					paths: ['/auth/*', '/view/*', '/dashboard/*']
				}
			]
		},
		webcredentials: {
			apps: ['TEAMID.com.mrblu.app']
		}
	};

	return json(association, {
		headers: {
			'Content-Type': 'application/json'
		}
	});
};
