-- RLS hardening for SiteSense tables (opt-in, run when ready)
-- This assumes jobs has a user_id owner. Add it first if missing.

alter table if exists public.jobs
  add column if not exists user_id uuid references auth.users(id);

-- Backfill ownership manually as needed before enabling RLS.

-- Enable RLS
alter table if exists public.jobs enable row level security;
alter table if exists public.permits enable row level security;
alter table if exists public.job_phases enable row level security;
alter table if exists public.job_tasks enable row level security;
alter table if exists public.change_orders enable row level security;
alter table if exists public.job_materials enable row level security;
alter table if exists public.job_photos enable row level security;
alter table if exists public.weather_delays enable row level security;

-- Helper policy function: check job ownership via job_id FK
create or replace function public.is_job_owner(p_job_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.jobs j
    where j.id = p_job_id
      and j.user_id = auth.uid()
  );
$$;

-- Jobs: owner can do everything, anyone can insert their own
drop policy if exists jobs_select on public.jobs;
drop policy if exists jobs_insert on public.jobs;
drop policy if exists jobs_update on public.jobs;
drop policy if exists jobs_delete on public.jobs;
create policy jobs_select on public.jobs for select using (user_id = auth.uid());
create policy jobs_insert on public.jobs for insert with check (user_id = auth.uid());
create policy jobs_update on public.jobs for update using (user_id = auth.uid());
create policy jobs_delete on public.jobs for delete using (user_id = auth.uid());

-- Child tables: gate by parent job ownership
drop policy if exists permits_select on public.permits;
drop policy if exists permits_modify on public.permits;
create policy permits_select on public.permits for select using (public.is_job_owner(job_id));
create policy permits_modify on public.permits for all using (public.is_job_owner(job_id)) with check (public.is_job_owner(job_id));

drop policy if exists phases_select on public.job_phases;
drop policy if exists phases_modify on public.job_phases;
create policy phases_select on public.job_phases for select using (public.is_job_owner(job_id));
create policy phases_modify on public.job_phases for all using (public.is_job_owner(job_id)) with check (public.is_job_owner(job_id));

drop policy if exists tasks_select on public.job_tasks;
drop policy if exists tasks_modify on public.job_tasks;
create policy tasks_select on public.job_tasks for select using (public.is_job_owner((select job_id from public.job_phases p where p.id = phase_id)));
create policy tasks_modify on public.job_tasks for all using (public.is_job_owner((select job_id from public.job_phases p where p.id = phase_id))) with check (public.is_job_owner((select job_id from public.job_phases p where p.id = phase_id)));

drop policy if exists materials_select on public.job_materials;
drop policy if exists materials_modify on public.job_materials;
create policy materials_select on public.job_materials for select using (public.is_job_owner(job_id));
create policy materials_modify on public.job_materials for all using (public.is_job_owner(job_id)) with check (public.is_job_owner(job_id));

drop policy if exists photos_select on public.job_photos;
drop policy if exists photos_modify on public.job_photos;
create policy photos_select on public.job_photos for select using (public.is_job_owner(job_id));
create policy photos_modify on public.job_photos for all using (public.is_job_owner(job_id)) with check (public.is_job_owner(job_id));

drop policy if exists delays_select on public.weather_delays;
drop policy if exists delays_modify on public.weather_delays;
create policy delays_select on public.weather_delays for select using (public.is_job_owner(job_id));
create policy delays_modify on public.weather_delays for all using (public.is_job_owner(job_id)) with check (public.is_job_owner(job_id));

-- Storage: create a bucket "job-photos" with public read and user-owned write rules in Supabase Dashboard.
-- Example storage policies (run in Storage Policies UI):
-- Read: bucket = 'job-photos' -> true
-- Write: bucket = 'job-photos' -> exists(select 1 from public.jobs j where (storage.foldername()) like j.id || '/%' and j.user_id = auth.uid())
