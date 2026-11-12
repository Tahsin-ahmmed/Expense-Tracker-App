import { formatTaka, type Poisha } from '@/domain/money';
import type { TransactionType } from '@/domain/transaction';

import { AppText, type AppTextProps } from './AppText';

export interface AmountTextProps extends Omit<AppTextProps, 'children' | 'color'> {
  amount: Poisha;
  /** When set, shows a +/− sign and income/expense colour. */
  type?: TransactionType;
}

/** A Taka amount formatted with lakh/crore grouping. */
export function AmountText({ amount, type, variant = 'body', ...rest }: AmountTextProps) {
  const formatted = formatTaka(amount);
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
