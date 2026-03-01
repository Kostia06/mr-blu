import { supabase } from '@/lib/supabase/client';

export interface BetaSignup {
	id: string;
	email: string;
	status: 'pending' | 'confirmed';
	added_at: string;
	confirmed_at: string | null;
	notes: string | null;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
	const {
		data: { session },
	} = await supabase.auth.getSession();
	if (!session) throw new Error('Not authenticated');
	return {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${session.access_token}`,
	};
}

export async function getBetaSignups(): Promise<BetaSignup[]> {
	const headers = await getAuthHeaders();
	const response = await fetch('/api/admin/beta', { headers });

	if (response.status === 403) return [];
	if (!response.ok) throw new Error('Failed to fetch signups');

	const data = (await response.json()) as { signups: BetaSignup[] };
	return data.signups;
}

export async function isAdmin(): Promise<boolean> {
	try {
		const headers = await getAuthHeaders();
		const response = await fetch('/api/admin/beta', {
			method: 'GET',
			headers,
		});
		return response.ok;
	} catch {
		return false;
	}
}

export async function confirmBetaUser(email: string): Promise<void> {
	const headers = await getAuthHeaders();
	const response = await fetch('/api/admin/beta', {
		method: 'POST',
		headers,
		body: JSON.stringify({ action: 'confirm', email }),
	});
	if (!response.ok) throw new Error('Failed to confirm user');
}

export async function addBetaUser(email: string): Promise<void> {
	const headers = await getAuthHeaders();
	const response = await fetch('/api/admin/beta', {
		method: 'POST',
		headers,
		body: JSON.stringify({ action: 'add', email }),
	});
	if (!response.ok) throw new Error('Failed to add user');
}

export async function removeBetaUser(email: string): Promise<void> {
	const headers = await getAuthHeaders();
	const response = await fetch('/api/admin/beta', {
		method: 'POST',
		headers,
		body: JSON.stringify({ action: 'remove', email }),
	});
	if (!response.ok) throw new Error('Failed to remove user');
}

// Feedback

export interface FeedbackItem {
	id: string;
	user_id: string;
	comment: string;
	category: string;
	page_context: string | null;
	created_at: string;
	profiles: { email: string | null; full_name: string | null } | null;
}

export async function getFeedback(): Promise<FeedbackItem[]> {
	const headers = await getAuthHeaders();
	const response = await fetch('/api/admin/feedback', { headers });
	if (!response.ok) return [];
	const data = (await response.json()) as { feedback: FeedbackItem[] };
	return data.feedback;
}

export async function deleteFeedback(id: string): Promise<void> {
	const headers = await getAuthHeaders();
	const response = await fetch('/api/admin/feedback', {
		method: 'POST',
		headers,
		body: JSON.stringify({ action: 'delete', id }),
	});
	if (!response.ok) throw new Error('Failed to delete feedback');
}

// Errors

export interface ErrorLogItem {
	id: string;
	created_at: string;
	severity: string;
	error_type: string;
	message: string;
	stack: string | null;
	request_path: string | null;
	request_method: string | null;
	status_code: number | null;
	resolved: boolean;
}

export async function getErrorLogs(): Promise<ErrorLogItem[]> {
	const headers = await getAuthHeaders();
	const response = await fetch('/api/admin/errors', { headers });
	if (!response.ok) return [];
	const data = (await response.json()) as { errors: ErrorLogItem[] };
	return data.errors;
}

export async function resolveError(id: string): Promise<void> {
	const headers = await getAuthHeaders();
	const response = await fetch('/api/admin/errors', {
		method: 'POST',
		headers,
		body: JSON.stringify({ action: 'resolve', id }),
	});
	if (!response.ok) throw new Error('Failed to resolve error');
}

export async function deleteError(id: string): Promise<void> {
	const headers = await getAuthHeaders();
	const response = await fetch('/api/admin/errors', {
		method: 'POST',
		headers,
		body: JSON.stringify({ action: 'delete', id }),
	});
	if (!response.ok) throw new Error('Failed to delete error');
}
