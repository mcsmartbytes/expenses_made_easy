-- SiteSense project schema additions focused on contractor workflows (Roofing first)
-- Safe to run multiple times; uses IF NOT EXISTS and ON CONFLICT safeguards.

-- Prereq for gen_random_uuid()
create extension if not exists "pgcrypto";

-- 1) Industries
create table if not exists public.industries (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

-- Seed common industries
insert into public.industries (name, description) values
  ('Roofing', 'Residential and commercial roofing projects'),
  ('Framing', 'Structural framing and carpentry'),
  ('Painting', 'Interior and exterior painting'),
  ('Concrete', 'Flatwork, foundations, and structural concrete'),
  ('Electrical', 'Residential and commercial electrical work'),
  ('Plumbing', 'Residential and commercial plumbing'),
  ('General Contracting', 'Full-service GC projects'),
  ('Landscaping', 'Landscape and hardscape projects')
on conflict (name) do nothing;

-- 2) Clients (optional, not yet wired in UI)
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  address text,
  created_at timestamptz not null default now()
);

-- 3) Jobs augmentation for SiteSense (non-breaking: all cols nullable)
-- Existing UI expects: jobs(id, name, client_name, status, created_at)
alter table if exists public.jobs
  add column if not exists industry_id uuid references public.industries(id) on delete set null,
  add column if not exists property_address text,
  add column if not exists structure_type text,
  add column if not exists roof_type text,
  add column if not exists roof_pitch text,
  add column if not exists layers int,
  add column if not exists measured_squares numeric(10,2),
  add column if not exists deck_condition text,
  add column if not exists sheathing_type text,
  add column if not exists ventilation jsonb,
  add column if not exists material_brand text,
  add column if not exists material_series text,
  add column if not exists material_color text,
  add column if not exists underlayment text,
  add column if not exists flashing text,
  add column if not exists dumpster_size text,
  add column if not exists dumpster_hauler text,
  add column if not exists safety_notes text,
  add column if not exists client_id uuid references public.clients(id) on delete set null;

create index if not exists idx_jobs_industry on public.jobs(industry_id);
create index if not exists idx_jobs_client_id on public.jobs(client_id);

-- 4) Permits
create table if not exists public.permits (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  permit_number text,
  authority text,
  status text check (status in ('draft','applied','approved','rejected','closed')) default 'draft',
  applied_at date,
  approved_at date,
  inspection_date date,
  created_at timestamptz not null default now()
);
create index if not exists idx_permits_job on public.permits(job_id);

-- 5) Project Phases & Tasks
create table if not exists public.job_phases (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  status text not null check (status in ('planned','active','blocked','completed')) default 'planned',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_job_phases_job on public.job_phases(job_id);

create table if not exists public.job_tasks (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references public.job_phases(id) on delete cascade,
  title text not null,
  status text not null check (status in ('todo','in_progress','blocked','done')) default 'todo',
  assignee text,
  due_date date,
  hours_estimate numeric(10,2),
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_job_tasks_phase on public.job_tasks(phase_id);

-- 6) Change Orders
create table if not exists public.change_orders (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  title text not null,
  description text,
  amount numeric(12,2) not null default 0,
  status text not null check (status in ('draft','proposed','approved','rejected','invoiced','paid')) default 'draft',
  approved_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_change_orders_job on public.change_orders(job_id);

-- 7) Materials / BOM
create table if not exists public.job_materials (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  name text not null,
  qty numeric(12,2) not null default 1,
  unit text,
  unit_cost numeric(12,2),
  vendor text,
  created_at timestamptz not null default now()
);
create index if not exists idx_job_materials_job on public.job_materials(job_id);

-- 8) Photos (before/during/after)
create table if not exists public.job_photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  phase_id uuid references public.job_phases(id) on delete set null,
  kind text check (kind in ('before','during','after','other')) default 'other',
  url text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_job_photos_job on public.job_photos(job_id);

-- 9) Weather delays log
create table if not exists public.weather_delays (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  occurred_on date not null,
  hours_lost numeric(10,2),
  note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_weather_delays_job on public.weather_delays(job_id);

-- 10) Templates for Phases/Tasks by Industry (so jobs can be seeded)
create table if not exists public.industry_phase_templates (
  id uuid primary key default gen_random_uuid(),
  industry_id uuid not null references public.industries(id) on delete cascade,
  name text not null,
  sort_order int not null default 0
);
create index if not exists idx_phase_templates_industry on public.industry_phase_templates(industry_id);

create table if not exists public.industry_task_templates (
  id uuid primary key default gen_random_uuid(),
  phase_template_id uuid not null references public.industry_phase_templates(id) on delete cascade,
  title text not null,
  sort_order int not null default 0
);
create index if not exists idx_task_templates_phase on public.industry_task_templates(phase_template_id);

-- Seed Roofing phase templates
-- Phases from the provided workflow
insert into public.industry_phase_templates (industry_id, name, sort_order)
select i.id, p.name, p.sort_order from (
  values
    ('Lead / Intake', 10),
    ('Estimate & Proposal', 20),
    ('Contract & Permitting', 30),
    ('Planning & Scheduling', 40),
    ('Execution', 50),
    ('Inspection & Punch List', 60),
    ('Closeout & Warranty', 70)
) as p(name, sort_order)
join public.industries i on i.name = 'Roofing'
on conflict do nothing;

