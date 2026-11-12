import { router } from 'expo-router';

import type { Transaction, TransactionType } from '@/domain/transaction';

/** Opens the add-transaction modal with a type preselected. */
export function openAddTransaction(type: TransactionType = 'expense') {
  router.push({ pathname: '/add-transaction', params: { type } });
}

/** Opens the edit modal for a transaction. */
export function openEditTransaction(transaction: Transaction) {
  router.push({ pathname: '/edit-transaction/[id]', params: { id: transaction.id } });
}
