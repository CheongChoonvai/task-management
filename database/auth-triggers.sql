-- Auth triggers and functions for automatic member creation
-- This file should be executed in your Supabase SQL editor

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into members table when a new user is created
  INSERT INTO public.members (id, email, full_name, role, is_active)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'user',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.members.full_name),
    updated_at = now();
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create member when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to ensure member exists for existing users
CREATE OR REPLACE FUNCTION public.ensure_member_exists()
RETURNS void AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Loop through all auth users and ensure they have a member record
  FOR user_record IN SELECT id, email, raw_user_meta_data FROM auth.users LOOP
    INSERT INTO public.members (id, email, full_name, role, is_active)
    VALUES (
      user_record.id,
      user_record.email,
      COALESCE(user_record.raw_user_meta_data->>'full_name', ''),
      'user',
      true
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.members.full_name),
      updated_at = now();
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function to backfill existing users
-- SELECT public.ensure_member_exists();
