// Deprecated — feedback is now managed via /api/admin/feedback
export const onRequestPost: PagesFunction = async () => {
	return new Response(JSON.stringify({ error: 'Use /api/admin/feedback instead' }), {
		status: 410,
		headers: { 'Content-Type': 'application/json' },
	});
};
