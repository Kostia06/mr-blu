import type { Env, AuthenticatedData } from '../../types';

const VALID_CATEGORIES = ['bug', 'feature', 'improvement', 'other'];
const MAX_COMMENT_LENGTH = 2000;

export const onRequestPost: PagesFunction<Env, string, AuthenticatedData> = async ({
  request,
  env,
  data,
}) => {
  const body = (await request.json()) as {
    comment?: string;
    category?: string;
    pageContext?: string;
  };

  const comment = body.comment?.trim();
  if (!comment || comment.length > MAX_COMMENT_LENGTH) {
    return new Response(
      JSON.stringify({ error: 'Comment is required (max 2000 chars)' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const category = VALID_CATEGORIES.includes(body.category || '')
    ? body.category!
    : 'other';

  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/admin_comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      user_id: data.user.id,
      comment,
      category,
      page_context: body.pageContext || null,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Feedback insert failed:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to submit feedback' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { 'Content-Type': 'application/json' } },
  );
};
