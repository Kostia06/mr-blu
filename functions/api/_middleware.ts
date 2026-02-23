import type { Env, AuthenticatedData } from '../types';

const PUBLIC_PATHS = ['/api/health', '/api/documents/share'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
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
  // Error handling
  async (context) => {
    try {
      return await context.next();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal server error';
      console.error('Unhandled error:', message);
      return jsonResponse({ error: message }, 500);
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
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    context.data.user = user;
    return context.next();
  },
];
