import { z } from 'zod';

import type { Poisha } from '@/domain/money';
import { validateAmountInput } from '@/lib/amountInput';

export interface BudgetFormValues {
  amount: string;
}

/** Validates the budget limit form and converts the amount to poisha. */
export const budgetFormSchema = z
  .object({ amount: z.string() })
  .superRefine((values, ctx) => {
    const result = validateAmountInput(values.amount);
    if (!result.ok) {
      ctx.addIssue({ code: 'custom', path: ['amount'], message: result.message });
    }
  })
  .transform((values): Poisha => {
    const result = validateAmountInput(values.amount);
    if (!result.ok) {
      throw new Error('Unreachable: budget form values were not validated');
    }
    return result.amount;
  });
