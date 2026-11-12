import { StyleSheet, Text, type TextProps } from 'react-native';

import { typography, useColors, type ColorToken, type TypographyVariant } from '@/theme';

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: ColorToken;
  align?: 'auto' | 'left' | 'center' | 'right';
}

/** Text with the app's typography and colour tokens applied. */
export function AppText({ variant = 'body', color = 'text', align, style, ...rest }: AppTextProps) {
  const colors = useColors();
  return (
    <Text
      style={[typography[variant], { color: colors[color] }, align && styles[align], style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  auto: { textAlign: 'auto' },
  left: { textAlign: 'left' },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
});
