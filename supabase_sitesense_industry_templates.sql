-- Seed additional industry templates (Framing, Painting)

-- Framing phases
insert into public.industry_phase_templates (industry_id, name, sort_order)
select i.id, p.name, p.sort_order
from (values
  ('Lead / Intake', 10),
  ('Estimate & Proposal', 20),
  ('Contract & Planning', 30),
  ('Material Takeoff & Ordering', 40),
  ('Execution', 50),
  ('Inspection & Punch List', 60),
  ('Closeout', 70)
) as p(name, sort_order)
join public.industries i on i.name = 'Framing'
on conflict do nothing;

-- Framing tasks
insert into public.industry_task_templates (phase_template_id, title, sort_order)
select pt.id, t.title, t.sort_order from (
  values
    ('Site measure & layout', 10),
    ('Wall framing', 20),
    ('Roof framing', 30),
    ('Sheathing install', 40)
) as t(title, sort_order)
join public.industry_phase_templates pt on pt.name = 'Execution' and pt.industry_id = (select id from public.industries where name='Framing' limit 1)
on conflict do nothing;

-- Painting phases
insert into public.industry_phase_templates (industry_id, name, sort_order)
select i.id, p.name, p.sort_order
from (values
  ('Lead / Intake', 10),
  ('Estimate & Proposal', 20),
  ('Contract & Scheduling', 30),
  ('Prep', 40),
  ('Execution', 50),
  ('Inspection & Touch-ups', 60),
  ('Closeout & Warranty', 70)
) as p(name, sort_order)
join public.industries i on i.name = 'Painting'
on conflict do nothing;

-- Painting tasks
insert into public.industry_task_templates (phase_template_id, title, sort_order)
select pt.id, t.title, t.sort_order from (
  values
    ('Masking & protection', 10),
    ('Surface repair & sanding', 20),
    ('Primer', 30),
    ('First coat', 40),
    ('Second coat / finish', 50),
    ('Trim & detail', 60)
) as t(title, sort_order)
join public.industry_phase_templates pt on pt.name = 'Execution' and pt.industry_id = (select id from public.industries where name='Painting' limit 1)
on conflict do nothing;
-- Concrete phases
insert into public.industry_phase_templates (industry_id, name, sort_order)
select i.id, p.name, p.sort_order from (
  values ('Lead / Intake',10),('Estimate & Proposal',20),('Contract & Planning',30),('Formwork & Prep',40),('Pour & Finish',50),('Cure & Sawcut',60),('Inspection & Closeout',70)
) as p(name, sort_order)
join public.industries i on i.name = 'Concrete'
on conflict do nothing;

-- Concrete tasks (Execution)
insert into public.industry_task_templates (phase_template_id, title, sort_order)
select pt.id, t.title, t.sort_order from (
  values ('Base prep & compaction',10),('Form & rebar install',20),('Pour & screed',30),('Finish & cure',40)
) as t(title, sort_order)
join public.industry_phase_templates pt on pt.name = 'Pour & Finish' and pt.industry_id = (select id from public.industries where name='Concrete' limit 1)
on conflict do nothing;

-- Electrical phases
insert into public.industry_phase_templates (industry_id, name, sort_order)
select i.id, p.name, p.sort_order from (
  values ('Lead / Intake',10),('Estimate & Proposal',20),('Contract & Planning',30),('Rough-in',40),('Trim-out',50),('Testing & Inspection',60),('Closeout',70)
) as p(name, sort_order)
join public.industries i on i.name = 'Electrical'
on conflict do nothing;

insert into public.industry_task_templates (phase_template_id, title, sort_order)
select pt.id, t.title, t.sort_order from (
  values ('Panel & circuits layout',10),('Run conduit/cable',20),('Device install & terminations',30)
) as t(title, sort_order)
join public.industry_phase_templates pt on pt.name = 'Rough-in' and pt.industry_id = (select id from public.industries where name='Electrical' limit 1)
on conflict do nothing;

-- Plumbing phases
insert into public.industry_phase_templates (industry_id, name, sort_order)
select i.id, p.name, p.sort_order from (
  values ('Lead / Intake',10),('Estimate & Proposal',20),('Contract & Planning',30),('Rough-in',40),('Fixture Set',50),('Testing & Inspection',60),('Closeout',70)
) as p(name, sort_order)
join public.industries i on i.name = 'Plumbing'
on conflict do nothing;

insert into public.industry_task_templates (phase_template_id, title, sort_order)
select pt.id, t.title, t.sort_order from (
  values ('Supply & drain layout',10),('Pipe run & venting',20),('Fixture connections',30)
) as t(title, sort_order)
join public.industry_phase_templates pt on pt.name = 'Rough-in' and pt.industry_id = (select id from public.industries where name='Plumbing' limit 1)
on conflict do nothing;

-- General Contracting phases
insert into public.industry_phase_templates (industry_id, name, sort_order)
select i.id, p.name, p.sort_order from (
  values ('Lead / Intake',10),('Estimate & Proposal',20),('Contract & Permitting',30),('Planning & Scheduling',40),('Execution',50),('Inspection & Punch List',60),('Closeout',70)
) as p(name, sort_order)
join public.industries i on i.name = 'General Contracting'
on conflict do nothing;

insert into public.industry_task_templates (phase_template_id, title, sort_order)
select pt.id, t.title, t.sort_order from (
  values ('Mobilize subs',10),('Schedule baseline',20),('Change order control',30)
) as t(title, sort_order)
join public.industry_phase_templates pt on pt.name = 'Planning & Scheduling' and pt.industry_id = (select id from public.industries where name='General Contracting' limit 1)
on conflict do nothing;

-- Landscaping phases
insert into public.industry_phase_templates (industry_id, name, sort_order)
select i.id, p.name, p.sort_order from (
  values ('Lead / Intake',10),('Estimate & Proposal',20),('Contract & Planning',30),('Site Prep',40),('Install',50),('Final Walkthrough',60),('Closeout',70)
) as p(name, sort_order)
join public.industries i on i.name = 'Landscaping'
on conflict do nothing;

insert into public.industry_task_templates (phase_template_id, title, sort_order)
select pt.id, t.title, t.sort_order from (
  values ('Grading & drainage',10),('Hardscape install',20),('Planting & irrigation',30)
) as t(title, sort_order)
join public.industry_phase_templates pt on pt.name = 'Install' and pt.industry_id = (select id from public.industries where name='Landscaping' limit 1)
on conflict do nothing;

