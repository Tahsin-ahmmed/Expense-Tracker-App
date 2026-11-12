import { StyleSheet, View } from 'react-native';

import { Card, EmptyState } from '@/components/ui';
import type { IsoDate } from '@/domain/date';
import type { Transaction } from '@/domain/transaction';
import { TransactionRow } from '@/features/transactions/components/TransactionRow';
import { t } from '@/i18n';
import { spacing, createStyles } from '@/theme';

export interface RecentTransactionsProps {
  transactions: readonly Transaction[];
  today: IsoDate;
  onPressTransaction?: (transaction: Transaction) => void;
}

export function RecentTransactions({
  transactions,
  today,
  onPressTransaction,
}: RecentTransactionsProps) {
  const styles = useStyles();
  if (transactions.length === 0) {
    return (
      <EmptyState
        title={t('dashboard.recentEmpty.title')}
        message={t('dashboard.recentEmpty.message')}
      />
    );
  }

  return (
    <Card style={styles.card}>
      {transactions.map((transaction, index) => (
        <View key={transaction.id} style={index > 0 && styles.separated}>
          <TransactionRow transaction={transaction} today={today} onPress={onPressTransaction} />
        </View>
      ))}
    </Card>
  );
}

const useStyles = createStyles((colors) => ({
  card: {
    paddingVertical: spacing.sm,
  },
  separated: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
}));
