-- Add PO number fields to estimates and expenses
alter table if exists public.estimates add column if not exists po_number text;
create index if not exists idx_estimates_po on public.estimates(po_number);

alter table if exists public.expenses add column if not exists po_number text;
create index if not exists idx_expenses_po on public.expenses(po_number);

