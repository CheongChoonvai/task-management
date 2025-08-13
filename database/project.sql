create table public.projects (
  id uuid not null default gen_random_uuid (),
  title character varying not null,
  description text null,
  status character varying not null default 'planning'::character varying,
  priority character varying not null default 'medium'::character varying,
  progress integer null default 0,
  deadline timestamp with time zone null,
  todostatus character varying null default 'Assigned'::character varying,
  lead_id uuid null,
  budget numeric null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint projects_pkey primary key (id),
  constraint projects_lead_id_fkey foreign KEY (lead_id) references members (id)
) TABLESPACE pg_default;

create index IF not exists idx_projects_lead_id_btree on public.projects using btree (lead_id) TABLESPACE pg_default;

create index IF not exists idx_projects_status_btree on public.projects using btree (status) TABLESPACE pg_default;

create index IF not exists idx_projects_priority_btree on public.projects using btree (priority) TABLESPACE pg_default;

create index IF not exists idx_projects_deadline_btree on public.projects using btree (deadline) TABLESPACE pg_default;