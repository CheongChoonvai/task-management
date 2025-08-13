# Database Setup for Auto Member Creation

## Overview
This setup ensures that when a user signs up and confirms their email, a corresponding record is automatically created in the `members` table.

## Steps to Implement

### 1. Execute the Auth Triggers SQL
Run the SQL in `database/auth-triggers.sql` in your Supabase SQL Editor:

```sql
-- This will create the trigger function and trigger
```

### 2. Update Members Table Policies
Run the updated SQL in `database/member.sql` to allow the trigger to insert records.

### 3. Backfill Existing Users (Optional)
If you have existing users who don't have member records, run this in your Supabase SQL Editor:

```sql
SELECT public.ensure_member_exists();
```

## How It Works

1. **Sign Up Flow:**
   - User enters email, password, and full name
   - Supabase creates auth user with metadata containing full_name
   - Trigger automatically creates member record with same ID as auth user

2. **Email Confirmation:**
   - User clicks confirmation link in email
   - Auth context detects sign-in event
   - Additional check ensures member record exists (fallback)

3. **Data Flow:**
   - Auth user ID = Member ID (same UUID)
   - Email and full_name synced between auth.users and members table
   - Default role is 'user' for new signups

## Testing

1. Register a new user with email and full name
2. Check email and click confirmation link
3. Verify member record exists in members table with correct data

## Troubleshooting

If you get "Database error saving new user":
1. Check RLS policies allow INSERT on members table
2. Verify trigger function has SECURITY DEFINER
3. Check auth.users table permissions
4. Look at Supabase logs for specific error details
