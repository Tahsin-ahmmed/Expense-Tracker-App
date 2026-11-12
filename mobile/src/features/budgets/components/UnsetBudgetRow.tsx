import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import type { ExpenseCategoryId } from '@/domain/category';
import { formatMoney, type MinorAmount } from '@/domain/money';
import { CategoryBadge } from '@/features/transactions/components/CategoryBadge';
import { t } from '@/i18n';
import { spacing } from '@/theme';

import { scopeLabel } from '../scopeLabel';

export interface UnsetBudgetRowProps {
  categoryId: ExpenseCategoryId;
  spent: MinorAmount;
  onPress: () => void;
}

/** A category with no budget yet: shows this month's spending and a "Set budget" action. */
export function UnsetBudgetRow({ categoryId, spent, onPress }: UnsetBudgetRowProps) {
  const name = scopeLabel(categoryId);
  const spentText = t('budgets.spentThisMonth', { amount: formatMoney(spent) });

  return (
    <Pressable
      testID={`set-budget-${categoryId}`}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${t('budgets.notSet')}, ${spentText}`}
      accessibilityHint={t('budgets.set')}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <CategoryBadge categoryId={categoryId} size={32} />
      <View style={styles.middle}>
        <AppText variant="label" numberOfLines={1}>
          {name}
        </AppText>
        <AppText variant="caption" color="textSecondary">
          {spentText}
        </AppText>
      </View>
      <AppText variant="label" color="primary">
        {t('budgets.set')}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingVertical: spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  middle: {
    flex: 1,
  },
});
