import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon, ProgressBar } from '@/components/ui';
import { OVERALL_SCOPE, type BudgetProgress, type BudgetStatus } from '@/domain/budget';
import { formatTaka, toPoisha } from '@/domain/money';
import { CategoryBadge } from '@/features/transactions/components/CategoryBadge';
import { t, type TranslationKey } from '@/i18n';
import { colors, radius, spacing, type ColorToken } from '@/theme';

import { scopeLabel } from '../scopeLabel';

const STATUS: Record<BudgetStatus, { color: ColorToken; labelKey: TranslationKey }> = {
  ok: { color: 'primary', labelKey: 'budgets.statusOk' },
  warning: { color: 'warning', labelKey: 'budgets.statusWarning' },
  over: { color: 'danger', labelKey: 'budgets.statusOver' },
};

export interface BudgetCardProps {
  progress: BudgetProgress;
  onPress: () => void;
}

/** A budget's spending against its limit, with status colour. Tap to edit. */
export function BudgetCard({ progress, onPress }: BudgetCardProps) {
  const name = scopeLabel(progress.scope);
  const status = STATUS[progress.status];
  const statusLabel = t(status.labelKey);
  const spentOfLimit = t('budgets.spentOfLimit', {
    spent: formatTaka(progress.spent),
    limit: formatTaka(progress.limit),
  });
  const remainder =
    progress.remaining >= 0
      ? t('budgets.amountLeft', { amount: formatTaka(progress.remaining) })
      : t('budgets.amountOver', { amount: formatTaka(toPoisha(-progress.remaining)) });
  const isOverall = progress.scope === OVERALL_SCOPE;

  return (
    <Pressable
      testID={`budget-${progress.scope}`}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${statusLabel}, ${spentOfLimit}, ${remainder}`}
      accessibilityHint={t('budgets.edit')}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.header}>
        {progress.scope === OVERALL_SCOPE ? (
          <View style={styles.overallIcon}>
            <Icon name={{ ios: 'chart.pie', android: 'pie_chart' }} color="primary" />
          </View>
        ) : (
          <CategoryBadge categoryId={progress.scope} size={36} />
        )}
        <AppText variant={isOverall ? 'heading' : 'label'} style={styles.name} numberOfLines={1}>
          {name}
        </AppText>
        <AppText variant="caption" color={status.color}>
          {statusLabel}
        </AppText>
      </View>

      <AppText variant={isOverall ? 'heading' : 'body'} style={styles.amounts}>
        {spentOfLimit}
      </AppText>

      <ProgressBar
        percent={progress.percent}
        color={colors[status.color]}
        accessibilityLabel={`${name}, ${t('budgets.percentUsed', { percent: progress.percent })}`}
      />

      <View style={styles.footer}>
        <AppText
          variant="caption"
          color={progress.remaining >= 0 ? 'textSecondary' : 'danger'}
          testID={`budget-${progress.scope}-remainder`}>
          {remainder}
        </AppText>
        <AppText variant="caption" color="textSecondary">
          {t('budgets.percentUsed', { percent: progress.percent })}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  overallIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  name: {
    flex: 1,
  },
  amounts: {
    marginTop: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
