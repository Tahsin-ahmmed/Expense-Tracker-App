import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui';
import type { NewTransaction } from '@/domain/transaction';
import { TransactionForm } from '@/features/transactions/components/TransactionForm';
import { useTransactionsStore } from '@/features/transactions/useTransactionsStore';
import { useToday } from '@/hooks/useToday';
import { t } from '@/i18n';
import { spacing } from '@/theme';

/** Modal screen for editing or deleting a transaction. */
export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { today } = useToday();
  const status = useTransactionsStore((state) => state.status);
  const load = useTransactionsStore((state) => state.load);
  const update = useTransactionsStore((state) => state.update);
  const remove = useTransactionsStore((state) => state.remove);
  const transaction = useTransactionsStore((state) =>
    state.transactions.find((tx) => tx.id === id),
  );

  // Set while deleting so the screen stays blank (not "not found") as it closes.
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'idle') {
      void load();
    }
  }, [status, load]);

  if (!transaction && deletingId === id) {
    return null;
  }
  if (status === 'error') {
    return <ErrorState message={t('transactions.loadError')} onRetry={() => void load()} />;
  }
  if (status !== 'ready') {
    return <LoadingState />;
  }
  if (!transaction) {
    return (
      <View style={styles.padded}>
        <EmptyState
          title={t('editTransaction.notFound.title')}
          message={t('editTransaction.notFound.message')}
        />
      </View>
    );
  }

  const handleSubmit = async (input: NewTransaction) => {
    await update(transaction.id, input);
    router.back();
  };

  const handleDelete = async () => {
    setDeletingId(transaction.id);
    try {
      await remove(transaction.id);
    } catch (error) {
      setDeletingId(null);
      throw error;
    }
    router.back();
  };

  return (
    <TransactionForm
      key={transaction.id}
      transaction={transaction}
      today={today}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
    />
  );
}

const styles = StyleSheet.create({
  padded: {
    padding: spacing.lg,
  },
});
