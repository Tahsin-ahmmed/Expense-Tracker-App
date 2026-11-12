import { isCategoryId } from '@/domain/category';
import { isIsoDate } from '@/domain/date';
import { toPoisha } from '@/domain/money';
import {
  isPaymentMethod,
  isTransactionType,
  type NewTransaction,
  type Transaction,
} from '@/domain/transaction';

import { NotFoundError, type TransactionRepository } from '../repositories';
import type { AppSupabaseClient } from './client';
import type { Database } from './database.types';

type TransactionRow = Database['public']['Tables']['transactions']['Row'];

const COLUMNS =
  'id, type, amount_poisha, category_id, payment_method, note, occurred_on, created_at';

/** Converts a database row, rejecting rows that do not match the domain rules. */
function fromRow(
  row: Pick<
    TransactionRow,
    | 'id'
    | 'type'
    | 'amount_poisha'
    | 'category_id'
    | 'payment_method'
    | 'note'
    | 'occurred_on'
    | 'created_at'
  >,
): Transaction | null {
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

function toColumns(input: NewTransaction) {
  return {
    type: input.type,
    amount_poisha: input.amount,
    category_id: input.categoryId,
    payment_method: input.paymentMethod,
    note: input.note,
    occurred_on: input.occurredOn,
  };
}

/**
 * Transactions stored in Supabase. Row Level Security limits every query to
 * the signed-in user's rows, and `user_id` defaults to `auth.uid()`.
 */
export function createSupabaseTransactionRepository(
  getClient: () => AppSupabaseClient,
): TransactionRepository {
  return {
    async listAll() {
      const { data, error } = await getClient()
        .from('transactions')
        .select(COLUMNS)
        .order('occurred_on', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) {
        throw error;
      }
      return data.map(fromRow).filter((row): row is Transaction => row !== null);
    },

    async create(input) {
      const { data, error } = await getClient()
        .from('transactions')
        .insert(toColumns(input))
        .select(COLUMNS)
        .single();
      if (error) {
        throw error;
      }
      const saved = fromRow(data);
      if (!saved) {
        throw new Error('Saved transaction did not match the expected format');
      }
      return saved;
    },

    async update(id, input) {
      const { data, error } = await getClient()
        .from('transactions')
        .update(toColumns(input))
        .eq('id', id)
        .select('id');
      if (error) {
        throw error;
      }
      if (data.length === 0) {
        throw new NotFoundError(id);
      }
    },

    async remove(id) {
      const { data, error } = await getClient()
        .from('transactions')
        .delete()
        .eq('id', id)
        .select('id');
      if (error) {
        throw error;
      }
      if (data.length === 0) {
        throw new NotFoundError(id);
      }
    },
  };
}
