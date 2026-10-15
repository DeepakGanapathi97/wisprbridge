-- ==============================================================================
-- WisprBridge: Production Database Schema & Realtime Setup
-- ==============================================================================

create extension if not exists "pgcrypto";

-- 1. Sessions Table (supports ephemeral 6-digit device pairing)
create table if not exists public.wispr_sessions (
    id uuid primary key default gen_random_uuid(),
    pair_code varchar(6) not null unique,
    device_label text default 'Mobile Device',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    expires_at timestamp with time zone default (timezone('utc'::text, now()) + interval '24 hours') not null,
    is_active boolean default true not null
);

create index if not exists idx_wispr_sessions_pair_code on public.wispr_sessions(pair_code);

-- 2. Prompts Table
create table if not exists public.wispr_prompts (
    id uuid primary key default gen_random_uuid(),
    session_id uuid references public.wispr_sessions(id) on delete cascade not null,
    text text not null,
    is_kept boolean default false not null,
    copied_count int default 0 not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    expires_at timestamp with time zone default (timezone('utc'::text, now()) + interval '1 hour') not null
);

create index if not exists idx_wispr_prompts_session_created on public.wispr_prompts(session_id, created_at desc);

-- 3. Row Level Security
alter table public.wispr_sessions enable row level security;
alter table public.wispr_prompts enable row level security;

create policy "Allow public wispr_sessions select" on public.wispr_sessions for select using (true);
create policy "Allow public wispr_sessions insert" on public.wispr_sessions for insert with check (true);
create policy "Allow public wispr_sessions update" on public.wispr_sessions for update using (true);

create policy "Allow public wispr_prompts select" on public.wispr_prompts for select using (true);
create policy "Allow public wispr_prompts insert" on public.wispr_prompts for insert with check (true);
create policy "Allow public wispr_prompts update" on public.wispr_prompts for update using (true);
create policy "Allow public wispr_prompts delete" on public.wispr_prompts for delete using (true);

-- 4. Supabase Realtime Replication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'wispr_prompts'
  ) then
    alter publication supabase_realtime add table public.wispr_prompts;
  end if;
end $$;

-- 5. Auto-Purge Cleanup Function
create or replace function public.cleanup_expired_wispr_prompts()
returns void as $$
begin
    delete from public.wispr_prompts
    where is_kept = false
      and expires_at < timezone('utc'::text, now());
      
    delete from public.wispr_sessions
    where expires_at < timezone('utc'::text, now());
end;
$$ language plpgsql security definer;
