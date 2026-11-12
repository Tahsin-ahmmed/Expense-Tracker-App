import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon } from '@/components/ui';
import type { MonthKey } from '@/domain/date';
import { t } from '@/i18n';
import { formatMonthLabel } from '@/i18n/format';
import { radius, createStyles } from '@/theme';

export interface MonthSwitcherProps {
  month: MonthKey;
  onPrevious: () => void;
  onNext: () => void;
  /** False when already on the current month (no future months). */
  canGoNext: boolean;
}

/** "‹ November 2026 ›" control for moving between months. */
export function MonthSwitcher({ month, onPrevious, onNext, canGoNext }: MonthSwitcherProps) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <ArrowButton
        label={t('transactions.previousMonth')}
        icon={{ ios: 'chevron.left', android: 'chevron_left' }}
        onPress={onPrevious}
        testID="previous-month"
      />
      <AppText variant="heading" testID="month-label" accessibilityRole="header">
        {formatMonthLabel(month)}
      </AppText>
      <ArrowButton
        label={t('transactions.nextMonth')}
        icon={{ ios: 'chevron.right', android: 'chevron_right' }}
        onPress={onNext}
        disabled={!canGoNext}
        testID="next-month"
      />
    </View>
  );
}

interface ArrowButtonProps {
  label: string;
  icon: { ios: 'chevron.left' | 'chevron.right'; android: 'chevron_left' | 'chevron_right' };
  onPress: () => void;
  disabled?: boolean;
  testID: string;
}

function ArrowButton({ label, icon, onPress, disabled = false, testID }: ArrowButtonProps) {
  const styles = useStyles();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      hitSlop={8}
      style={({ pressed }) => [
        styles.arrow,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      <Icon name={icon} size={22} color="text" />
    </Pressable>
  );
}

const useStyles = createStyles((colors) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  arrow: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  disabled: {
    opacity: 0.35,
  },
}));
