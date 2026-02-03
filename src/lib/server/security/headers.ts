/**
 * Security Headers Configuration
 *
 * OWASP recommended security headers for web applications.
 */

import { dev } from '$app/environment';

/**
 * Security headers to add to all responses
 */
export const securityHeaders: Record<string, string> = {
	// Prevent MIME type sniffing
	'X-Content-Type-Options': 'nosniff',

	// Prevent clickjacking
	'X-Frame-Options': 'DENY',

	// XSS Protection (legacy browsers)
	'X-XSS-Protection': '1; mode=block',

	// Referrer Policy - send origin only to same-origin, nothing to cross-origin
	'Referrer-Policy': 'strict-origin-when-cross-origin',

	// Permissions Policy - disable unnecessary features
	'Permissions-Policy': 'camera=(), microphone=(self), geolocation=(), payment=()',

	// Prevent browsers from DNS prefetching
	'X-DNS-Prefetch-Control': 'off'
};

/**
 * Content Security Policy
 * Restrictive policy that allows only necessary resources
 */
export function getCSP(): string {
	const directives = [
		// Default: only same origin
		"default-src 'self'",

		// Scripts: self + inline for Svelte (with nonce in production ideally)
		dev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'",

		// Styles: self + inline for Svelte component styles + Google Fonts
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

		// Images: self + data URIs + https
		"img-src 'self' data: https: blob:",

		// Fonts: self + Google Fonts
		"font-src 'self' https://fonts.gstatic.com",

		// Connect: API calls
		"connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.deepgram.com wss://api.deepgram.com https://generativelanguage.googleapis.com https://api.resend.com",

		// Media: self
		"media-src 'self' blob:",

		// Object: none (no plugins)
		"object-src 'none'",

		// Base URI: self only
		"base-uri 'self'",

		// Form actions: self only
		"form-action 'self'",

		// Frame ancestors: none (prevent framing)
		"frame-ancestors 'none'",

		// Upgrade insecure requests in production
		...(dev ? [] : ['upgrade-insecure-requests'])
	];

	return directives.join('; ');
}

/**
 * Get all security headers including CSP
 */
export function getAllSecurityHeaders(): Record<string, string> {
	return {
		...securityHeaders,
		'Content-Security-Policy': getCSP()
	};
}

/**
 * Apply security headers to a Response
 */
export function applySecurityHeaders(response: Response): Response {
	const headers = getAllSecurityHeaders();

	for (const [key, value] of Object.entries(headers)) {
		response.headers.set(key, value);
	}

	return response;
}

/**
 * HSTS header (only for production)
 * Tells browsers to only use HTTPS for this domain
 */
export function getHSTSHeader(): string | null {
	if (dev) return null;

	// max-age=1 year, include subdomains
	return 'max-age=31536000; includeSubDomains';
}
