import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Icon, type IconProps } from '@/components/ui';
import type { BudgetStatus, MonthBudgets } from '@/domain/budget';
import { daysInMonth, monthOf, parseIsoDate, type IsoDate } from '@/domain/date';
import { formatMoney, toMinor } from '@/domain/money';
import { t, type TranslationKey } from '@/i18n';
import { colors, radius, spacing, type ColorToken } from '@/theme';

export interface BudgetOverviewProps {
  budgets: MonthBudgets;
  today: IsoDate;
  /** Opens the overall budget editor. */
  onSetBudget: () => void;
  /** Opens the Budgets tab. */
  onOpenBudgets: () => void;
}

const STATUS: Record<
  BudgetStatus,
  { color: ColorToken; soft: string; labelKey: TranslationKey; icon: IconProps['name'] }
> = {
  ok: {
    color: 'primary',
    soft: colors.primarySoft,
    labelKey: 'budgets.statusOk',
    icon: { ios: 'checkmark.circle', android: 'check_circle' },
  },
  warning: {
    color: 'warning',
    soft: colors.warningSoft,
    labelKey: 'budgets.statusWarning',
    icon: { ios: 'exclamationmark.triangle', android: 'warning' },
  },
  over: {
    color: 'danger',
    soft: colors.dangerSoft,
    labelKey: 'budgets.statusOver',
    icon: { ios: 'xmark.octagon', android: 'error' },
  },
};

/** Days left in the month including today, when `today` is in the budget's month. */
function daysLeft(budgets: MonthBudgets, today: IsoDate): number | null {
  if (monthOf(today) !== budgets.month) {
    return null;
  }
  return daysInMonth(budgets.month) - parseIsoDate(today).day + 1;
}

/**
 * Compact dashboard budget card: what is left, how much was spent, status,
 * and a safe amount to spend per day for the rest of the month.
 */
export function BudgetOverview({
  budgets,
  today,
  onSetBudget,
  onOpenBudgets,
}: BudgetOverviewProps) {
  const overCount = budgets.categories.filter((progress) => progress.status === 'over').length;
  const overText =
    overCount === 0
      ? null
      : overCount === 1
        ? t('dashboard.categoryOver')
        : t('dashboard.categoriesOver', { count: overCount });

  if (!budgets.overall) {
    return (
      <Card style={styles.gap}>
        <View style={styles.row}>
          <Icon name={{ ios: 'chart.pie', android: 'pie_chart' }} color="textSecondary" />
          <AppText color="textSecondary" style={styles.flex}>
            {t('dashboard.budgetEmpty')}
          </AppText>
        </View>
        {overText ? (
          <AppText color="danger" testID="categories-over">
            {overText}
          </AppText>
        ) : null}
        <Button
          testID={budgets.categories.length > 0 ? 'dashboard-view-budgets' : 'dashboard-set-budget'}
          label={
            budgets.categories.length > 0 ? t('dashboard.viewBudgets') : t('dashboard.setBudget')
          }
          onPress={budgets.categories.length > 0 ? onOpenBudgets : onSetBudget}
          variant="secondary"
        />
      </Card>
    );
  }

  const progress = budgets.overall;
  const status = STATUS[progress.status];
  const isOver = progress.remaining < 0;
  const remainingDays = daysLeft(budgets, today);
  const safeDaily =
    !isOver && remainingDays && remainingDays > 0
      ? toMinor(Math.floor(progress.remaining / remainingDays))
      : null;
  const headline = isOver
    ? t('dashboard.budgetOver', { amount: formatMoney(toMinor(-progress.remaining)) })
    : t('dashboard.budgetLeft', { amount: formatMoney(progress.remaining) });
  const spentOf = t('dashboard.budgetSpentOf', {
    spent: formatMoney(progress.spent, { decimals: 'auto' }),
    limit: formatMoney(progress.limit, { decimals: 'auto' }),
  });

  return (
    <Pressable
      testID="dashboard-budget"
      onPress={onOpenBudgets}
      accessibilityRole="button"
      accessibilityLabel={`${t('dashboard.budget')}, ${t(status.labelKey)}, ${headline}, ${spentOf}`}
      accessibilityHint={t('dashboard.viewBudgets')}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.row}>
        <View style={[styles.pill, { backgroundColor: status.soft }]}>
          <Icon name={status.icon} size={14} color={status.color} />
          <AppText variant="caption" color={status.color}>
            {t(status.labelKey)}
          </AppText>
        </View>
        <View style={styles.flex} />
        <AppText variant="caption" color="textSecondary">
          {`${progress.percent}%`}
        </AppText>
      </View>

      <AppText
        variant="heading"
        color={isOver ? 'danger' : 'text'}
        testID="budget-overall-remainder">
        {headline}
      </AppText>

      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${Math.min(100, Math.max(progress.percent, 1))}%`,
              backgroundColor: colors[status.color],
            },
          ]}
        />
      </View>

      <AppText variant="caption" color="textSecondary" testID="budget-spent-of">
        {spentOf}
      </AppText>

      {safeDaily !== null && remainingDays !== null ? (
        <View style={styles.tip}>
          <Icon name={{ ios: 'lightbulb', android: 'lightbulb' }} size={16} color="primary" />
          <AppText variant="caption" style={styles.flex} testID="safe-daily">
            {remainingDays === 1
              ? t('dashboard.safeDailyLastDay', { amount: formatMoney(safeDaily) })
              : t('dashboard.safeDaily', {
                  amount: formatMoney(safeDaily),
                  days: remainingDays,
                })}
          </AppText>
        </View>
      ) : null}

      {overText ? (
        <AppText variant="caption" color="danger" testID="categories-over">
          {overText}
        </AppText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gap: {
    gap: spacing.md,
  },
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  track: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
  },
});
