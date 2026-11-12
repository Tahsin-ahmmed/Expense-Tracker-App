import type { TransactionType } from './transaction';

/**
 * Built-in categories. User-defined categories arrive in a later milestone;
 * ids here are stable and will be seeded into the database in M6.
 */
export const EXPENSE_CATEGORY_IDS = [
  'food',
  'transport',
  'rent',
  'bills',
  'mobile_recharge',
  'shopping',
  'health',
  'education',
  'family',
  'entertainment',
  'other_expense',
] as const;

export const INCOME_CATEGORY_IDS = [
  'salary',
  'business',
  'freelance',
  'gift',
  'other_income',
] as const;

export type ExpenseCategoryId = (typeof EXPENSE_CATEGORY_IDS)[number];
export type IncomeCategoryId = (typeof INCOME_CATEGORY_IDS)[number];
export type CategoryId = ExpenseCategoryId | IncomeCategoryId;

export function categoriesFor(type: TransactionType): readonly CategoryId[] {
  return type === 'expense' ? EXPENSE_CATEGORY_IDS : INCOME_CATEGORY_IDS;
}

export function isCategoryId(value: unknown): value is CategoryId {
  return (
    EXPENSE_CATEGORY_IDS.includes(value as ExpenseCategoryId) ||
    INCOME_CATEGORY_IDS.includes(value as IncomeCategoryId)
  );
}

/** True if the category can be used for the given transaction type. */
export function isCategoryForType(categoryId: CategoryId, type: TransactionType): boolean {
  return categoriesFor(type).includes(categoryId);
}
