#!/bin/bash
# Database Setup Script for Task Management System
# Execute this script in your Supabase SQL editor or PostgreSQL client

echo "=== Task Management Database Setup ==="
echo "Execute the following SQL files in this exact order:"
echo ""

echo "STEP 1: Create Members Table (Foundation)"
echo "File: member.sql"
echo "Description: Creates the members table that serves as the foundation"
echo "Dependencies: None"
echo ""

echo "STEP 2: Create Projects Table"
echo "File: project.sql" 
echo "Description: Creates projects table with foreign key to members"
echo "Dependencies: members table must exist"
echo ""

echo "STEP 3: Create Tasks Table"
echo "File: task.sql"
echo "Description: Creates tasks table with foreign keys to projects and members"
echo "Dependencies: members and projects tables must exist"
echo ""

echo "=== VERIFICATION STEPS ==="
echo ""
echo "After running all three SQL files, verify with these queries:"
echo ""
echo "-- Check table creation"
echo "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('members', 'projects', 'tasks');"
echo ""
echo "-- Check foreign key constraints"
echo "SELECT constraint_name, table_name, column_name FROM information_schema.key_column_usage WHERE table_name IN ('projects', 'tasks') AND constraint_name LIKE '%fkey%';"
echo ""

echo "=== SAMPLE DATA FLOW ==="
echo ""
echo "-- 1. Insert a member first"
echo "INSERT INTO members (email, full_name, role) VALUES ('john@example.com', 'John Doe', 'admin');"
echo ""
echo "-- 2. Insert a project (using the member's ID as lead_id)"
echo "INSERT INTO projects (title, description, lead_id) VALUES ('Sample Project', 'A test project', (SELECT id FROM members WHERE email = 'john@example.com'));"
echo ""
echo "-- 3. Insert a task (using project_id and member_id)"
echo "INSERT INTO tasks (title, description, project_id, created_by) VALUES ('Sample Task', 'A test task', (SELECT id FROM projects WHERE title = 'Sample Project'), (SELECT id FROM members WHERE email = 'john@example.com'));"
echo ""

echo "=== DATABASE READY FOR USE ==="
