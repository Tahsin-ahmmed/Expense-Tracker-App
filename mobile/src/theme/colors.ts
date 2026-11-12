/**
 * Colour tokens for HisabBondhu (light theme only for now).
 *
 * Components must use these tokens, never raw hex values, so a dark theme
 * can be added later by supplying a second palette with the same keys.
 */
export const colors = {
  primary: '#0F7B5F',
  primaryPressed: '#0B5F49',
  primarySoft: '#E7F5EF',
  onPrimary: '#FFFFFF',

  background: '#F6F8F7',
  surface: '#FFFFFF',
  border: '#E3E8E6',

  text: '#111827',
  textSecondary: '#5B6670',
  textMuted: '#8A949C',

  income: '#12805C',
  expense: '#C2410C',
  danger: '#B42318',
  dangerSoft: '#FDECEC',
  warning: '#B54708',
  warningSoft: '#FEF3E2',
} as const;

export type ColorToken = keyof typeof colors;
