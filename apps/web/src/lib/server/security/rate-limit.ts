interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) rateLimitStore.delete(key);
  }
}

export function checkRateLimit(identifier: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetIn: number } {
  cleanupExpiredEntries();
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetIn: entry.resetTime - now };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetIn: entry.resetTime - now };
}

export function createRateLimiter(config: RateLimitConfig) {
  return (identifier: string) => checkRateLimit(identifier, config);
}

export const rateLimiters = {
  auth: createRateLimiter({ maxRequests: 5, windowMs: 60 * 1000 }),
  ai: createRateLimiter({ maxRequests: 30, windowMs: 60 * 1000 }),
  email: createRateLimiter({ maxRequests: 20, windowMs: 60 * 60 * 1000 }),
  api: createRateLimiter({ maxRequests: 100, windowMs: 60 * 1000 }),
  strict: createRateLimiter({ maxRequests: 3, windowMs: 60 * 1000 }),
};

export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp;
  return 'unknown-client';
}

export function rateLimitResponse(resetIn: number) {
  const retryAfter = Math.ceil(resetIn / 1000);
  return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.', retryAfter }), {
    status: 429,
    headers: { 'Content-Type': 'application/json', 'Retry-After': String(retryAfter) },
  });
}
