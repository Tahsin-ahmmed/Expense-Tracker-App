import type { SQLiteDatabase } from 'expo-sqlite';

import { isCategoryId } from '@/domain/category';
import { isIsoDate } from '@/domain/date';
import { toPoisha } from '@/domain/money';
import {
  isPaymentMethod,
  isTransactionType,
  type NewTransaction,
  type Transaction,
} from '@/domain/transaction';

/**
 * Storage for transactions. Features depend on this interface only, so the
 * local SQLite implementation can be replaced by Supabase in M6.
 */
export interface TransactionRepository {
  /** All transactions, newest first. */
  listAll(): Promise<Transaction[]>;
  create(input: NewTransaction): Promise<Transaction>;
}

interface TransactionRow {
  id: string;
  type: string;
  amount_poisha: number;
  category_id: string;
  payment_method: string;
  note: string | null;
  occurred_on: string;
  created_at: string;
}

/** Converts a database row, rejecting rows that do not match the domain rules. */
function fromRow(row: TransactionRow): Transaction | null {
  if (
    !isTransactionType(row.type) ||
    !isCategoryId(row.category_id) ||
    !isPaymentMethod(row.payment_method) ||
    !isIsoDate(row.occurred_on) ||
    !Number.isSafeInteger(row.amount_poisha) ||
    row.amount_poisha <= 0
  ) {
    return null;
  }
  return {
    id: row.id,
    type: row.type,
    amount: toPoisha(row.amount_poisha),
    categoryId: row.category_id,
    paymentMethod: row.payment_method,
    note: row.note,
    occurredOn: row.occurred_on,
    createdAt: row.created_at,
  };
}

export interface SqliteRepositoryDeps {
  getDatabase: () => Promise<SQLiteDatabase>;
  generateId: () => string;
  now: () => Date;
}

export function createSqliteTransactionRepository({
  getDatabase,
  generateId,
  now,
}: SqliteRepositoryDeps): TransactionRepository {
  return {
    async listAll() {
      const db = await getDatabase();
      const rows = await db.getAllAsync<TransactionRow>(
        'SELECT * FROM transactions ORDER BY occurred_on DESC, created_at DESC',
      );
      return rows.map(fromRow).filter((row): row is Transaction => row !== null);
    },

    async create(input) {
      const transaction: Transaction = {
        ...input,
        id: generateId(),
        createdAt: now().toISOString(),
      };
      const db = await getDatabase();
      await db.runAsync(
        `INSERT INTO transactions
           (id, type, amount_poisha, category_id, payment_method, note, occurred_on, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transaction.id,
          transaction.type,
          transaction.amount,
          transaction.categoryId,
          transaction.paymentMethod,
          transaction.note,
          transaction.occurredOn,
          transaction.createdAt,
        ],
      );
      return transaction;
    },
  };
}
