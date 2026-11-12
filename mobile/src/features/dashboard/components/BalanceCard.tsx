import { StyleSheet, View } from 'react-native';

import { AppText, Icon, type IconProps } from '@/components/ui';
import type { MonthStart } from '@/domain/balance';
import type { IsoDate, MonthKey } from '@/domain/date';
import { formatMoney, toMinor, type MinorAmount } from '@/domain/money';
import { t } from '@/i18n';
import { formatDateLabel, formatMonthLabel } from '@/i18n/format';
import { colors, radius, spacing } from '@/theme';

export interface BalanceCardProps {
  /** All-time balance; null until the user sets an opening balance. */
  currentBalance: MinorAmount | null;
  month: MonthKey;
  monthStart: MonthStart | null;
  income: MinorAmount;
  expense: MinorAmount;
  today: IsoDate;
}

/**
 * Hero card: the user's current balance (or this month's net until an
 * opening balance is set), how the month started, and this month's flows.
 */
export function BalanceCard({
  currentBalance,
  month,
  monthStart,
  income,
  expense,
  today,
}: BalanceCardProps) {
  const hasBalance = currentBalance !== null;
  const headline = hasBalance ? currentBalance : toMinor(income - expense);

  let startLine: string | null = null;
  if (monthStart?.kind === 'carryOver') {
    startLine = t('dashboard.startedWith', {
      month: formatMonthLabel(month).split(' ')[0],
      amount: formatMoney(monthStart.amount),
    });
  } else if (monthStart?.kind === 'opening') {
    startLine = t('dashboard.openedWith', {
      amount: formatMoney(monthStart.amount),
      date: formatDateLabel(monthStart.date, today),
    });
  }

  return (
    <View style={styles.card}>
      <AppText variant="label" style={styles.muted}>
        {hasBalance ? t('dashboard.currentBalance') : t('dashboard.balanceThisMonth')}
      </AppText>
      <AppText
        variant="title"
        style={styles.balance}
        testID="balance-amount"
        adjustsFontSizeToFit
        numberOfLines={1}>
        {formatMoney(headline)}
      </AppText>

      {startLine ? (
        <AppText variant="caption" style={styles.muted} testID="month-start">
          {startLine}
        </AppText>
      ) : null}

      <View style={styles.monthBox}>
        <AppText variant="caption" style={styles.muted}>
          {t('dashboard.thisMonth')}
        </AppText>
        <View style={styles.row}>
          <Figure
            label={t('dashboard.income')}
            amount={income}
            icon={{ ios: 'arrow.down.left', android: 'south_west' }}
            testID="income-amount"
          />
          <View style={styles.divider} />
          <Figure
            label={t('dashboard.expense')}
            amount={expense}
            icon={{ ios: 'arrow.up.right', android: 'north_east' }}
            testID="expense-amount"
          />
        </View>
      </View>
    </View>
  );
}

interface FigureProps {
  label: string;
  amount: MinorAmount;
  icon: IconProps['name'];
  testID: string;
}

function Figure({ label, amount, icon, testID }: FigureProps) {
  return (
    <View style={styles.figure}>
      <View style={styles.figureLabel}>
        <Icon name={icon} size={14} color={colors.onPrimary} />
        <AppText variant="caption" style={styles.muted}>
          {label}
        </AppText>
      </View>
      <AppText variant="label" style={styles.onPrimary} testID={testID} numberOfLines={1}>
        {formatMoney(amount)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    gap: spacing.xs,
  },
  muted: {
    color: colors.onPrimary,
    opacity: 0.85,
  },
  balance: {
    color: colors.onPrimary,
    fontSize: 34,
    lineHeight: 42,
  },
  onPrimary: {
    color: colors.onPrimary,
  },
  monthBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryPressed,
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.onPrimary,
    opacity: 0.4,
  },
  figure: {
    flex: 1,
  },
  figureLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
});
