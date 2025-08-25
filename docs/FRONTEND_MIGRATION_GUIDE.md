# Frontend Migration Guide - New Database Schema

This guide explains the changes made to support the new database schema with `members`, `projects`, and `tasks` tables.

## 🔄 **Schema Changes Summary**

### **Old Schema → New Schema**
- `profiles` → `members` (with additional fields: role, is_active)
- `groups` & `group_members` → Removed (simplified to project-based collaboration)
- `tasks` → Updated with new fields and relationships

### **Key Relationship Changes**
```
OLD: tasks.user_id → auth.users
NEW: tasks.created_by → members.id

OLD: No project relationship
NEW: tasks.project_id → projects.id (optional)

OLD: Group-based collaboration
NEW: Project-based collaboration
```

## 📋 **Updated Files**

### **1. Core Types (`src/lib/supabase.ts`)**
- ✅ Updated Database type definitions
- ✅ Replaced `profiles` with `members`
- ✅ Added `projects` table type
- ✅ Updated `tasks` table with new fields

### **2. Task Management**
- ✅ **`src/app/tasks/create/page.tsx`** - Now supports project selection
- ✅ **`src/app/tasks/[id]/edit/page.tsx`** - Updated with new fields
- ✅ Added progress tracking and project contribution

### **3. Project Management** (New)
- ✅ **`src/app/projects/page.tsx`** - Project listing and overview
- ✅ **`src/app/projects/create/page.tsx`** - Create new projects
- ✅ Project-task relationship management

### **4. Dashboard (`src/app/dashboard/page.tsx`)**
- ✅ Updated to work with new member system
- ✅ Automatic member creation for new users
- ✅ Project overview integration
- ✅ Enhanced task management with progress tracking

## 🚀 **New Features Added**

### **Project Management**
- Create and manage projects
- Assign project leads
- Track project progress
- Set budgets and deadlines
- View project statistics

### **Enhanced Task Management**
- Link tasks to projects (optional)
- Track task progress (0-100%)
- Set project contribution percentage
- Improved due date handling (`due_date` instead of `deadline`)
- Completion tracking with `completed_at` field

### **Improved User Management**
- Automatic member profile creation
- Role-based system (admin, user, manager)
- Active/inactive status tracking

## 📊 **Data Flow**

### **Creating a Task**
```typescript
1. User signs in → Check/create member profile
2. Fetch available projects (optional)
3. Create task with:
   - Basic info (title, description, priority)
   - Project assignment (optional)
   - Progress tracking
   - Due date
```

### **Creating a Project**
```typescript
1. Create project with lead assignment
2. Set project parameters (budget, deadline, status)
3. Tasks can then be linked to this project
```

## 🔧 **Migration Steps for Existing Data**

If you have existing data in the old schema, run these steps:

### **1. Run the new database schema**
```sql
-- Execute the complete-setup.sql file in Supabase
```

### **2. Migrate existing users (if any)**
```sql
-- If you have existing profiles, migrate to members
INSERT INTO members (id, email, full_name, avatar_url)
SELECT id, email, full_name, avatar_url FROM profiles
WHERE NOT EXISTS (SELECT 1 FROM members WHERE members.email = profiles.email);
```

### **3. Update existing tasks (if any)**
```sql
-- Update task references if you have existing tasks
UPDATE tasks SET 
  created_by = (SELECT id FROM members WHERE email = (
    SELECT email FROM auth.users WHERE id = tasks.user_id
  ))
WHERE created_by IS NULL;
```

## 🎯 **Key Benefits**

1. **Simplified Architecture**: No more complex group management
2. **Project-Centric**: Better organization around projects
3. **Enhanced Tracking**: Progress and contribution metrics
4. **Flexible Relationships**: Tasks can be standalone or project-linked
5. **Better User Management**: Role-based system with member profiles

## 🔄 **Backward Compatibility**

- ❌ Group-based tasks are no longer supported
- ✅ All basic task functionality remains
- ✅ User authentication works the same
- ✅ Task CRUD operations enhanced

## 📚 **Usage Examples**

### **Creating a Project-based Workflow**
1. Create a project: `/projects/create`
2. Create tasks linked to that project: `/tasks/create`
3. Track progress on dashboard: `/dashboard`
4. View project overview: `/projects`

### **Creating Standalone Tasks**
1. Create task without selecting a project: `/tasks/create`
2. Task works independently
3. Can be linked to project later via edit

## 🎉 **Ready to Use!**

Your frontend now supports the new database schema with:
- ✅ Members management
- ✅ Project management  
- ✅ Enhanced task tracking
- ✅ Progress monitoring
- ✅ Project-task relationships

The application will automatically create member profiles for new users and provides a seamless experience with the new schema!
