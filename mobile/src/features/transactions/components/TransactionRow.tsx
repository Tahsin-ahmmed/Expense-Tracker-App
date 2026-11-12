import { StyleSheet, View } from 'react-native';

import { AmountText, AppText } from '@/components/ui';
import type { IsoDate } from '@/domain/date';
import { formatTaka } from '@/domain/money';
import type { Transaction } from '@/domain/transaction';
import { t } from '@/i18n';
import { formatDateLabel } from '@/i18n/format';
import { spacing } from '@/theme';

import { CATEGORY_APPEARANCE, PAYMENT_METHOD_LABEL_KEYS } from '../categoryAppearance';
import { CategoryBadge } from './CategoryBadge';

export interface TransactionRowProps {
  transaction: Transaction;
  today: IsoDate;
}

/** One transaction: category, note or payment method, date and signed amount. */
export function TransactionRow({ transaction, today }: TransactionRowProps) {
  const category = t(CATEGORY_APPEARANCE[transaction.categoryId].labelKey);
  const paymentMethod = t(PAYMENT_METHOD_LABEL_KEYS[transaction.paymentMethod]);
  const date = formatDateLabel(transaction.occurredOn, today);
  const detail = transaction.note ?? paymentMethod;
  const typeLabel = t(`transactionType.${transaction.type}`);

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${typeLabel}, ${category}, ${formatTaka(transaction.amount)}, ${date}, ${detail}`}>
      <CategoryBadge categoryId={transaction.categoryId} />
      <View style={styles.middle}>
        <AppText variant="label" numberOfLines={1}>
          {category}
        </AppText>
        <AppText variant="caption" color="textSecondary" numberOfLines={1}>
          {detail}
        </AppText>
      </View>
      <View style={styles.end}>
        <AmountText amount={transaction.amount} type={transaction.type} variant="label" />
        <AppText variant="caption" color="textSecondary">
          {date}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  middle: {
    flex: 1,
  },
  end: {
    alignItems: 'flex-end',
  },
});
