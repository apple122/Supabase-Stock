-- Create ap_system schema and a sample table
-- Run this in the Supabase SQL editor or via psql.

create schema if not exists ap_system;

-- Example table in ap_system for application settings
create table if not exists ap_system.system_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists idx_ap_system_settings_key on ap_system.system_settings(key);

-- Optional: grant usage/select to anon (review before enabling)
-- grant usage on schema ap_system to anon;
-- grant select on ap_system.system_settings to anon;
