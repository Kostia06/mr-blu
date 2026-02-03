/**
 * Security Utilities
 *
 * Centralized security utilities for the Mr.Blu application.
 */

// Rate limiting
export {
	checkRateLimit,
	createRateLimiter,
	rateLimiters,
	getClientIdentifier,
	rateLimitResponse
} from './rate-limit';

// Validation & sanitization
export {
	isValidEmail,
	isValidPhone,
	isValidUUID,
	isValidNumber,
	isValidDate,
	isValidUrl,
	sanitizeString,
	sanitizeObject,
	escapeHtml,
	safeParseJson,
	hasSqlInjectionPatterns
} from './validation';

// Security headers
export {
	securityHeaders,
	getCSP,
	getAllSecurityHeaders,
	applySecurityHeaders,
	getHSTSHeader
} from './headers';
