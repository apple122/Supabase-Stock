-- Seed posts table: insert one sample post per existing user
-- Run this in the Supabase SQL editor or via psql.

-- Ensure pgcrypto is enabled for gen_random_uuid()
create extension if not exists "pgcrypto";

-- Insert a sample post for each profile that doesn't already have one with the same title
insert into public.posts (id, user_id, title, content)
select gen_random_uuid(), pr.id, 'Welcome to the app', 'This is an auto-generated sample post.'
from public.profiles pr
where not exists (
  select 1 from public.posts p where p.user_id = pr.id and p.title = 'Welcome to the app'
);

-- Verify inserted rows
select * from public.posts order by created_at desc limit 20;
