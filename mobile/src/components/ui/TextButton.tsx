import { Pressable, StyleSheet } from 'react-native';

import { spacing } from '@/theme';

import { AppText } from './AppText';

export interface TextButtonProps {
  label: string;
  onPress: () => void;
  testID?: string;
}

/** Low-emphasis link-style button, e.g. "Forgot PIN?". */
export function TextButton({ label, onPress, testID }: TextButtonProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <AppText variant="label" color="primary" align="center">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  pressed: {
    opacity: 0.6,
  },
});
