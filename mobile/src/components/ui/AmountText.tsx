import { formatMoney, type MinorAmount } from '@/domain/money';
import type { TransactionType } from '@/domain/transaction';

import { AppText, type AppTextProps } from './AppText';

export interface AmountTextProps extends Omit<AppTextProps, 'children' | 'color'> {
  amount: MinorAmount;
  /** When set, shows a +/− sign and income/expense colour. */
  type?: TransactionType;
}

/** An amount in the active currency (lakh/crore grouping where that currency uses it). */
export function AmountText({ amount, type, variant = 'body', ...rest }: AmountTextProps) {
  const formatted = formatMoney(amount);
  if (!type) {
    return (
      <AppText variant={variant} {...rest}>
        {formatted}
      </AppText>
    );
  }
  const isIncome = type === 'income';
  return (
    <AppText variant={variant} color={isIncome ? 'income' : 'expense'} {...rest}>
      {`${isIncome ? '+' : '−'}${formatted}`}
    </AppText>
  );
}
