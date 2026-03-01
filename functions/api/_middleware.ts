import type { Env, AuthenticatedData } from '../types';

const PUBLIC_PATHS = ['/api/health', '/api/documents/share', '/api/beta/signup'];
const ALLOWED_ORIGINS = [
  'capacitor://localhost',
  'https://localhost',
  'http://localhost',
  'https://mrblu.com',
  'https://mr-blu.pages.dev',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') || '';
  const isAllowed = ALLOWED_ORIGINS.some((o) => origin.startsWith(o));
  if (!isAllowed) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(body: Record<string, unknown>, status = 200, cors: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

async function verifyAuth(
  request: Request,
  env: Env,
): Promise<{ id: string; email: string } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  if (!token) return null;

  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });

  if (!response.ok) return null;

  const user = (await response.json()) as { id: string; email: string };
  if (!user?.id) return null;

  return { id: user.id, email: user.email };
}

export const onRequest: PagesFunction<Env, string, AuthenticatedData>[] = [
  // CORS preflight + headers
  async (context) => {
    const cors = getCorsHeaders(context.request);

    if (context.request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    try {
      const response = await context.next();
      for (const [key, value] of Object.entries(cors)) {
        response.headers.set(key, value);
      }
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal server error';
      console.error('Unhandled error:', message);
      return jsonResponse({ error: message }, 500, cors);
    }
  },

  // Auth verification
  async (context) => {
    const url = new URL(context.request.url);

    if (isPublicPath(url.pathname)) {
      return context.next();
    }

    const user = await verifyAuth(context.request, context.env);
    if (!user) {
      const cors = getCorsHeaders(context.request);
      return jsonResponse({ error: 'Unauthorized' }, 401, cors);
    }

    context.data.user = user;
    return context.next();
  },
];
