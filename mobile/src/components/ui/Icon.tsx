import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';

import { colors, type ColorToken } from '@/theme';

export interface IconProps {
  name: { ios: SFSymbol; android: AndroidSymbol };
  size?: number;
  /** A theme token, or a raw colour for data-driven accents (e.g. category colours). */
  color?: ColorToken | (string & {});
}

/** Platform icon: SF Symbols on iOS, Material Symbols on Android. Decorative only. */
export function Icon({ name, size = 20, color = 'text' }: IconProps) {
  const tint = color in colors ? colors[color as ColorToken] : color;
  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={tint}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
