import { getSupabase } from './supabase/client';
import { createSupabaseBudgetRepository } from './supabase/budgetRepository';
import { createSupabaseTransactionRepository } from './supabase/transactionRepository';

export { NotFoundError, type BudgetRepository, type TransactionRepository } from './repositories';

/** The signed-in user's id. Throws if nobody is signed in. */
async function currentUserId(): Promise<string> {
  const { data, error } = await getSupabase().auth.getSession();
  const userId = data.session?.user.id;
  if (error || !userId) {
    throw new Error('Not signed in');
  }
  return userId;
}

/** App-wide repository instances backed by Supabase. */
export const transactionRepository = createSupabaseTransactionRepository(getSupabase);
export const budgetRepository = createSupabaseBudgetRepository(getSupabase, currentUserId);
