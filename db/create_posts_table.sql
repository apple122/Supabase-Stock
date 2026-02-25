-- Create posts table with a user relation (Supabase / Postgres)
-- Run this in the Supabase SQL editor or via psql.

-- Ensure gen_random_uuid() is available
create extension if not exists "pgcrypto";

-- Create table
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  content text,
  created_at timestamptz not null default now()
);

create index if not exists idx_posts_user_id on public.posts(user_id);

-- Sample insert (replace <USER_UUID> with an actual user id from your profiles table)
insert into public.posts (user_id, title, content)
values ('<USER_UUID>', 'Welcome to the app', 'This is a sample post created for the user.');
