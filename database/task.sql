create table public.tasks (
  id uuid not null default gen_random_uuid (),
  title character varying not null,
  description text null,
  project_id uuid null,
  status character varying not null default 'todo'::character varying,
  priority character varying not null default 'medium'::character varying,
  progress integer null default 0,
  project_contribution integer null default 0,
  created_by uuid null,
  due_date timestamp with time zone null,
  completed_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint tasks_pkey primary key (id),
  constraint tasks_created_by_fkey foreign KEY (created_by) references members (id),
  constraint tasks_project_id_fkey foreign KEY (project_id) references projects (id),
  constraint tasks_progress_check check (
    (
      (progress >= 0)
      and (progress <= 100)
    )
  ),
  constraint tasks_project_contribution_check check (
    (
      (project_contribution >= 0)
      and (project_contribution <= 100)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_tasks_project_id_btree on public.tasks using btree (project_id) TABLESPACE pg_default;

create index IF not exists idx_tasks_created_by_btree on public.tasks using btree (created_by) TABLESPACE pg_default;

create index IF not exists idx_tasks_status_btree on public.tasks using btree (status) TABLESPACE pg_default;

create index IF not exists idx_tasks_priority_btree on public.tasks using btree (priority) TABLESPACE pg_default;

create index IF not exists idx_tasks_due_date_btree on public.tasks using btree (due_date) TABLESPACE pg_default;

create index IF not exists idx_tasks_project_status_priority_composite on public.tasks using btree (project_id, status, priority) TABLESPACE pg_default;