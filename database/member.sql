-- Members table - Foundation for the entire system
-- This table must be created FIRST as it's referenced by projects and tasks

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
) TABLESPACE pg_default;

-- Indexes for better performance
create index IF not exists idx_members_email_btree on public.members using btree (email) TABLESPACE pg_default;

create index IF not exists idx_members_role_btree on public.members using btree (role) TABLESPACE pg_default;

create index IF not exists idx_members_active_btree on public.members using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_members_created_at_btree on public.members using btree (created_at) TABLESPACE pg_default;

-- Enable Row Level Security
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for members
CREATE POLICY "Users can view their own profile" ON members
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON members
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Allow insert for new user creation (used by trigger)
CREATE POLICY "Allow insert for new users" ON members
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all members" ON members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE id::text = auth.uid()::text 
      AND role = 'admin'
    )
  );
