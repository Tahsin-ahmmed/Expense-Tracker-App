-- HisabBondhu: initial schema (M6)
--
-- Money is stored as bigint poisha (1 Taka = 100 poisha); never floating point.
-- Transaction dates are calendar days in Asia/Dhaka (Postgres `date`).
-- Every row belongs to one user and Row Level Security (RLS) restricts
-- each user to their own rows. The anonymous role gets no access at all.

------------------------------------------------------------------------------
-- Shared helpers
------------------------------------------------------------------------------

-- Keeps updated_at current on every UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

------------------------------------------------------------------------------
-- Transactions
------------------------------------------------------------------------------

create table public.transactions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid()
                   references auth.users (id) on delete cascade,
  type           text not null check (type in ('income', 'expense')),
  -- Upper bound = JavaScript Number.MAX_SAFE_INTEGER, so the app never loses precision.
  amount_poisha  bigint not null check (amount_poisha > 0 and amount_poisha <= 9007199254740991),
  category_id    text not null,
  payment_method text not null check (payment_method in ('cash', 'bkash', 'nagad', 'bank', 'card')),
  note           text check (note is null or char_length(note) between 1 and 140),
  occurred_on    date not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  -- Category must exist and match the transaction type.
  constraint transactions_category_matches_type check (
    (type = 'expense' and category_id in (
      'food', 'transport', 'rent', 'bills', 'mobile_recharge', 'shopping',
      'health', 'education', 'family', 'entertainment', 'other_expense'))
    or
    (type = 'income' and category_id in (
      'salary', 'business', 'freelance', 'gift', 'other_income'))
  )
);

comment on table public.transactions is 'Income and expense entries. One row per entry, owned by user_id.';
comment on column public.transactions.amount_poisha is 'Positive amount in poisha (1 BDT = 100 poisha).';
comment on column public.transactions.occurred_on is 'Calendar day the transaction happened, in Asia/Dhaka.';

create index transactions_user_date_idx
  on public.transactions (user_id, occurred_on desc, created_at desc);

-- Server-side rule that a CHECK constraint cannot express (it depends on the
-- current date): no transactions in the future, judged in Dhaka time.
create or replace function public.validate_transaction()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.occurred_on > (now() at time zone 'Asia/Dhaka')::date then
    raise exception 'occurred_on cannot be in the future'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger transactions_validate
  before insert or update on public.transactions
  for each row execute function public.validate_transaction();

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

alter table public.transactions enable row level security;

-- `(select auth.uid())` is evaluated once per query instead of per row.
create policy "Users can read their own transactions"
  on public.transactions for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can add their own transactions"
  on public.transactions for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their own transactions"
  on public.transactions for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete their own transactions"
  on public.transactions for delete
  to authenticated
  using (user_id = (select auth.uid()));

------------------------------------------------------------------------------
-- Budgets (history of monthly limits)
------------------------------------------------------------------------------

create table public.budgets (
  user_id        uuid not null default auth.uid()
                   references auth.users (id) on delete cascade,
  scope          text not null check (scope in (
                   'overall', 'food', 'transport', 'rent', 'bills', 'mobile_recharge',
                   'shopping', 'health', 'education', 'family', 'entertainment',
                   'other_expense')),
  -- First day of the month from which this limit applies.
  effective_from date not null check (extract(day from effective_from) = 1),
  -- NULL means the budget was removed from effective_from onward.
  limit_poisha   bigint check (
                   limit_poisha is null
                   or (limit_poisha > 0 and limit_poisha <= 9007199254740991)),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  primary key (user_id, scope, effective_from)
);

comment on table public.budgets is
  'Monthly spending limits as history: the limit for a month is the latest row with effective_from <= that month.';

create trigger budgets_set_updated_at
  before update on public.budgets
  for each row execute function public.set_updated_at();

alter table public.budgets enable row level security;

create policy "Users can read their own budgets"
  on public.budgets for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can add their own budgets"
  on public.budgets for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their own budgets"
  on public.budgets for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete their own budgets"
  on public.budgets for delete
  to authenticated
  using (user_id = (select auth.uid()));

------------------------------------------------------------------------------
-- Privileges: signed-in users only. RLS above limits them to their own rows.
------------------------------------------------------------------------------

revoke all on public.transactions from anon;
revoke all on public.budgets from anon;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.budgets to authenticated;
