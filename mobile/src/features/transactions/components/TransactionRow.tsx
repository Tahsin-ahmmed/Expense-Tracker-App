import { Pressable, View } from 'react-native';

import { AmountText, AppText } from '@/components/ui';
import type { IsoDate } from '@/domain/date';
import { formatMoney } from '@/domain/money';
import type { Transaction } from '@/domain/transaction';
import { t } from '@/i18n';
import { formatDateLabel } from '@/i18n/format';
import { spacing, createStyles } from '@/theme';

import { CATEGORY_APPEARANCE, PAYMENT_METHOD_LABEL_KEYS } from '../categoryAppearance';
import { CategoryBadge } from './CategoryBadge';

export interface TransactionRowProps {
  transaction: Transaction;
  today: IsoDate;
  /** Hide the date, e.g. when rows are already grouped under a day heading. Default: true. */
  showDate?: boolean;
  /** Makes the row tappable (opens edit). */
  onPress?: (transaction: Transaction) => void;
}

/** One transaction: category, note or payment method, date and signed amount. */
export function TransactionRow({
  transaction,
  today,
  showDate = true,
  onPress,
}: TransactionRowProps) {
  const styles = useStyles();
  const category = t(CATEGORY_APPEARANCE[transaction.categoryId].labelKey);
  const paymentMethod = t(PAYMENT_METHOD_LABEL_KEYS[transaction.paymentMethod]);
  const date = formatDateLabel(transaction.occurredOn, today);
  const detail = transaction.note ? `${transaction.note} · ${paymentMethod}` : paymentMethod;
  const typeLabel = t(`transactionType.${transaction.type}`);
  const label = `${typeLabel}, ${category}, ${formatMoney(transaction.amount)}, ${date}, ${detail}`;

  const content = (
    <>
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
        {showDate ? (
          <AppText variant="caption" color="textSecondary">
            {date}
          </AppText>
        ) : null}
      </View>
    </>
  );

  if (!onPress) {
    return (
      <View style={styles.row} accessible accessibilityLabel={label}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      testID={`transaction-${transaction.id}`}
      onPress={() => onPress(transaction)}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={t('transactions.editHint')}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

const useStyles = createStyles((colors) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  middle: {
    flex: 1,
  },
  end: {
    alignItems: 'flex-end',
  },
}));
