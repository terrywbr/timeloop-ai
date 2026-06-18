-- Align free tier with 10-credit generation cost.
-- Free users receive 50 credits monthly (5 standard generations).

alter table public.users
  alter column monthly_generation_limit set default 50,
  alter column remaining_credits set default 50;

update public.users
set
  monthly_generation_limit = 50,
  remaining_credits = greatest(remaining_credits, 50)
where plan = 'free'
  and (monthly_generation_limit < 50 or remaining_credits < 50);
