-- Create ap_system.users table
-- Run this in the Supabase SQL editor or via psql.

create schema if not exists ap_system;

create table if not exists ap_system.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  phone text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ap_system_users_email on ap_system.users(email);

-- Optional: grant select to anon (be careful with privacy)
-- grant select on ap_system.users to anon;
