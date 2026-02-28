-- RPC function to fetch documents for an accountant share
-- Runs as SECURITY DEFINER to bypass documents RLS for unauthenticated accountant access
-- Validates the access token and share status before returning data

create or replace function public.get_shared_documents(p_access_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_share record;
  v_result jsonb;
begin
  -- Look up active share
  select id, user_id, share_type, date_from, date_to, status, expires_at
  into v_share
  from accountant_shares
  where access_token = p_access_token
  limit 1;

  if v_share is null then
    return '[]'::jsonb;
  end if;

  -- Check status
  if v_share.status = 'revoked' then
    return '[]'::jsonb;
  end if;

  if v_share.expires_at is not null and v_share.expires_at < now() then
    return '[]'::jsonb;
  end if;

  if v_share.share_type = 'selected' then
    select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t.created_at desc), '[]'::jsonb)
    into v_result
    from (
      select
        d.id, d.document_type, d.document_number,
        d.subtotal, d.tax_rate, d.tax_amount, d.total,
        d.status, d.created_at, d.due_date, d.notes, d.line_items,
        jsonb_build_object('name', c.name, 'email', c.email) as clients
      from documents d
      left join clients c on c.id = d.client_id
      join accountant_share_documents asd on asd.document_id = d.id
      where asd.share_id = v_share.id
        and d.document_type = 'invoice'
    ) t;
  else
    -- 'all' or 'date_range'
    select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t.created_at desc), '[]'::jsonb)
    into v_result
    from (
      select
        d.id, d.document_type, d.document_number,
        d.subtotal, d.tax_rate, d.tax_amount, d.total,
        d.status, d.created_at, d.due_date, d.notes, d.line_items,
        jsonb_build_object('name', c.name, 'email', c.email) as clients
      from documents d
      left join clients c on c.id = d.client_id
      where d.user_id = v_share.user_id
        and d.document_type = 'invoice'
        and (v_share.share_type = 'all'
          or ((d.created_at at time zone 'America/Denver')::date >= coalesce(v_share.date_from, '-infinity'::date)
              and (d.created_at at time zone 'America/Denver')::date <= coalesce(v_share.date_to, '9999-12-31'::date)))
    ) t;
  end if;

  return v_result;
end;
$$;
