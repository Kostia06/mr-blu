// Enable SSR for landing page - critical for performance
// This overrides the global ssr=false in +layout.ts
export const ssr = true;
export const prerender = false;

import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	// Get session from parent layout if available
	const parentData = await parent();
	return {
		session: parentData?.session ?? null
	};
};
