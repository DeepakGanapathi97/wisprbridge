-- ==============================================================================
-- WisprBridge: Production Database Schema & Realtime Setup
-- ==============================================================================

-- 1. Enable pgcrypto for UUID generation if not already enabled
create extension if not exists "pgcrypto";

-- 2. Sessions Table (supports ephemeral 6-digit device pairing)
create table if not exists public.sessions (
    id uuid primary key default gen_random_uuid(),
    pair_code varchar(6) not null unique,
    device_label text default 'Mobile Device',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    expires_at timestamp with time zone default (timezone('utc'::text, now()) + interval '24 hours') not null,
    is_active boolean default true not null
);

-- Index on pair_code for instant lookup during device handshake
create index if not exists idx_sessions_pair_code on public.sessions(pair_code);

-- 3. Prompts Table
create table if not exists public.prompts (
    id uuid primary key default gen_random_uuid(),
    session_id uuid references public.sessions(id) on delete cascade not null,
    text text not null,
    is_kept boolean default false not null,
    copied_count int default 0 not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    expires_at timestamp with time zone default (timezone('utc'::text, now()) + interval '1 hour') not null
);

-- Index on session_id and created_at for fast descending queries
create index if not exists idx_prompts_session_created on public.prompts(session_id, created_at desc);

-- 4. Enable Row Level Security (RLS)
alter table public.sessions enable row level security;
alter table public.prompts enable row level security;

-- Permissive policies for anon client access (paired by session UUID / pair_code)
create policy "Allow public session read" 
    on public.sessions for select 
    using (true);

create policy "Allow public session insert" 
    on public.sessions for insert 
    with check (true);

create policy "Allow public session update" 
    on public.sessions for update 
    using (true);

create policy "Allow public prompts read" 
    on public.prompts for select 
    using (true);

create policy "Allow public prompts insert" 
    on public.prompts for insert 
    with check (true);

create policy "Allow public prompts update" 
    on public.prompts for update 
    using (true);

create policy "Allow public prompts delete" 
    on public.prompts for delete 
    using (true);

-- 5. Enable Supabase Realtime Replication for Prompts
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'prompts'
  ) then
    alter publication supabase_realtime add table public.prompts;
  end if;
end $$;

-- 6. Cleanup Function: Purges expired prompts older than 1 hour that are NOT kept
create or replace function public.cleanup_expired_prompts()
returns void as $$
begin
    delete from public.prompts
    where is_kept = false
      and expires_at < timezone('utc'::text, now());
      
    -- Also clean up inactive sessions older than 24 hours
    delete from public.sessions
    where expires_at < timezone('utc'::text, now());
end;
$$ language plpgsql security definer;
