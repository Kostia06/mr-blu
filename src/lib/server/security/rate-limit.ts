/**
 * Rate Limiting Utility
 *
 * In-memory rate limiter for API endpoints.
 * For production at scale, consider Redis-based solution.
 */

interface RateLimitEntry {
	count: number;
	resetTime: number;
}

interface RateLimitConfig {
	/** Maximum requests allowed in the window */
	maxRequests: number;
	/** Time window in milliseconds */
	windowMs: number;
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
	const now = Date.now();
	if (now - lastCleanup < CLEANUP_INTERVAL) return;

	lastCleanup = now;
	for (const [key, entry] of rateLimitStore.entries()) {
		if (entry.resetTime < now) {
			rateLimitStore.delete(key);
		}
	}
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
	identifier: string,
	config: RateLimitConfig
): { allowed: boolean; remaining: number; resetIn: number } {
	cleanupExpiredEntries();

	const now = Date.now();
	const entry = rateLimitStore.get(identifier);

	if (!entry || entry.resetTime < now) {
		// Create new entry
		rateLimitStore.set(identifier, {
			count: 1,
			resetTime: now + config.windowMs
		});
		return {
			allowed: true,
			remaining: config.maxRequests - 1,
			resetIn: config.windowMs
		};
	}

	// Check if limit exceeded
	if (entry.count >= config.maxRequests) {
		return {
			allowed: false,
			remaining: 0,
			resetIn: entry.resetTime - now
		};
	}

	// Increment count
	entry.count++;
	return {
		allowed: true,
		remaining: config.maxRequests - entry.count,
		resetIn: entry.resetTime - now
	};
}

/**
 * Create a rate limiter for a specific endpoint
 */
export function createRateLimiter(config: RateLimitConfig) {
	return (identifier: string) => checkRateLimit(identifier, config);
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
	/** Authentication endpoints: 5 requests per minute */
	auth: createRateLimiter({ maxRequests: 5, windowMs: 60 * 1000 }),

	/** AI/expensive endpoints: 10 requests per minute */
	ai: createRateLimiter({ maxRequests: 10, windowMs: 60 * 1000 }),

	/** Email sending: 20 requests per hour */
	email: createRateLimiter({ maxRequests: 20, windowMs: 60 * 60 * 1000 }),

	/** General API: 100 requests per minute */
	api: createRateLimiter({ maxRequests: 100, windowMs: 60 * 1000 }),

	/** Strict: 3 requests per minute (for sensitive operations) */
	strict: createRateLimiter({ maxRequests: 3, windowMs: 60 * 1000 })
};

/**
 * Get client identifier from request
 * Uses IP address with fallback to a generic identifier
 */
export function getClientIdentifier(request: Request): string {
	// Try various headers that might contain the real IP
	const forwarded = request.headers.get('x-forwarded-for');
	if (forwarded) {
		// Take the first IP in the chain (client IP)
		return forwarded.split(',')[0].trim();
	}

	const realIp = request.headers.get('x-real-ip');
	if (realIp) {
		return realIp;
	}

	const cfConnectingIp = request.headers.get('cf-connecting-ip');
	if (cfConnectingIp) {
		return cfConnectingIp;
	}

	// Fallback - in development this will be the same for all requests
	return 'unknown-client';
}

/**
 * Helper to create rate limit error response
 */
export function rateLimitResponse(resetIn: number) {
	const retryAfter = Math.ceil(resetIn / 1000);
	return new Response(
		JSON.stringify({
			error: 'Too many requests. Please try again later.',
			retryAfter
		}),
		{
			status: 429,
			headers: {
				'Content-Type': 'application/json',
				'Retry-After': String(retryAfter)
			}
		}
	);
}
