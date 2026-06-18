-- Streamer scene packs (phase 1)
-- Adds pack management + monthly streamer generation quota.

alter table public.users
  add column if not exists streamer_monthly_quota_images integer not null default 300;

create table if not exists public.streamer_scene_packs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  mood_id text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  is_loop boolean not null default true,
  play_order text not null default 'sequential' check (play_order in ('sequential', 'random')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_streamer_scene_packs_user_id
  on public.streamer_scene_packs(user_id);

create table if not exists public.streamer_scene_pack_items (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid not null references public.streamer_scene_packs(id) on delete cascade,
  image_url text not null,
  storage_path text,
  sort_order integer not null default 0,
  duration_sec integer not null default 120 check (duration_sec >= 15 and duration_sec <= 3600),
  seed text,
  prompt_snapshot text,
  created_at timestamptz not null default now()
);

create index if not exists idx_streamer_scene_pack_items_pack_id
  on public.streamer_scene_pack_items(pack_id);

create table if not exists public.streamer_quota_usage_monthly (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  month_key text not null,
  used_images integer not null default 0 check (used_images >= 0),
  quota_images integer not null default 300 check (quota_images >= 0),
  updated_at timestamptz not null default now()
);

alter table public.streamer_scene_packs enable row level security;
alter table public.streamer_scene_pack_items enable row level security;
alter table public.streamer_quota_usage_monthly enable row level security;

drop policy if exists "scene_packs_select_own" on public.streamer_scene_packs;
create policy "scene_packs_select_own"
  on public.streamer_scene_packs
  for select
  using (auth.uid() = user_id);

drop policy if exists "scene_packs_insert_own" on public.streamer_scene_packs;
create policy "scene_packs_insert_own"
  on public.streamer_scene_packs
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "scene_packs_update_own" on public.streamer_scene_packs;
create policy "scene_packs_update_own"
  on public.streamer_scene_packs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "scene_packs_delete_own" on public.streamer_scene_packs;
create policy "scene_packs_delete_own"
  on public.streamer_scene_packs
  for delete
  using (auth.uid() = user_id);

drop policy if exists "scene_pack_items_select_own" on public.streamer_scene_pack_items;
create policy "scene_pack_items_select_own"
  on public.streamer_scene_pack_items
  for select
  using (
    exists (
      select 1
      from public.streamer_scene_packs packs
      where packs.id = pack_id and packs.user_id = auth.uid()
    )
  );

drop policy if exists "scene_pack_items_insert_own" on public.streamer_scene_pack_items;
create policy "scene_pack_items_insert_own"
  on public.streamer_scene_pack_items
  for insert
  with check (
    exists (
      select 1
      from public.streamer_scene_packs packs
      where packs.id = pack_id and packs.user_id = auth.uid()
    )
  );

drop policy if exists "scene_pack_items_update_own" on public.streamer_scene_pack_items;
create policy "scene_pack_items_update_own"
  on public.streamer_scene_pack_items
  for update
  using (
    exists (
      select 1
      from public.streamer_scene_packs packs
      where packs.id = pack_id and packs.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.streamer_scene_packs packs
      where packs.id = pack_id and packs.user_id = auth.uid()
    )
  );

drop policy if exists "scene_pack_items_delete_own" on public.streamer_scene_pack_items;
create policy "scene_pack_items_delete_own"
  on public.streamer_scene_pack_items
  for delete
  using (
    exists (
      select 1
      from public.streamer_scene_packs packs
      where packs.id = pack_id and packs.user_id = auth.uid()
    )
  );

drop policy if exists "streamer_quota_select_own" on public.streamer_quota_usage_monthly;
create policy "streamer_quota_select_own"
  on public.streamer_quota_usage_monthly
  for select
  using (auth.uid() = user_id);
