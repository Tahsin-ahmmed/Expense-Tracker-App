import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon, type IconProps } from '@/components/ui';
import type { TransactionType } from '@/domain/transaction';
import { t, type TranslationKey } from '@/i18n';
import { radius, spacing, type ColorToken, createStyles, useColors } from '@/theme';

export interface QuickActionsProps {
  onAdd: (type: TransactionType) => void;
}

const ACTIONS: {
  type: TransactionType;
  labelKey: TranslationKey;
  icon: IconProps['name'];
  color: ColorToken;
  soft: ColorToken;
}[] = [
  {
    type: 'expense',
    labelKey: 'dashboard.addExpense',
    icon: { ios: 'arrow.up.right', android: 'north_east' },
    color: 'expense',
    soft: 'expenseSoft',
  },
  {
    type: 'income',
    labelKey: 'dashboard.addIncome',
    icon: { ios: 'arrow.down.left', android: 'south_west' },
    color: 'income',
    soft: 'incomeSoft',
  },
];

/**
 * Two equal-weight action cards. Both share one style (white card) and are
 * told apart by their icon and label, so neither looks "selected".
 */
export function QuickActions({ onAdd }: QuickActionsProps) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={styles.row}>
      {ACTIONS.map((action) => (
        <Pressable
          key={action.type}
          testID={`add-${action.type}`}
          onPress={() => onAdd(action.type)}
          accessibilityRole="button"
          accessibilityLabel={t(action.labelKey)}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
          <View style={[styles.iconCircle, { backgroundColor: colors[action.soft] }]}>
            <Icon name={action.icon} size={20} color={action.color} />
          </View>
          {/* Full label always visible: shrinks slightly on very narrow screens instead of "Add expen…". */}
          <AppText
            variant="label"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            style={styles.label}>
            {t(action.labelKey)}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 56,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  iconCircle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  label: {
    flexShrink: 1,
  },
}));
