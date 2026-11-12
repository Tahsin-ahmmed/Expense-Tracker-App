import { Pressable, StyleSheet } from 'react-native';

import { colors, radius } from '@/theme';

import { Icon, type IconProps } from './Icon';

export interface IconButtonProps {
  icon: IconProps['name'];
  /** Spoken by screen readers; required because there is no visible text. */
  accessibilityLabel: string;
  onPress: () => void;
  testID?: string;
}

/** Round filled button with only an icon, e.g. "+" to add. */
export function IconButton({ icon, accessibilityLabel, onPress, testID }: IconButtonProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={4}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Icon name={icon} size={24} color={colors.onPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  pressed: {
    backgroundColor: colors.primaryPressed,
  },
});
