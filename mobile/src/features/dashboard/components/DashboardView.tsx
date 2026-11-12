import { StyleSheet, View } from 'react-native';

import { Button, SectionHeader } from '@/components/ui';
import type { IsoDate } from '@/domain/date';
import type { Transaction, TransactionType } from '@/domain/transaction';
import { t } from '@/i18n';
import { spacing } from '@/theme';

import type { DashboardSummary } from '../summary';
import { BalanceCard } from './BalanceCard';
import { BudgetOverview } from './BudgetOverview';
import { CategoryBreakdown } from './CategoryBreakdown';
import { RecentTransactions } from './RecentTransactions';

export interface DashboardViewProps {
  summary: DashboardSummary;
  today: IsoDate;
  onAdd: (type: TransactionType) => void;
  onPressTransaction?: (transaction: Transaction) => void;
}

/** The dashboard's sections, rendered from a prepared summary (no data access). */
export function DashboardView({ summary, today, onAdd, onPressTransaction }: DashboardViewProps) {
  return (
    <View>
      <BalanceCard balance={summary.balance} income={summary.income} expense={summary.expense} />

      <View style={styles.actions}>
        <View style={styles.action}>
          <Button
            label={t('dashboard.addExpense')}
            onPress={() => onAdd('expense')}
            testID="add-expense"
          />
        </View>
        <View style={styles.action}>
          <Button
            label={t('dashboard.addIncome')}
            onPress={() => onAdd('income')}
            variant="secondary"
            testID="add-income"
          />
        </View>
      </View>

      <SectionHeader title={t('dashboard.spendingByCategory')} />
      <CategoryBreakdown categories={summary.topCategories} />

      <SectionHeader title={t('dashboard.budget')} />
      <BudgetOverview />

      <SectionHeader title={t('dashboard.recentTransactions')} />
      <RecentTransactions
        transactions={summary.recent}
        today={today}
        onPressTransaction={onPressTransaction}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  action: {
    flex: 1,
  },
});
