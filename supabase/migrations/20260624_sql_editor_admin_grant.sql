-- Allow Supabase SQL Editor (postgres) + service_role to update billing fields.
-- Without this, manual UPDATE in Dashboard appears to run but plan/vip fields are silently reverted.

create or replace function public.protect_user_billing_fields()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'service_role'
    or current_user in ('postgres', 'supabase_admin', 'service_role')
  then
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

-- One-shot admin grant by email (uses auth.users as source of truth).
create or replace function public.admin_grant_streamer_by_email(
  p_email text,
  p_founding_creator boolean default false,
  p_days integer default 90
)
returns table (
  id uuid,
  email text,
  plan text,
  vip_status text,
  vip_until timestamptz,
  is_founding_creator boolean,
  founding_enrolled_at timestamptz,
  lemon_squeezy_variant_id text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_email text;
begin
  v_email := lower(trim(p_email));
  if v_email = '' then
    raise exception 'email is required';
  end if;

  select au.id into v_user_id
  from auth.users au
  where lower(au.email) = v_email;

  if v_user_id is null then
    raise exception 'No auth.users row for email: %', p_email;
  end if;

  insert into public.users (id, email, display_name, avatar_url)
  select
    au.id,
    au.email,
    coalesce(au.raw_user_meta_data->>'name', au.raw_user_meta_data->>'full_name'),
    au.raw_user_meta_data->>'avatar_url'
  from auth.users au
  where au.id = v_user_id
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  update public.users u
  set
    plan = 'streamer',
    vip_status = 'active',
    vip_until = now() + make_interval(days => p_days),
    is_founding_creator = case when p_founding_creator then true else u.is_founding_creator end,
    founding_enrolled_at = case
      when p_founding_creator then coalesce(u.founding_enrolled_at, now())
      else u.founding_enrolled_at
    end,
    lemon_squeezy_variant_id = '1771738',
    lemon_squeezy_subscription_id = null,
    updated_at = now()
  where u.id = v_user_id;

  return query
  select
    u.id,
    u.email,
    u.plan,
    u.vip_status,
    u.vip_until,
    u.is_founding_creator,
    u.founding_enrolled_at,
    u.lemon_squeezy_variant_id
  from public.users u
  where u.id = v_user_id;
end;
$$;

comment on function public.admin_grant_streamer_by_email is
  'Manual Streamer Pass grant from SQL Editor. Example: select * from admin_grant_streamer_by_email(''user@example.com'', true, 90);';
