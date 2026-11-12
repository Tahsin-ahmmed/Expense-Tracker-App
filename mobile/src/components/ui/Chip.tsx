import type { ReactNode } from 'react';
import { Pressable } from 'react-native';

import { radius, spacing, createStyles, useColors } from '@/theme';

import { AppText } from './AppText';

export interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Optional leading element, e.g. an icon. */
  leading?: ReactNode;
  testID?: string;
}

/** Selectable pill used for single-choice options (categories, payment methods, dates). */
export function Chip({ label, selected, onPress, leading, testID }: ChipProps) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected, checked: selected }}
      hitSlop={4}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && !selected && styles.pressed,
      ]}>
      {leading}
      <AppText variant="label" style={{ color: selected ? colors.onPrimary : colors.text }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const useStyles = createStyles((colors) => ({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pressed: {
    backgroundColor: colors.background,
  },
}));
