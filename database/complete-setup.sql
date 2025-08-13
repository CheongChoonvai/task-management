-- COMPLETE DATABASE SETUP - EXECUTE ALL AT ONCE
-- Task Management System - Proper Order Implementation
-- Created: August 13, 2025

-- =============================================================================
-- STEP 1: MEMBERS TABLE (FOUNDATION)
-- =============================================================================

-- Drop existing tables if they exist (in reverse order due to dependencies)
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS projects CASCADE; 
DROP TABLE IF EXISTS members CASCADE;

-- Create members table first (foundation)
create table public.members (
  id uuid not null default gen_random_uuid (),
  email character varying not null unique,
  full_name character varying null,
  avatar_url text null,
  role character varying not null default 'user'::character varying,
  is_active boolean not null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint members_pkey primary key (id),
  constraint members_email_unique unique (email),
  constraint members_role_check check (role in ('admin', 'user', 'manager'))
);

-- Members indexes
create index idx_members_email_btree on public.members using btree (email);
create index idx_members_role_btree on public.members using btree (role);
create index idx_members_active_btree on public.members using btree (is_active);

-- =============================================================================
-- STEP 2: PROJECTS TABLE (DEPENDS ON MEMBERS)
-- =============================================================================

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
);

-- Projects indexes
create index idx_projects_lead_id_btree on public.projects using btree (lead_id);
create index idx_projects_status_btree on public.projects using btree (status);
create index idx_projects_priority_btree on public.projects using btree (priority);
create index idx_projects_deadline_btree on public.projects using btree (deadline);

-- =============================================================================
-- STEP 3: TASKS TABLE (DEPENDS ON BOTH MEMBERS AND PROJECTS)
-- =============================================================================

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
);

-- Tasks indexes
create index idx_tasks_project_id_btree on public.tasks using btree (project_id);
create index idx_tasks_created_by_btree on public.tasks using btree (created_by);
create index idx_tasks_status_btree on public.tasks using btree (status);
create index idx_tasks_priority_btree on public.tasks using btree (priority);
create index idx_tasks_due_date_btree on public.tasks using btree (due_date);
create index idx_tasks_project_status_priority_composite on public.tasks using btree (project_id, status, priority);

-- =============================================================================
-- STEP 4: PROJECT MEMBERS JOIN TABLE (MANY-TO-MANY)
-- =============================================================================

CREATE TABLE public.project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (project_id, member_id)
);

-- Indexes for fast lookup
CREATE INDEX idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX idx_project_members_member_id ON public.project_members(member_id);

-- Sample insert
-- INSERT INTO project_members (project_id, member_id) VALUES ('<project_id>', '<member_id>');

-- =============================================================================
-- VERIFICATION AND SAMPLE DATA
-- =============================================================================

-- Insert sample member
INSERT INTO members (email, full_name, role) VALUES 
('admin@taskmanager.com', 'System Admin', 'admin'),
('john.doe@company.com', 'John Doe', 'user'),
('jane.smith@company.com', 'Jane Smith', 'manager');

-- Insert sample project
INSERT INTO projects (title, description, lead_id, status, priority) VALUES 
('Website Redesign', 'Complete redesign of company website', 
 (SELECT id FROM members WHERE email = 'jane.smith@company.com'), 
 'planning', 'high');

-- Insert sample tasks
INSERT INTO tasks (title, description, project_id, created_by, status, priority) VALUES 
('Design Homepage', 'Create wireframes and mockups for homepage',
 (SELECT id FROM projects WHERE title = 'Website Redesign'),
 (SELECT id FROM members WHERE email = 'john.doe@company.com'),
 'todo', 'high'),
('Setup Development Environment', 'Configure local development environment',
 (SELECT id FROM projects WHERE title = 'Website Redesign'),
 (SELECT id FROM members WHERE email = 'jane.smith@company.com'),
 'in_progress', 'medium');

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check tables were created
SELECT 'Tables Created:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('members', 'projects', 'tasks')
ORDER BY table_name;

-- Check foreign key relationships
SELECT 'Foreign Key Constraints:' as status;
SELECT 
    tc.table_name, 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('projects', 'tasks')
ORDER BY tc.table_name;

-- Check sample data
SELECT 'Sample Data Created:' as status;
SELECT 'Members:' as table_name, count(*) as count FROM members
UNION ALL
SELECT 'Projects:', count(*) FROM projects  
UNION ALL
SELECT 'Tasks:', count(*) FROM tasks;

-- Display complete relationship
SELECT 'Complete Data Flow:' as status;
SELECT 
    m.full_name as member,
    m.role,
    p.title as project,
    p.status as project_status,
    t.title as task,
    t.status as task_status,
    t.priority as task_priority
FROM members m
LEFT JOIN projects p ON p.lead_id = m.id
LEFT JOIN tasks t ON t.project_id = p.id
ORDER BY m.full_name, p.title, t.title;
