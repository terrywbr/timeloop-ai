-- Community Phase 1–2b: gallery, social, co-focus

alter table public.generated_worlds
  add column if not exists published_at timestamptz,
  add column if not exists mood_id text,
  add column if not exists description text,
  add column if not exists tags text[] default '{}'::text[],
  add column if not exists view_count integer not null default 0,
  add column if not exists like_count integer not null default 0;

create index if not exists generated_worlds_public_published_idx
  on public.generated_worlds (published_at desc nulls last)
  where is_private = false;

-- -----------------------------------------------------------------------------
-- world_likes
-- -----------------------------------------------------------------------------
create table if not exists public.world_likes (
  user_id uuid not null references public.users(id) on delete cascade,
  world_id uuid not null references public.generated_worlds(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, world_id)
);

create index if not exists world_likes_world_id_idx on public.world_likes (world_id);

-- -----------------------------------------------------------------------------
-- world_saves
-- -----------------------------------------------------------------------------
create table if not exists public.world_saves (
  user_id uuid not null references public.users(id) on delete cascade,
  world_id uuid not null references public.generated_worlds(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, world_id)
);

create index if not exists world_saves_world_id_idx on public.world_saves (world_id);

-- -----------------------------------------------------------------------------
-- follows
-- -----------------------------------------------------------------------------
create table if not exists public.follows (
  follower_id uuid not null references public.users(id) on delete cascade,
  following_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists follows_following_id_idx on public.follows (following_id);

-- -----------------------------------------------------------------------------
-- reports
-- -----------------------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users(id) on delete cascade,
  world_id uuid not null references public.generated_worlds(id) on delete cascade,
  reason text not null,
  status text not null default 'pending'
    check (status in ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists reports_world_id_idx on public.reports (world_id, created_at desc);

-- -----------------------------------------------------------------------------
-- focus_sessions (co-focus presence)
-- -----------------------------------------------------------------------------
create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.generated_worlds(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  session_key text not null,
  last_seen_at timestamptz not null default now(),
  unique (world_id, session_key)
);

create index if not exists focus_sessions_world_active_idx
  on public.focus_sessions (world_id, last_seen_at desc);

-- -----------------------------------------------------------------------------
-- like_count trigger
-- -----------------------------------------------------------------------------
create or replace function public.sync_world_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.generated_worlds
    set like_count = like_count + 1
    where id = new.world_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.generated_worlds
    set like_count = greatest(0, like_count - 1)
    where id = old.world_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists world_likes_sync_count on public.world_likes;
create trigger world_likes_sync_count
after insert or delete on public.world_likes
for each row execute function public.sync_world_like_count();

-- -----------------------------------------------------------------------------
-- RLS (service role APIs; minimal client policies)
-- -----------------------------------------------------------------------------
alter table public.world_likes enable row level security;
alter table public.world_saves enable row level security;
alter table public.follows enable row level security;
alter table public.reports enable row level security;
alter table public.focus_sessions enable row level security;

drop policy if exists "Users manage own likes" on public.world_likes;
create policy "Users manage own likes"
on public.world_likes for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users manage own saves" on public.world_saves;
create policy "Users manage own saves"
on public.world_saves for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users manage own follows" on public.follows;
create policy "Users manage own follows"
on public.follows for all to authenticated
using (auth.uid() = follower_id)
with check (auth.uid() = follower_id);

drop policy if exists "Users insert own reports" on public.reports;
create policy "Users insert own reports"
on public.reports for insert to authenticated
with check (auth.uid() = reporter_id);

drop policy if exists "Users read own reports" on public.reports;
create policy "Users read own reports"
on public.reports for select to authenticated
using (auth.uid() = reporter_id);
