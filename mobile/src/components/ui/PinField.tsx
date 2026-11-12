import { useRef, useState, type ComponentRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { t } from '@/i18n';
import { radius, spacing, createStyles } from '@/theme';

import { AppText } from './AppText';

export interface PinFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  length?: number;
  autoFocus?: boolean;
  testID?: string;
}

/**
 * Numeric PIN entry shown as boxes with dots. A transparent TextInput on top
 * receives the typing, so the system number pad and paste both work.
 */
export function PinField({
  label,
  value,
  onChange,
  onBlur,
  error,
  length = 6,
  autoFocus = false,
  testID,
}: PinFieldProps) {
  const styles = useStyles();
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [focused, setFocused] = useState(false);

  const handleChange = (text: string) => {
    onChange(text.replace(/\D/g, '').slice(0, length));
  };

  return (
    <View>
      <AppText variant="label" color="textSecondary" style={styles.label}>
        {label}
      </AppText>
      <Pressable onPress={() => inputRef.current?.focus()} accessible={false}>
        <View style={styles.boxes}>
          {Array.from({ length }, (_, index) => {
            const filled = index < value.length;
            const active = focused && index === Math.min(value.length, length - 1);
            return (
              <View
                key={index}
                style={[styles.box, active && styles.boxActive, error ? styles.boxError : null]}>
                {filled ? <View style={styles.dot} /> : null}
              </View>
            );
          })}
        </View>
        <TextInput
          ref={inputRef}
          testID={testID}
          value={value}
          onChangeText={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          keyboardType="number-pad"
          maxLength={length}
          secureTextEntry
          autoFocus={autoFocus}
          autoComplete="off"
          textContentType="none"
          caretHidden
          accessibilityLabel={label}
          accessibilityHint={t('auth.pinDigitsEntered', { count: value.length })}
          style={styles.hiddenInput}
        />
      </Pressable>
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

const useStyles = createStyles((colors) => ({
  label: {
    marginBottom: spacing.xs,
  },
  boxes: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  box: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  boxActive: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  boxError: {
    borderColor: colors.danger,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.text,
  },
  hiddenInput: {
    ...StyleSheet.absoluteFill,
    opacity: 0.01,
    color: 'transparent',
  },
  error: {
    marginTop: spacing.xs,
  },
}));
