-- =============================================================================
-- Time Loop AI — Supabase 完整資料庫結構
-- =============================================================================
-- 使用方式：
--   1. 打開 Supabase Dashboard → SQL Editor → New query
--   2. 整份複製貼上 → Run
--   3. 確認 Storage 已出現 buckets：generated-backgrounds、generated-depths
--   4. Authentication → Providers → 啟用 Email（建議 OTP / Magic Link）
--
-- 本腳本可重複執行（idempotent）：已存在的表/策略會先 drop 再建立。
-- 伺服器 API 使用 SUPABASE_SERVICE_ROLE_KEY，會繞過 RLS。
-- 前端僅用 anon key + Auth；直接改 DB 時仍受 RLS 保護。
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. public.users — 使用者與訂閱 / 點數狀態
--    與 auth.users 一對一；註冊時由 trigger 自動建立列
-- -----------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,

  plan text not null default 'free'
    check (plan in ('free', 'vip')),
  vip_status text not null default 'inactive'
    check (vip_status in ('inactive', 'active', 'past_due', 'cancelled', 'paused', 'expired')),
  vip_until timestamptz,

  monthly_generation_limit integer not null default 5,
  remaining_credits integer not null default 5 check (remaining_credits >= 0),
  credits_reset_at timestamptz not null default (now() + interval '1 month'),

  lemon_squeezy_customer_id text,
  lemon_squeezy_subscription_id text,
  lemon_squeezy_subscription_item_id text,
  lemon_squeezy_variant_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.users is 'App profile: billing, VIP, credits (1:1 with auth.users)';
comment on column public.users.plan is 'free | vip';
comment on column public.users.vip_status is 'Lemon Squeezy subscription lifecycle';
comment on column public.users.remaining_credits is 'Free-tier generations; VIP bypasses deduction in API';

-- -----------------------------------------------------------------------------
-- 2. public.generated_worlds — AI 生成世界（背景圖 + 深度圖 + 元資料）
-- -----------------------------------------------------------------------------
create table if not exists public.generated_worlds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,

  prompt text not null,
  rewritten_prompt text,
  title text,

  background_image text not null,
  depth_map text not null,
  storage_background_path text,
  storage_depth_path text,

  particle_preset text not null default 'cyberpunk',
  shader_preset text,
  ambience_audio text,

  width integer default 1024,
  height integer default 576,
  quality text not null default 'standard'
    check (quality in ('standard', 'high', '4k')),

  is_featured boolean not null default false,
  is_private boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.generated_worlds is 'User-generated ambient worlds; featured+public visible in gallery';

-- -----------------------------------------------------------------------------
-- 3. public.credit_transactions — 點數流水帳（購買 / 生成扣點 / 每月重置）
-- -----------------------------------------------------------------------------
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,

  amount integer not null,
  balance_after integer,
  type text not null
    check (type in ('purchase', 'generation', 'refund', 'monthly_reset', 'admin_adjustment')),

  source text not null default 'system'
    check (source in ('system', 'lemon_squeezy', 'generation', 'admin')),

  lemon_squeezy_order_id text,
  lemon_squeezy_subscription_id text,
  lemon_squeezy_event_id text,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

comment on table public.credit_transactions is 'Immutable ledger for credits and billing events';

-- -----------------------------------------------------------------------------
-- 4. public.lemon_squeezy_events — Webhook 事件去重（僅後端 service role 寫入）
-- -----------------------------------------------------------------------------
create table if not exists public.lemon_squeezy_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_name text not null,
  order_id text,
  subscription_id text,
  payload jsonb not null,
  processed_at timestamptz not null default now()
);

comment on table public.lemon_squeezy_events is 'Webhook idempotency log; no client access';

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------
create unique index if not exists credit_transactions_unique_order_purchase_idx
  on public.credit_transactions(lemon_squeezy_order_id)
  where lemon_squeezy_order_id is not null and type = 'purchase';

create index if not exists generated_worlds_user_id_idx
  on public.generated_worlds(user_id, created_at desc);

create index if not exists generated_worlds_featured_idx
  on public.generated_worlds(is_featured, created_at desc)
  where is_featured = true and is_private = false;

