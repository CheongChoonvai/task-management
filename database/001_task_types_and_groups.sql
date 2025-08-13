-- Migration for supporting personal and collaborative tasks

-- 1. Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'member')) NOT NULL DEFAULT 'member',
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- 3. Alter tasks table to support task type and group assignment
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('personal', 'group')) NOT NULL DEFAULT 'personal';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES profiles(id);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_group_id ON tasks(group_id);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);

-- 5. (Optional) Set default assignee for personal tasks
-- UPDATE tasks SET assignee_id = user_id WHERE type = 'personal' AND assignee_id IS NULL;
