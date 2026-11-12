import { StyleSheet, View } from 'react-native';

import { AppText, Card, Icon } from '@/components/ui';
import { t } from '@/i18n';
import { spacing } from '@/theme';

/**
 * Monthly budget summary. Budgets are implemented in M5; until then this
 * section explains what will appear here.
 */
export function BudgetOverview() {
  return (
    <Card>
      <View style={styles.row}>
        <Icon name={{ ios: 'chart.pie', android: 'pie_chart' }} color="textSecondary" />
        <AppText color="textSecondary" style={styles.text}>
          {t('dashboard.budgetEmpty')}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  text: {
    flex: 1,
  },
});
