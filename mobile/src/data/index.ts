import { randomUUID } from 'expo-crypto';

import { getDatabase } from './database';
import { createSqliteTransactionRepository } from './transactionRepository';

export type { TransactionRepository } from './transactionRepository';

/** App-wide repository instance (local SQLite until Supabase in M6). */
export const transactionRepository = createSqliteTransactionRepository({
  getDatabase,
  generateId: randomUUID,
  now: () => new Date(),
});
