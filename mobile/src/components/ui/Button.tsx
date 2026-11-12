import { ActivityIndicator, Pressable } from 'react-native';

import { createStyles, radius, spacing, useColors, type ColorToken } from '@/theme';

import { AppText } from './AppText';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  /** primary: filled green · secondary: soft green · danger: outlined red (destructive). */
  variant?: ButtonVariant;
  disabled?: boolean;
  /** Shows a spinner and blocks presses. */
  loading?: boolean;
  testID?: string;
}

const VARIANT_TEXT: Record<ButtonVariant, ColorToken> = {
  primary: 'onPrimary',
  secondary: 'primary',
  danger: 'danger',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  testID,
}: ButtonProps) {
  const styles = useStyles();
  const colors = useColors();
  const inactive = disabled || loading;
  const textColor = colors[VARIANT_TEXT[variant]];

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles[`${variant}Pressed`],
        inactive && styles.inactive,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <AppText variant="label" style={{ color: textColor }}>
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const useStyles = createStyles((colors) => ({
  base: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primary },
  primaryPressed: { backgroundColor: colors.primaryPressed },
  secondary: { backgroundColor: colors.primarySoft },
  secondaryPressed: { opacity: 0.8 },
  danger: { borderWidth: 1, borderColor: colors.danger, backgroundColor: colors.surface },
  dangerPressed: { opacity: 0.8 },
  inactive: { opacity: 0.5 },
}));
