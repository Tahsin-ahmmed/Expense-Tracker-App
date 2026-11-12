import { StyleSheet, View } from 'react-native';

import { AppText, Icon, type IconProps } from '@/components/ui';
import { formatTaka, type Poisha } from '@/domain/money';
import { t } from '@/i18n';
import { colors, radius, spacing } from '@/theme';

export interface BalanceCardProps {
  balance: Poisha;
  income: Poisha;
  expense: Poisha;
}

/** Highlighted card with this month's balance, income and expense. */
export function BalanceCard({ balance, income, expense }: BalanceCardProps) {
  return (
    <View style={styles.card}>
      <AppText variant="label" style={styles.muted}>
        {t('dashboard.balanceThisMonth')}
      </AppText>
      <AppText
        variant="title"
        style={styles.balance}
        testID="balance-amount"
        adjustsFontSizeToFit
        numberOfLines={1}>
        {formatTaka(balance)}
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
  );
}

interface FigureProps {
  label: string;
  amount: Poisha;
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
        {formatTaka(amount)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  muted: {
    color: colors.onPrimary,
    opacity: 0.85,
  },
  balance: {
    color: colors.onPrimary,
    fontSize: 34,
    lineHeight: 42,
    marginTop: spacing.xs,
  },
  onPrimary: {
    color: colors.onPrimary,
  },
  row: {
    flexDirection: 'row',
    marginTop: spacing.lg,
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
