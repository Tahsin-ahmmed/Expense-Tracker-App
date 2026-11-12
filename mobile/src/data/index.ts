import { randomUUID } from 'expo-crypto';

import { createSqliteBudgetRepository } from './budgetRepository';
import { getDatabase } from './database';
import { createSqliteTransactionRepository } from './transactionRepository';

export type { BudgetRepository } from './budgetRepository';
export { NotFoundError, type TransactionRepository } from './transactionRepository';

const now = () => new Date();

/** App-wide repository instances (local SQLite until Supabase in M6). */
export const transactionRepository = createSqliteTransactionRepository({
  getDatabase,
  generateId: randomUUID,
  now,
});

export const budgetRepository = createSqliteBudgetRepository({ getDatabase, now });
