import type { ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

import { AppText } from './AppText';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  /** Optional element before the input, e.g. a currency symbol. */
  prefix?: ReactNode;
  /** Larger text, for the main amount input. */
  large?: boolean;
}

/** Labelled text input with an inline error message. */
export function TextField({ label, error, prefix, large = false, ...inputProps }: TextFieldProps) {
  return (
    <View>
      <AppText variant="label" color="textSecondary" style={styles.label}>
        {label}
      </AppText>
      <View style={[styles.box, error ? styles.boxError : null]}>
        {prefix}
        <TextInput
          accessibilityLabel={label}
          accessibilityHint={error}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, large ? styles.inputLarge : typography.body]}
          {...inputProps}
        />
      </View>
      {error ? (
        <AppText
          variant="caption"
          color="danger"
          style={styles.error}
          accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.xs,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  boxError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm,
    color: colors.text,
  },
  inputLarge: {
    ...typography.title,
  },
  error: {
    marginTop: spacing.xs,
  },
});
