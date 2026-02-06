import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { notifyError } from '$lib/server/notify-dev';

type Severity = 'info' | 'warn' | 'error' | 'critical';

interface LogEntry {
	severity: Severity;
	error_type: string;
	message: string;
	stack?: string;
	user_id?: string;
	request_path?: string;
	request_method?: string;
	status_code?: number;
	metadata?: Record<string, unknown>;
}

let _adminClient: ReturnType<typeof createClient> | null = null;

function getAdminClient() {
	if (!_adminClient) {
		_adminClient = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
	}
	return _adminClient;
}

async function log(entry: LogEntry): Promise<void> {
	// Always console log
	const consoleMethod = entry.severity === 'critical' || entry.severity === 'error'
		? console.error
		: entry.severity === 'warn'
			? console.warn
			: console.log;

	consoleMethod(`[${entry.severity.toUpperCase()}] ${entry.error_type}: ${entry.message}`);

	// Persist to DB (fire-and-forget, don't block the request)
	try {
		const client = getAdminClient();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await (client.from('error_logs') as any).insert({
			severity: entry.severity,
			error_type: entry.error_type,
			message: entry.message,
			stack: entry.stack?.substring(0, 10000),
			user_id: entry.user_id || null,
			request_path: entry.request_path,
			request_method: entry.request_method,
			status_code: entry.status_code,
			metadata: entry.metadata || {}
		});
	} catch (dbError) {
		// Fallback: if DB logging fails, only console
		console.error('[LOGGER] Failed to persist error log:', dbError);
	}

	// Email dev on error/critical
	if (entry.severity === 'error' || entry.severity === 'critical') {
		notifyError({
			severity: entry.severity,
			errorType: entry.error_type,
			message: entry.message,
			stack: entry.stack,
			requestPath: entry.request_path,
			requestMethod: entry.request_method,
			statusCode: entry.status_code,
			userId: entry.user_id
		});
	}
}

export const logger = {
	info(type: string, message: string, meta?: Partial<LogEntry>) {
		return log({ severity: 'info', error_type: type, message, ...meta });
	},
	warn(type: string, message: string, meta?: Partial<LogEntry>) {
		return log({ severity: 'warn', error_type: type, message, ...meta });
	},
	error(type: string, message: string, meta?: Partial<LogEntry>) {
		return log({ severity: 'error', error_type: type, message, ...meta });
	},
	critical(type: string, message: string, meta?: Partial<LogEntry>) {
		return log({ severity: 'critical', error_type: type, message, ...meta });
	}
};