create index if not exists credit_transactions_user_id_idx
  on public.credit_transactions(user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Triggers: updated_at
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists generated_worlds_set_updated_at on public.generated_worlds;
create trigger generated_worlds_set_updated_at
before update on public.generated_worlds
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Trigger: 新用戶註冊 → 自動建立 public.users 列
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- -----------------------------------------------------------------------------
-- Trigger: 防止使用者透過 RLS 自行修改 VIP / 點數 / Lemon 欄位
--         （僅 service_role 或 security definer 可改）
-- -----------------------------------------------------------------------------
create or replace function public.protect_user_billing_fields()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  new.plan := old.plan;
  new.vip_status := old.vip_status;
  new.vip_until := old.vip_until;
  new.monthly_generation_limit := old.monthly_generation_limit;
  new.remaining_credits := old.remaining_credits;
  new.credits_reset_at := old.credits_reset_at;
  new.lemon_squeezy_customer_id := old.lemon_squeezy_customer_id;
  new.lemon_squeezy_subscription_id := old.lemon_squeezy_subscription_id;
  new.lemon_squeezy_subscription_item_id := old.lemon_squeezy_subscription_item_id;
  new.lemon_squeezy_variant_id := old.lemon_squeezy_variant_id;
  new.email := old.email;
  new.id := old.id;

  return new;
end;
$$;

drop trigger if exists users_protect_billing_fields on public.users;
create trigger users_protect_billing_fields
before update on public.users
for each row execute function public.protect_user_billing_fields();

-- -----------------------------------------------------------------------------
-- Storage buckets（私有；由 API 上傳並簽發 signed URL）
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'generated-backgrounds',
    'generated-backgrounds',
    false,
    52428800,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'generated-depths',
    'generated-depths',
    false,
    52428800,
    array['image/png', 'image/jpeg']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- Row Level Security — public tables
-- -----------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.generated_worlds enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.lemon_squeezy_events enable row level security;

-- users
drop policy if exists "Users can read own profile" on public.users;
create policy "Users can read own profile"
on public.users for select to authenticated
using (auth.uid() = id);

drop policy if exists "Users can update own profile basic fields" on public.users;
create policy "Users can update own profile basic fields"
on public.users for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- generated_worlds
drop policy if exists "Public can read featured worlds" on public.generated_worlds;
create policy "Public can read featured worlds"
on public.generated_worlds for select to anon
using (is_featured = true and is_private = false);

drop policy if exists "Users can read own worlds and featured worlds" on public.generated_worlds;
create policy "Users can read own worlds and featured worlds"
on public.generated_worlds for select to authenticated
using (user_id = auth.uid() or (is_featured = true and is_private = false));

drop policy if exists "Users can insert own worlds" on public.generated_worlds;
create policy "Users can insert own worlds"
on public.generated_worlds for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own worlds" on public.generated_worlds;
create policy "Users can update own worlds"
on public.generated_worlds for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own worlds" on public.generated_worlds;
create policy "Users can delete own worlds"
on public.generated_worlds for delete to authenticated
using (user_id = auth.uid());

-- credit_transactions（僅讀自己的流水；寫入僅 service role API）
drop policy if exists "Users can read own credit transactions" on public.credit_transactions;
create policy "Users can read own credit transactions"
on public.credit_transactions for select to authenticated
using (user_id = auth.uid());

-- lemon_squeezy_events：不建立任何 client policy → 預設全部拒絕

-- -----------------------------------------------------------------------------
-- Storage RLS — 使用者只能讀取自己資料夾下的檔案
-- 路徑格式：{user_id}/{world_id}-timestamp-bg.jpg
-- 注意：勿對 storage.objects 執行 ALTER（Supabase 會報 must be owner）。
--       storage.objects 在專案中預設已啟用 RLS。
-- 若下方 CREATE POLICY 仍失敗，請改在 Dashboard → Storage → Policies 手動新增
-- （或執行 supabase/schema-storage-policies.sql）。
-- -----------------------------------------------------------------------------

drop policy if exists "Users read own generated backgrounds" on storage.objects;
create policy "Users read own generated backgrounds"
on storage.objects for select to authenticated
using (
  bucket_id = 'generated-backgrounds'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users read own generated depths" on storage.objects;
create policy "Users read own generated depths"
on storage.objects for select to authenticated
using (
  bucket_id = 'generated-depths'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 上傳 / 刪除由 Next.js API（service role）處理，不開放給 anon/authenticated 直接寫入
