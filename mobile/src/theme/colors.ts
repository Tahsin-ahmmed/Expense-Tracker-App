/**
 * Colour tokens for HisabBondhu, one palette per colour scheme.
 *
 * Components get the active palette from `useColors()` or `createStyles()`
 * (see ./useTheme.ts) and must never use raw hex values. Both palettes have
 * the same keys.
 *
 * Chart colours (income, expense, primary) were validated per mode for
 * colour-blind separation, lightness band and contrast against `surface`.
 */
export interface Palette {
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  /** Text/icons on a `primary` background. */
  onPrimary: string;

  background: string;
  surface: string;
  border: string;

  text: string;
  textSecondary: string;
  textMuted: string;

  income: string;
  incomeSoft: string;
  expense: string;
  expenseSoft: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  warningSoft: string;

  /** Shadow tint for floating elements (tooltips). */
  shadow: string;
}

export const lightColors: Palette = {
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
  incomeSoft: '#E7F5EF',
  expense: '#C2410C',
  expenseSoft: '#FDEEE6',
  danger: '#B42318',
  dangerSoft: '#FDECEC',
  warning: '#B54708',
  warningSoft: '#FEF3E2',

  shadow: '#000000',
};

export const darkColors: Palette = {
  // White text fails contrast on a mid green, so dark mode uses dark text on primary.
  primary: '#2BA176',
  primaryPressed: '#238A64',
  primarySoft: '#173229',
  onPrimary: '#04130E',

  background: '#0E1412',
  surface: '#18201D',
  border: '#2A3430',

  text: '#EEF2F0',
  textSecondary: '#A7B2AE',
  textMuted: '#7E8985',

  income: '#30A87C',
  incomeSoft: '#143026',
  expense: '#DB7030',
  expenseSoft: '#3A2417',
  danger: '#EF6A63',
  dangerSoft: '#3A1B1A',
  warning: '#E5A03A',
  warningSoft: '#3A2C15',

  shadow: '#000000',
};

export type ColorToken = keyof Palette;
