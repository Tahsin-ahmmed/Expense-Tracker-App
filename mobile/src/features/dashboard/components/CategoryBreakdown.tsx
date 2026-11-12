import { StyleSheet, View } from 'react-native';

import { AppText, Card, ProgressBar } from '@/components/ui';
import { formatMoney } from '@/domain/money';
import { CATEGORY_APPEARANCE } from '@/features/transactions/categoryAppearance';
import { CategoryBadge } from '@/features/transactions/components/CategoryBadge';
import { t } from '@/i18n';
import { spacing } from '@/theme';

import type { CategorySpending } from '../summary';

export interface CategoryBreakdownProps {
  categories: readonly CategorySpending[];
}

/** This month's biggest expense categories with their share of spending. */
export function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  if (categories.length === 0) {
    return (
      <Card>
        <AppText color="textSecondary">{t('dashboard.spendingEmpty')}</AppText>
      </Card>
    );
  }

  return (
    <Card style={styles.list}>
      {categories.map((item) => {
        const appearance = CATEGORY_APPEARANCE[item.categoryId];
        const label = t(appearance.labelKey);
        const amount = formatMoney(item.amount);
        return (
          <View key={item.categoryId} style={styles.row}>
            <CategoryBadge categoryId={item.categoryId} size={32} />
            <View style={styles.body}>
              <View style={styles.line}>
                <AppText variant="label" numberOfLines={1} style={styles.name}>
                  {label}
                </AppText>
                <AppText variant="label">{amount}</AppText>
              </View>
              <View style={styles.line}>
                <View style={styles.bar}>
                  <ProgressBar
                    percent={item.sharePercent}
                    color={appearance.color}
                    accessibilityLabel={`${label}, ${amount}, ${item.sharePercent}%`}
                  />
                </View>
                <AppText variant="caption" color="textSecondary" style={styles.percent}>
                  {`${item.sharePercent}%`}
                </AppText>
              </View>
            </View>
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    flex: 1,
  },
  bar: {
    flex: 1,
  },
  percent: {
    minWidth: 36,
    textAlign: 'right',
  },
});
