const dev = import.meta.env.DEV;

export const securityHeaders: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(self), geolocation=(), payment=()',
  'X-DNS-Prefetch-Control': 'off',
};

export function getCSP(): string {
  const directives = [
    "default-src 'self'",
    dev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.deepgram.com wss://api.deepgram.com https://generativelanguage.googleapis.com https://api.resend.com https://static.cloudflareinsights.com https://cloudflareinsights.com",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(dev ? [] : ['upgrade-insecure-requests']),
  ];
  return directives.join('; ');
}

export function getAllSecurityHeaders(): Record<string, string> {
  return { ...securityHeaders, 'Content-Security-Policy': getCSP() };
}

export function applySecurityHeaders(response: Response): Response {
  const headers = getAllSecurityHeaders();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

export function getHSTSHeader(): string | null {
  if (dev) return null;
  return 'max-age=31536000; includeSubDomains';
}
