-- HisabBondhu: user profile and preferences, and self-service account deletion.
--
-- Money columns (amount_poisha, limit_poisha, opening_balance_minor) hold
-- integer minor units of the user's chosen currency (poisha for BDT, cents
-- for USD, ...). Changing currency does NOT convert amounts; it only changes
-- how they are displayed. Every supported currency uses 2 decimal places.

------------------------------------------------------------------------------
-- Profiles (one row per user)
------------------------------------------------------------------------------

create table public.profiles (
  user_id               uuid primary key default auth.uid()
                          references auth.users (id) on delete cascade,
  display_name          text check (display_name is null or char_length(display_name) between 1 and 60),
  currency              text not null default 'BDT' check (currency in (
                          'BDT', 'USD', 'EUR', 'GBP', 'INR', 'PKR', 'NPR', 'LKR',
                          'SAR', 'AED', 'QAR', 'MYR', 'SGD', 'CAD', 'AUD')),
  -- Money the user already had on opening_balance_date. Transactions dated on
  -- or after that day change the balance; earlier ones are history only.
  opening_balance_minor bigint not null default 0 check (
                          opening_balance_minor between -9007199254740991 and 9007199254740991),
  opening_balance_date  date,
  theme                 text not null default 'system' check (theme in ('system', 'light', 'dark')),
  -- 0 = Sunday … 6 = Saturday. Saturday is the common first day in Bangladesh.
  week_starts_on        smallint not null default 6 check (week_starts_on between 0 and 6),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.profiles is 'Per-user preferences and opening balance. Row created by the app on first use.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create their own profile"
  on public.profiles for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- No delete policy: a profile is removed only together with the account.

revoke all on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;

------------------------------------------------------------------------------
-- Delete my account (Play Store requires in-app account deletion)
------------------------------------------------------------------------------

-- Runs with the owner's rights because only the auth service may delete
-- users; it can only ever delete the caller's own account. Transactions,
-- budgets and the profile are removed by ON DELETE CASCADE.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'Not signed in' using errcode = 'insufficient_privilege';
  end if;
  delete from auth.users where id = caller;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
