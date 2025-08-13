-- COMPLETE DATABASE FLOW - Execute in this exact order
-- Task Management System Database Schema
-- Created: August 13, 2025

-- =============================================================================
-- STEP 1: MEMBERS TABLE (Foundation - Must be created FIRST)
-- =============================================================================
-- Run: member.sql first
-- Dependencies: None
-- Referenced by: projects.lead_id, tasks.created_by

-- =============================================================================
-- STEP 2: PROJECTS TABLE (Second - Depends on members)
-- =============================================================================
-- Run: project.sql second
-- Dependencies: members table
-- Referenced by: tasks.project_id

-- =============================================================================
-- STEP 3: TASKS TABLE (Third - Depends on both members and projects)
-- =============================================================================
-- Run: task.sql third
-- Dependencies: members table, projects table
-- References: projects.id, members.id

-- =============================================================================
-- EXECUTION ORDER SUMMARY
-- =============================================================================

/*
CORRECT EXECUTION ORDER:

1. First:  member.sql      (Creates members table)
2. Second: project.sql     (Creates projects table - references members)
3. Third:  task.sql        (Creates tasks table - references projects & members)

DEPENDENCY CHAIN:
members (foundation) 
  ↓
projects (depends on members.lead_id)
  ↓  
tasks (depends on projects.project_id AND members.created_by)

FOREIGN KEY RELATIONSHIPS:
- projects.lead_id        → members.id
- tasks.project_id        → projects.id  
- tasks.created_by        → members.id

WORKFLOW FOR CREATING DATA:
1. Create Member(s) first
2. Create Project(s) with valid lead_id
3. Create Task(s) with valid project_id and created_by

EXAMPLE DATA FLOW:
1. INSERT INTO members (email, full_name, role) VALUES ('admin@company.com', 'Admin User', 'admin');
2. INSERT INTO projects (title, description, lead_id) VALUES ('New Project', 'Description', <member_id>);
3. INSERT INTO tasks (title, description, project_id, created_by) VALUES ('Task 1', 'Description', <project_id>, <member_id>);
*/

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check if all tables exist and have proper relationships
/*
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('members', 'projects', 'tasks')
ORDER BY tc.table_name, tc.constraint_name;
*/
