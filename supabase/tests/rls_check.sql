-- Row Level Security and validation checks for HisabBondhu.
--
-- Runs entirely inside a transaction that is ROLLED BACK: it creates two
-- throw-away users, acts as each of them, records pass/fail results, prints
-- them, and leaves no data behind.
--
-- Run against the linked project:
--   npx supabase db query --remote -f supabase/tests/rls_check.sql

begin;

create temp table rls_results (test text not null, passed boolean not null) on commit drop;
grant insert, select on rls_results to authenticated, anon;

insert into auth.users (id, instance_id, aud, role, email)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'rls-user-a@example.invalid'),
  ('bbbbbbbb-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'rls-user-b@example.invalid');

------------------------------------------------------------------------------
-- Act as user A: create data
------------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}', true);

insert into public.transactions (type, amount_poisha, category_id, payment_method, occurred_on)
values ('expense', 125050, 'food', 'bkash', '2026-11-01');
insert into public.budgets (scope, effective_from, limit_poisha)
values ('overall', '2026-11-01', 3000000);

insert into rls_results
select 'A sees own transaction, owner set automatically', count(*) = 1
from public.transactions where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';

insert into rls_results select 'A sees own budget', count(*) = 1 from public.budgets;

-- Validation enforced by the database
do $$
declare
  ok boolean;
begin
  begin
    insert into public.transactions (type, amount_poisha, category_id, payment_method, occurred_on)
    values ('income', 1000, 'food', 'cash', '2026-11-01');
    ok := false;
  exception when check_violation then ok := true;
  end;
  insert into rls_results values ('rejects category not matching type', ok);

  begin
    insert into public.transactions (type, amount_poisha, category_id, payment_method, occurred_on)
    values ('expense', 0, 'food', 'cash', '2026-11-01');
    ok := false;
  exception when check_violation then ok := true;
  end;
  insert into rls_results values ('rejects zero amount', ok);

  begin
    insert into public.transactions (type, amount_poisha, category_id, payment_method, occurred_on)
    values ('expense', 1000, 'food', 'cash', (now() at time zone 'Asia/Dhaka')::date + 1);
    ok := false;
  exception when check_violation then ok := true;
  end;
  insert into rls_results values ('rejects future date (Dhaka)', ok);

  begin
    insert into public.budgets (scope, effective_from, limit_poisha)
    values ('food', '2026-11-15', 1000);
    ok := false;
  exception when check_violation then ok := true;
  end;
  insert into rls_results values ('rejects budget not starting on 1st', ok);

  begin
    insert into public.budgets (scope, effective_from, limit_poisha)
    values ('salary', '2026-11-01', 1000);
    ok := false;
  exception when check_violation then ok := true;
  end;
  insert into rls_results values ('rejects budget for income category', ok);
end $$;

------------------------------------------------------------------------------
-- Act as user B: must not see or change A's data
------------------------------------------------------------------------------
select set_config('request.jwt.claims',
  '{"sub":"bbbbbbbb-0000-4000-8000-000000000002","role":"authenticated"}', true);

insert into rls_results select 'B cannot read A transactions', count(*) = 0 from public.transactions;
insert into rls_results select 'B cannot read A budgets', count(*) = 0 from public.budgets;

with changed as (update public.transactions set amount_poisha = 1 returning 1)
insert into rls_results select 'B cannot update A transactions', count(*) = 0 from changed;

with removed as (delete from public.transactions returning 1)
insert into rls_results select 'B cannot delete A transactions', count(*) = 0 from removed;

with changed as (update public.budgets set limit_poisha = 1 returning 1)
insert into rls_results select 'B cannot update A budgets', count(*) = 0 from changed;

do $$
declare
  ok boolean;
begin
  begin
    insert into public.transactions
      (user_id, type, amount_poisha, category_id, payment_method, occurred_on)
    values
      ('aaaaaaaa-0000-4000-8000-000000000001', 'expense', 1, 'food', 'cash', '2026-11-01');
    ok := false;
  exception when insufficient_privilege then ok := true;
  end;
  insert into rls_results values ('B cannot insert a row owned by A', ok);
end $$;

------------------------------------------------------------------------------
-- Back to A: data untouched; A cannot hand a row to B
------------------------------------------------------------------------------
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}', true);

insert into rls_results
select 'A data unchanged after B attempts', count(*) = 1 and min(amount_poisha) = 125050
from public.transactions;

do $$
declare
  ok boolean;
begin
  begin
    update public.transactions set user_id = 'bbbbbbbb-0000-4000-8000-000000000002';
    ok := false;
  exception when insufficient_privilege then ok := true;
  end;
  insert into rls_results values ('A cannot move a row to B', ok);
end $$;

------------------------------------------------------------------------------
-- Signed-out (anon): no access at all
------------------------------------------------------------------------------
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

do $$
declare
  ok boolean;
begin
  begin
    perform count(*) from public.transactions;
    ok := false;
  exception when insufficient_privilege then ok := true;
  end;
  insert into rls_results values ('anon cannot read transactions', ok);

  begin
    perform count(*) from public.budgets;
    ok := false;
  exception when insufficient_privilege then ok := true;
  end;
  insert into rls_results values ('anon cannot read budgets', ok);
end $$;

reset role;
select test, passed from rls_results;

rollback;
