-- Backfill jobs.user_id safely before enabling RLS
-- 1) Ensure the column exists
alter table if exists public.jobs
  add column if not exists user_id uuid references auth.users(id);

-- 2) Preview jobs missing an owner (optional)
-- select id, name, created_at from public.jobs where user_id is null order by created_at desc;

-- 3) Backfill from time_entries majority owner per job
with x as (
  select job_id, user_id, count(*) as c,
         row_number() over (partition by job_id order by count(*) desc) as rn
  from public.time_entries
  where job_id is not null
  group by job_id, user_id
)
update public.jobs j
set user_id = x.user_id
from x
where j.id = x.job_id
  and x.rn = 1
  and j.user_id is null;

-- 4) Backfill from expenses majority owner per job
with x as (
  select job_id, user_id, count(*) as c,
         row_number() over (partition by job_id order by count(*) desc) as rn
  from public.expenses
  where job_id is not null
  group by job_id, user_id
)
update public.jobs j
set user_id = x.user_id
from x
where j.id = x.job_id
  and x.rn = 1
  and j.user_id is null;

-- 5) Fallback: set remaining to your user id
-- Replace YOUR_USER_UUID below (find via: select id, email from auth.users;)
-- update public.jobs set user_id = 'YOUR_USER_UUID' where user_id is null;

-- 6) Verify
-- select count(*) as remaining from public.jobs where user_id is null;
-- select user_id, count(*) from public.jobs group by user_id;

