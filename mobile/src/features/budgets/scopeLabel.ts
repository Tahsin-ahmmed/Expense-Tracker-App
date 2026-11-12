import { OVERALL_SCOPE, type BudgetScope } from '@/domain/budget';
import { CATEGORY_APPEARANCE } from '@/features/transactions/categoryAppearance';
import { t } from '@/i18n';

/** Display name of a budget: "Monthly budget" or the category name. */
export function scopeLabel(scope: BudgetScope): string {
  return scope === OVERALL_SCOPE ? t('budgets.overall') : t(CATEGORY_APPEARANCE[scope].labelKey);
}
