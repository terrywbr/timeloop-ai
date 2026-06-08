-- Phase 1: Streamer Pass — overlay settings, backgrounds, affiliate tracking

alter table public.users drop constraint if exists users_plan_check;
alter table public.users add constraint users_plan_check check (plan in ('free', 'vip', 'streamer'));

alter table public.users add column if not exists referred_by_affiliate_slug text;
alter table public.users add column if not exists referred_at timestamptz;

create table if not exists public.affiliates (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  display_name text,
  owner_user_id uuid references public.users(id) on delete set null,
  commission_rate numeric not null default 0.20,
  created_at timestamptz not null default now()
);

create table if not exists public.affiliate_conversions (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  affiliate_slug text not null,
  user_id uuid references public.users(id) on delete set null,
  amount_cents integer,
  currency text default 'USD',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'paid', 'rejected')),
  lemon_order_id text,
  lemon_subscription_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists affiliate_conversions_slug_idx on public.affiliate_conversions (affiliate_slug);
create index if not exists affiliate_conversions_user_idx on public.affiliate_conversions (user_id);

create table if not exists public.streamer_settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  overlay jsonb not null default '{}'::jsonb,
  background_rotation_minutes integer not null default 5
    check (background_rotation_minutes in (5, 10)),
  updated_at timestamptz not null default now()
);

create table if not exists public.streamer_backgrounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  sort_order integer not null default 0,
  source text not null default 'upload'
    check (source in ('upload', 'generated')),
  created_at timestamptz not null default now()
);

create index if not exists streamer_backgrounds_user_idx on public.streamer_backgrounds (user_id, sort_order);

insert into storage.buckets (id, name, public)
values ('streamer-backgrounds', 'streamer-backgrounds', true)
on conflict (id) do nothing;
