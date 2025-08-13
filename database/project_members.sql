-- PROJECT MEMBERS JOIN TABLE MIGRATION
-- Supports many-to-many relationship between projects and members

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
