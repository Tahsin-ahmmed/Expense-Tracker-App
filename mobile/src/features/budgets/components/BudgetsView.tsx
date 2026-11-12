import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, SectionHeader } from '@/components/ui';
import { OVERALL_SCOPE, type BudgetScope, type MonthBudgets } from '@/domain/budget';
import { EXPENSE_CATEGORY_IDS } from '@/domain/category';
import { toPoisha } from '@/domain/money';
import { t } from '@/i18n';
import { colors, spacing } from '@/theme';

import { BudgetCard } from './BudgetCard';
import { UnsetBudgetRow } from './UnsetBudgetRow';

export interface BudgetsViewProps {
  budgets: MonthBudgets;
  onEdit: (scope: BudgetScope) => void;
}

/** Budgets for one month: overall limit, category limits, and categories without one. */
export function BudgetsView({ budgets, onEdit }: BudgetsViewProps) {
  const withBudget = new Set<BudgetScope>(budgets.categories.map((progress) => progress.scope));
  const withoutBudget = EXPENSE_CATEGORY_IDS.filter((id) => !withBudget.has(id));
  const categoriesExceedOverall =
    budgets.overall !== null && budgets.categoryLimitTotal > budgets.overall.limit;

  return (
    <View>
      {budgets.overall ? (
        <BudgetCard progress={budgets.overall} onPress={() => onEdit(OVERALL_SCOPE)} />
      ) : (
        <Card style={styles.setOverall}>
          <AppText variant="heading">{t('budgets.overall')}</AppText>
          <AppText color="textSecondary">{t('budgets.overallHint')}</AppText>
          <Button
            testID="set-budget-overall"
            label={t('budgets.set')}
            onPress={() => onEdit(OVERALL_SCOPE)}
          />
        </Card>
      )}

      {categoriesExceedOverall ? (
        <AppText variant="caption" color="warning" style={styles.notice} accessibilityRole="alert">
          {t('budgets.categoriesExceedOverall')}
        </AppText>
      ) : null}

      {budgets.categories.length > 0 ? (
        <>
          <SectionHeader title={t('budgets.categoryBudgets')} />
          <View style={styles.list}>
            {budgets.categories.map((progress) => (
              <BudgetCard
                key={progress.scope}
                progress={progress}
                onPress={() => onEdit(progress.scope)}
              />
            ))}
          </View>
        </>
      ) : null}

      {withoutBudget.length > 0 ? (
        <>
          <SectionHeader title={t('budgets.otherCategories')} />
          <Card style={styles.unsetCard}>
            {withoutBudget.map((categoryId, index) => (
              <View key={categoryId} style={index > 0 && styles.separated}>
                <UnsetBudgetRow
                  categoryId={categoryId}
                  spent={budgets.spent.get(categoryId) ?? toPoisha(0)}
                  onPress={() => onEdit(categoryId)}
                />
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  setOverall: {
    gap: spacing.md,
  },
  notice: {
    marginTop: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
  unsetCard: {
    paddingVertical: spacing.xs,
  },
  separated: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
