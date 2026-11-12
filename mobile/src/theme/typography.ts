import type { TextStyle } from 'react-native';

/**
 * Text styles. Uses the platform system font so Bangla script renders with
 * the device's native font later without extra font downloads.
 */
export const typography = {
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
