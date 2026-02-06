/**
 * Input Validation & Sanitization Utilities
 *
 * Server-side validation for all user inputs.
 */

/**
 * Validate email format
 * RFC 5322 compliant regex for most common email formats
 */
export function isValidEmail(email: string): boolean {
	if (!email || typeof email !== 'string') return false;

	// Max length check (RFC 5321)
	if (email.length > 254) return false;

	// Basic format validation
	const emailRegex =
		/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

	if (!emailRegex.test(email)) return false;

	// Check local part length (before @)
	const [localPart] = email.split('@');
	if (localPart.length > 64) return false;

	return true;
}

/**
 * Validate phone number format
 * Accepts international formats with optional + prefix
 */
export function isValidPhone(phone: string): boolean {
	if (!phone || typeof phone !== 'string') return false;

	// Remove common separators for validation
	const cleaned = phone.replace(/[\s\-.()]/g, '');

	// Should be digits only, optionally starting with +
	const phoneRegex = /^\+?[0-9]{7,15}$/;
	return phoneRegex.test(cleaned);
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
	if (!uuid || typeof uuid !== 'string') return false;

	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return uuidRegex.test(uuid);
}

/**
 * Sanitize string input
 * Removes potentially dangerous characters while preserving readability
 */
export function sanitizeString(
	input: string,
	options: {
		maxLength?: number;
		allowNewlines?: boolean;
		allowHtml?: boolean;
	} = {}
): string {
	if (!input || typeof input !== 'string') return '';

	let sanitized = input;

	// Trim whitespace
	sanitized = sanitized.trim();

	// Remove null bytes
	sanitized = sanitized.replace(/\0/g, '');

	// Remove control characters (except newlines if allowed)
	if (options.allowNewlines) {
		// eslint-disable-next-line no-control-regex
		sanitized = sanitized.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '');
	} else {
		// eslint-disable-next-line no-control-regex
		sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, ' ');
	}

	// Escape HTML if not allowed
	if (!options.allowHtml) {
		sanitized = escapeHtml(sanitized);
	}

	// Enforce max length
	if (options.maxLength && sanitized.length > options.maxLength) {
		sanitized = sanitized.slice(0, options.maxLength);
	}

	return sanitized;
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(str: string): string {
	const htmlEscapes: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#39;',
		'/': '&#x2F;',
		'`': '&#x60;',
		'=': '&#x3D;'
	};

	return str.replace(/[&<>"'`=/]/g, (char) => htmlEscapes[char] || char);
}

/**
 * Sanitize object recursively
 * Useful for sanitizing entire request bodies
 */
export function sanitizeObject<T extends Record<string, unknown>>(
	obj: T,
	options: {
		maxStringLength?: number;
		maxDepth?: number;
	} = {}
): T {
	const maxDepth = options.maxDepth ?? 10;
	const maxStringLength = options.maxStringLength ?? 10000;

	function sanitizeValue(value: unknown, depth: number): unknown {
		if (depth > maxDepth) return null;

		if (value === null || value === undefined) {
			return value;
		}

		if (typeof value === 'string') {
			return sanitizeString(value, { maxLength: maxStringLength });
		}

		if (typeof value === 'number' || typeof value === 'boolean') {
			return value;
		}

		if (Array.isArray(value)) {
			return value.map((item) => sanitizeValue(item, depth + 1));
		}

		if (typeof value === 'object') {
			const sanitized: Record<string, unknown> = {};
			for (const [key, val] of Object.entries(value)) {
				// Sanitize keys too
				const sanitizedKey = sanitizeString(key, { maxLength: 100 });
				sanitized[sanitizedKey] = sanitizeValue(val, depth + 1);
			}
			return sanitized;
		}

		return null;
	}

	return sanitizeValue(obj, 0) as T;
}

/**
 * Validate and parse JSON safely
 */
export function safeParseJson<T>(
	json: string
): { success: true; data: T } | { success: false; error: string } {
	try {
		const data = JSON.parse(json) as T;
		return { success: true, data };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Invalid JSON'
		};
	}
}

/**
 * Validate numeric input
 */
export function isValidNumber(
	value: unknown,
	options: {
		min?: number;
		max?: number;
		integer?: boolean;
	} = {}
): value is number {
	if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
		return false;
	}

	if (options.integer && !Number.isInteger(value)) {
		return false;
	}

	if (options.min !== undefined && value < options.min) {
		return false;
	}

	if (options.max !== undefined && value > options.max) {
		return false;
	}

	return true;
}

/**
 * Validate date string (ISO 8601)
 */
export function isValidDate(dateString: string): boolean {
	if (!dateString || typeof dateString !== 'string') return false;

	const date = new Date(dateString);
	return !isNaN(date.getTime());
}

/**
 * Check for SQL injection patterns (defense in depth)
 * Note: Always use parameterized queries as primary defense
 */
export function hasSqlInjectionPatterns(input: string): boolean {
	if (!input || typeof input !== 'string') return false;

	const patterns = [
		/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)/i,
		/(--|#|\/\*|\*\/)/,
		/(\bOR\b|\bAND\b)\s*[\d'"].*?=/i,
		/['"]\s*(OR|AND)\s*['"]/i
	];

	return patterns.some((pattern) => pattern.test(input));
}

/**
 * Validate URL format
 */
export function isValidUrl(
	url: string,
	options: {
		allowedProtocols?: string[];
	} = {}
): boolean {
	if (!url || typeof url !== 'string') return false;

	try {
		const parsed = new URL(url);
		const allowedProtocols = options.allowedProtocols ?? ['http:', 'https:'];
		return allowedProtocols.includes(parsed.protocol);
	} catch {
		return false;
	}
}
