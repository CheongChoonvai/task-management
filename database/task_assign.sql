-- TASK ASSIGN JOIN TABLE MIGRATION
-- Supports many-to-many relationship between tasks and members

CREATE TABLE public.task_assign (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  assigned_at timestamp with time zone DEFAULT now(),
  UNIQUE (task_id, member_id)
);

-- Indexes for fast lookup
CREATE INDEX idx_task_assign_task_id ON public.task_assign(task_id);
CREATE INDEX idx_task_assign_member_id ON public.task_assign(member_id);

-- Sample insert
-- INSERT INTO task_assign (task_id, member_id) VALUES ('<task_id>', '<member_id>');