-- Seed Roofing task templates (attach via subqueries to the correct phase template rows)
-- Lead / Intake
insert into public.industry_task_templates (phase_template_id, title, sort_order)
select pt.id, t.title, t.sort_order from (
  values
    ('Capture property info, roof type, age, leak issues, photos.', 10),
    ('Qualify: service area, budget, emergency vs scheduled.', 20)
) as t(title, sort_order)
join public.industry_phase_templates pt on pt.name = 'Lead / Intake' and pt.industry_id = (select id from public.industries where name='Roofing' limit 1)
on conflict do nothing;

-- Estimate & Proposal
insert into public.industry_task_templates (phase_template_id, title, sort_order)
select pt.id, t.title, t.sort_order from (
  values
    ('On-site inspection (measure squares, slopes, layers, rot).', 10),
    ('Document existing materials (shingles, underlayment, flashing).', 20),
    ('Create estimate with labor, materials, disposal, contingencies.', 30)
) as t(title, sort_order)
join public.industry_phase_templates pt on pt.name = 'Estimate & Proposal' and pt.industry_id = (select id from public.industries where name='Roofing' limit 1)
on conflict do nothing;

-- Contract & Permitting
insert into public.industry_task_templates (phase_template_id, title, sort_order)
select pt.id, t.title, t.sort_order from (
  values
    ('Sign contract, collect deposit.', 10),
    ('Pull permits, HOA approvals if needed.', 20),
    ('Order materials & dumpster.', 30)
) as t(title, sort_order)
join public.industry_phase_templates pt on pt.name = 'Contract & Permitting' and pt.industry_id = (select id from public.industries where name='Roofing' limit 1)
on conflict do nothing;

-- Planning & Scheduling
insert into public.industry_task_templates (phase_template_id, title, sort_order)
select pt.id, t.title, t.sort_order from (
  values
    ('Schedule crew, crane/boom, dumpster drop, material delivery.', 10),
    ('Check weather windows and safety plan.', 20)
) as t(title, sort_order)
join public.industry_phase_templates pt on pt.name = 'Planning & Scheduling' and pt.industry_id = (select id from public.industries where name='Roofing' limit 1)
on conflict do nothing;

-- Execution
insert into public.industry_task_templates (phase_template_id, title, sort_order)
select pt.id, t.title, t.sort_order from (
  values
    ('Tear-off, protect landscaping, tarp.', 10),
    ('Deck inspection & repairs.', 20),
    ('Install underlayment, flashings, vents, shingles, accessories.', 30),
    ('Site cleanup each day.', 40)
) as t(title, sort_order)
join public.industry_phase_templates pt on pt.name = 'Execution' and pt.industry_id = (select id from public.industries where name='Roofing' limit 1)
on conflict do nothing;

-- Inspection & Punch List
insert into public.industry_task_templates (phase_template_id, title, sort_order)
select pt.id, t.title, t.sort_order from (
  values
    ('City/inspection where required.', 10),
    ('Internal quality check, water test if leak repair.', 20)
) as t(title, sort_order)
join public.industry_phase_templates pt on pt.name = 'Inspection & Punch List' and pt.industry_id = (select id from public.industries where name='Roofing' limit 1)
on conflict do nothing;

-- Closeout & Warranty
insert into public.industry_task_templates (phase_template_id, title, sort_order)
select pt.id, t.title, t.sort_order from (
  values
    ('Final clean (nails, magnet sweep).', 10),
    ('Final photos and aerials if used.', 20),
    ('Issue warranty and collect final payment.', 30)
) as t(title, sort_order)
join public.industry_phase_templates pt on pt.name = 'Closeout & Warranty' and pt.industry_id = (select id from public.industries where name='Roofing' limit 1)
on conflict do nothing;

-- 11) Seeding function: copy templates to a specific job based on job.industry_id
create or replace function public.seed_phases_for_job(p_job_id uuid)
returns void
language plpgsql
as $$
declare
  v_industry_id uuid;
  r_phase_tpl record;
  r_task_tpl record;
  v_phase_id uuid;
begin
  select industry_id into v_industry_id from public.jobs where id = p_job_id;
  if v_industry_id is null then
    raise notice 'Job % has no industry_id. Skipping phase seeding.', p_job_id;
    return;
  end if;

  -- Insert phases from templates
  for r_phase_tpl in
    select id, name, sort_order
    from public.industry_phase_templates
    where industry_id = v_industry_id
    order by sort_order
  loop
    insert into public.job_phases (job_id, name, sort_order, status)
    values (p_job_id, r_phase_tpl.name, r_phase_tpl.sort_order, 'planned')
    returning id into v_phase_id;

    -- Insert tasks under this phase
    for r_task_tpl in
      select title, sort_order
      from public.industry_task_templates
      where phase_template_id = r_phase_tpl.id
      order by sort_order
    loop
      insert into public.job_tasks (phase_id, title, sort_order, status)
      values (v_phase_id, r_task_tpl.title, r_task_tpl.sort_order, 'todo');
    end loop;
  end loop;
end;
$$;

-- Optional indexes for dashboard queries
create index if not exists idx_job_phases_status on public.job_phases(status);
create index if not exists idx_job_tasks_status on public.job_tasks(status);

-- NOTE: RLS policies are not defined here to avoid breaking existing environments.
-- When you are ready to secure these tables, enable RLS and add policies per your auth model.
-- Example:
-- alter table public.job_phases enable row level security;
-- create policy "phases_read" on public.job_phases for select using (true);

