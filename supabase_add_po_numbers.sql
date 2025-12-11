-- Add PO number fields to estimates and expenses
-- Add columns if tables exist
alter table if exists public.estimates add column if not exists po_number text;
alter table if exists public.expenses add column if not exists po_number text;

-- Create indexes only if the tables are present
do $$ begin
  if to_regclass('public.estimates') is not null then
    create index if not exists idx_estimates_po on public.estimates(po_number);
  end if;
  if to_regclass('public.expenses') is not null then
    create index if not exists idx_expenses_po on public.expenses(po_number);
  end if;
end $$;
