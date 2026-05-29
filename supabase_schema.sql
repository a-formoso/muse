-- ============================================================
-- Infinite Studio AI — Screenwriting Playbook
-- Run ONLY these statements in your Supabase SQL editor.
-- The `users` and `app_subscriptions` tables already exist.
-- ============================================================

-- 1. user_profiles
-- Per-user Studio flags: studio_plan (standalone sub) + trial tracking.
create table if not exists public.user_profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text,
  created_at          timestamptz not null default now(),
  studio_trial_used   boolean not null default false,
  -- standalone Studio subscription plan: 'playwright' | 'director' | 'studio' | null
  studio_plan         text default null
);

alter table public.user_profiles enable row level security;

drop policy if exists "Users read own profile" on public.user_profiles;
drop policy if exists "Users insert own profile" on public.user_profiles;
drop policy if exists "Users update own profile" on public.user_profiles;
drop policy if exists "Service role full access on user_profiles" on public.user_profiles;

create policy "Users read own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Users insert own profile"
  on public.user_profiles for insert
  with check (auth.uid() = id);

create policy "Users update own profile"
  on public.user_profiles for update
  using (auth.uid() = id);

create policy "Service role full access on user_profiles"
  on public.user_profiles for all
  to service_role
  using (true)
  with check (true);

-- If the table already existed without studio_plan, add the column:
alter table public.user_profiles
  add column if not exists studio_plan text default null;


-- 2. studio_usage
-- Monthly generation counters per user. One row per (user_id, month).
create table if not exists public.studio_usage (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users(id) on delete cascade,
  month                   text not null,           -- '2026-05'
  productions_used        int not null default 0,
  character_grids_used    int not null default 0,
  shot_generations_used   int not null default 0,
  video_promotions_used   int not null default 0,
  unique(user_id, month)
);

alter table public.studio_usage enable row level security;

drop policy if exists "Users read own usage" on public.studio_usage;
drop policy if exists "Users insert own usage" on public.studio_usage;
drop policy if exists "Users update own usage" on public.studio_usage;
drop policy if exists "Service role full access on studio_usage" on public.studio_usage;

create policy "Users read own usage"
  on public.studio_usage for select
  using (auth.uid() = user_id);

create policy "Users insert own usage"
  on public.studio_usage for insert
  with check (auth.uid() = user_id);

create policy "Users update own usage"
  on public.studio_usage for update
  using (auth.uid() = user_id);

create policy "Service role full access on studio_usage"
  on public.studio_usage for all
  to service_role
  using (true)
  with check (true);


-- ============================================================
-- HOW TIERS ARE RESOLVED (priority order):
--
-- 1. user_profiles.studio_plan
--      'playwright' → Phases 1-3 only, 3 productions/month, no visuals
--      'director'   → All phases, 3 productions, 15 grids, 30 shots, 10 videos
--      'studio'     → All phases, unlimited productions, 50 grids, 150 shots, 50 videos
--
-- 2. users.active_subscription_tier (IS membership fallback)
--      contains 'inner' / 'inner circle' → studio tier
--      any other non-null value          → director tier
--
-- 3. app_subscriptions (active rows)
--
-- 4. user_profiles.studio_trial_used = false → trial (Phases 1-3, 1 production)
--    trial is consumed after completing Phase 3
--
-- 5. none → Upgrade Wall
--
-- TO GRANT A PLAN to a user manually:
--   update public.user_profiles set studio_plan = 'director' where id = '<auth_user_id>';
-- ============================================================
