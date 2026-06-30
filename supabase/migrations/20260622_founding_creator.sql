-- Founding Creator Program: profile flags for inaugural creator partners

alter table public.users
  add column if not exists is_founding_creator boolean not null default false;

alter table public.users
  add column if not exists founding_enrolled_at timestamptz;

comment on column public.users.is_founding_creator is 'Founding Creator Program — OBS badge + ops perks';
comment on column public.users.founding_enrolled_at is 'When admin enrolled user into Founding Creator Program';

create index if not exists users_founding_creator_idx
  on public.users (is_founding_creator, founding_enrolled_at desc)
  where is_founding_creator = true;
