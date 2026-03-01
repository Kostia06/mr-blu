-- Accountant Shares: share invoices with accountants via magic link
-- Apply via Supabase dashboard SQL editor

-- =============================================
-- TABLE: accountant_shares
-- =============================================
create table if not exists public.accountant_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  accountant_email text not null,
  accountant_name text,
  share_type text not null check (share_type in ('selected', 'all', 'date_range')),
  access_token uuid not null unique default gen_random_uuid(),
  date_from date,
  date_to date,
  expires_at timestamptz,
  can_view boolean not null default true,
  can_download boolean not null default true,
  notify_on_share boolean not null default true,
  notify_on_new_invoice boolean not null default false,
  status text not null default 'active' check (status in ('active', 'revoked', 'expired')),
  created_at timestamptz not null default now(),
  last_accessed_at timestamptz,
  revoked_at timestamptz
);

-- =============================================
-- TABLE: accountant_share_documents (junction)
-- =============================================
create table if not exists public.accountant_share_documents (
  id uuid primary key default gen_random_uuid(),
  share_id uuid not null references public.accountant_shares(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (share_id, document_id)
);

-- =============================================
-- TABLE: accountant_access_logs (audit)
-- =============================================
create table if not exists public.accountant_access_logs (
  id uuid primary key default gen_random_uuid(),
  share_id uuid not null references public.accountant_shares(id) on delete cascade,
  action text not null,
  document_id uuid references public.documents(id) on delete set null,
  ip_address text,
  accessed_at timestamptz not null default now()
);

-- =============================================
-- INDEXES
-- =============================================
create index if not exists idx_accountant_shares_user_id on public.accountant_shares(user_id);
create index if not exists idx_accountant_shares_email on public.accountant_shares(accountant_email);
create index if not exists idx_accountant_shares_token on public.accountant_shares(access_token);
create index if not exists idx_accountant_share_docs_share on public.accountant_share_documents(share_id);
create index if not exists idx_accountant_share_docs_doc on public.accountant_share_documents(document_id);
create index if not exists idx_accountant_access_logs_share on public.accountant_access_logs(share_id);

-- =============================================
-- RLS: accountant_shares
-- =============================================
alter table public.accountant_shares enable row level security;

create policy "Users can manage their own shares"
  on public.accountant_shares for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Anyone can read shares by token"
  on public.accountant_shares for select
  using (true);

-- =============================================
-- RLS: accountant_share_documents
-- =============================================
alter table public.accountant_share_documents enable row level security;

create policy "Users can manage their share documents"
  on public.accountant_share_documents for all
  using (
    exists (
      select 1 from public.accountant_shares
      where id = accountant_share_documents.share_id
        and user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.accountant_shares
      where id = accountant_share_documents.share_id
        and user_id = auth.uid()
    )
  );

create policy "Anyone can read share documents by share"
  on public.accountant_share_documents for select
  using (true);

-- =============================================
-- RLS: accountant_access_logs
-- =============================================
alter table public.accountant_access_logs enable row level security;

create policy "Users can read their share logs"
  on public.accountant_access_logs for select
  using (
    exists (
      select 1 from public.accountant_shares
      where id = accountant_access_logs.share_id
        and user_id = auth.uid()
    )
  );

create policy "Anyone can insert access logs"
  on public.accountant_access_logs for insert
  with check (true);
