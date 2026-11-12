import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Icon } from '@/components/ui';
import type { MonthBudgets } from '@/domain/budget';
import { BudgetCard } from '@/features/budgets/components/BudgetCard';
import { t } from '@/i18n';
import { spacing } from '@/theme';

export interface BudgetOverviewProps {
  budgets: MonthBudgets;
  /** Opens the overall budget editor. */
  onSetBudget: () => void;
  /** Opens the Budgets tab. */
  onOpenBudgets: () => void;
}

/** Dashboard summary of this month's budgets. */
export function BudgetOverview({ budgets, onSetBudget, onOpenBudgets }: BudgetOverviewProps) {
  const overCount = budgets.categories.filter((progress) => progress.status === 'over').length;
  const overText =
    overCount === 0
      ? null
      : overCount === 1
        ? t('dashboard.categoryOver')
        : t('dashboard.categoriesOver', { count: overCount });

  if (!budgets.overall && budgets.categories.length === 0) {
    return (
      <Card style={styles.gap}>
        <View style={styles.row}>
          <Icon name={{ ios: 'chart.pie', android: 'pie_chart' }} color="textSecondary" />
          <AppText color="textSecondary" style={styles.flex}>
            {t('dashboard.budgetEmpty')}
          </AppText>
        </View>
        <Button
          testID="dashboard-set-budget"
          label={t('dashboard.setBudget')}
          onPress={onSetBudget}
          variant="secondary"
        />
      </Card>
    );
  }

  return (
    <View style={styles.gap}>
      {budgets.overall ? <BudgetCard progress={budgets.overall} onPress={onOpenBudgets} /> : null}
      {overText || !budgets.overall ? (
        <Card style={styles.gap}>
          {overText ? (
            <AppText color="danger" testID="categories-over">
              {overText}
            </AppText>
          ) : null}
          <Button
            testID="dashboard-view-budgets"
            label={t('dashboard.viewBudgets')}
            onPress={onOpenBudgets}
            variant="secondary"
          />
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  gap: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
});
