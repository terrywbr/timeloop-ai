-- Repair: allow plan = 'streamer' and fix rows stored as vip (legacy compat fallback).
-- Run in Supabase SQL Editor if streamer grants show plan = 'vip' in Table Editor.

-- 1) Ensure plan constraint accepts streamer (idempotent)
alter table public.users drop constraint if exists users_plan_check;
alter table public.users add constraint users_plan_check
  check (plan in ('free', 'vip', 'streamer'));

-- 2) Founding Creator columns (if 20260622 not applied yet)
alter table public.users
  add column if not exists is_founding_creator boolean not null default false;

alter table public.users
  add column if not exists founding_enrolled_at timestamptz;

-- 3) Promote mislabeled Streamer Pass accounts (plan was forced to vip)
-- Official Streamer Lemon variant (APPWAVE AI store) — see docs/github-deploy.md
update public.users
set
  plan = 'streamer',
  updated_at = now()
where plan = 'vip'
  and (
    is_founding_creator = true
    or lemon_squeezy_variant_id = '1771738'
  );

comment on column public.users.plan is 'free | vip | streamer — streamer = Streamer Pass (creator tools)';
