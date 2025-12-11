-- Estimates schema for SiteSense
create extension if not exists "pgcrypto";

create table if not exists public.estimates (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  user_id uuid references auth.users(id),
  status text not null default 'draft' check (status in ('draft','sent','accepted','declined')),
  notes text,
  expires_at date,
  subtotal numeric(12,2) default 0,
  tax numeric(12,2) default 0,
  total numeric(12,2) default 0,
  public_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);
create index if not exists idx_estimates_job on public.estimates(job_id);

create table if not exists public.estimate_items (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  description text not null,
  qty numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  is_optional boolean not null default false,
  sort_order int not null default 0
);
create index if not exists idx_estimate_items_estimate on public.estimate_items(estimate_id);

create table if not exists public.estimate_attachments (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  url text not null,
  kind text check (kind in ('photo','document','other')) default 'photo',
  created_at timestamptz not null default now()
);
create index if not exists idx_estimate_attachments_estimate on public.estimate_attachments(estimate_id);

-- Optional: simple public view by token (no RLS here by default)
-- Add RLS later mirroring jobs ownership once ownership is enforced.

