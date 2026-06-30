-- Live Network: streamer on-air presence + per-room viewer sessions

create table if not exists public.streamer_live_presence (
  user_id uuid primary key references public.users(id) on delete cascade,
  room_name text not null,
  country_flag text not null default '🌍',
  subtitle text not null default 'Live',
  icon text not null default '🎧',
  viewer_count integer not null default 0 check (viewer_count >= 0),
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.streamer_live_presence is 'Active streamer rooms for Live Network (?stream=1 heartbeat)';
comment on column public.streamer_live_presence.viewer_count is 'Denormalized concurrent viewers; refreshed from streamer_live_viewers';

create index if not exists streamer_live_presence_last_seen_idx
  on public.streamer_live_presence (last_seen_at desc);

create table if not exists public.streamer_live_viewers (
  streamer_user_id uuid not null references public.users(id) on delete cascade,
  session_key text not null,
  last_seen_at timestamptz not null default now(),
  primary key (streamer_user_id, session_key)
);

comment on table public.streamer_live_viewers is 'Ephemeral viewer sessions counted toward Live Network viewer_count';

create index if not exists streamer_live_viewers_active_idx
  on public.streamer_live_viewers (streamer_user_id, last_seen_at desc);

drop trigger if exists streamer_live_presence_set_updated_at on public.streamer_live_presence;
create trigger streamer_live_presence_set_updated_at
before update on public.streamer_live_presence
for each row execute function public.set_updated_at();

alter table public.streamer_live_presence enable row level security;
alter table public.streamer_live_viewers enable row level security;
