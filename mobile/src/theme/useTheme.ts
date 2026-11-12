import { StyleSheet, useColorScheme } from 'react-native';
import { create } from 'zustand';

import type { ThemePreference } from '@/domain/profile';

import { darkColors, lightColors, type Palette } from './colors';

export type ColorScheme = 'light' | 'dark';

/**
 * The user's theme choice. Set from their profile at app level (signed-out
 * screens follow the system).
 */
export const useThemePreference = create<{ preference: ThemePreference }>()(() => ({
  preference: 'system',
}));

export function setThemePreference(preference: ThemePreference): void {
  if (useThemePreference.getState().preference !== preference) {
    useThemePreference.setState({ preference });
  }
}

/** Light or dark, after applying the user's choice to the device setting. */
export function resolveScheme(
  preference: ThemePreference,
  system: string | null | undefined,
): ColorScheme {
  if (preference === 'system') {
    return system === 'dark' ? 'dark' : 'light';
  }
  return preference;
}

export function useColorSchemeResolved(): ColorScheme {
  const preference = useThemePreference((state) => state.preference);
  const system = useColorScheme();
  return resolveScheme(preference, system);
}

/** The active colour palette. Re-renders when the theme or device setting changes. */
export function useColors(): Palette {
  return useColorSchemeResolved() === 'dark' ? darkColors : lightColors;
}

/** The style-object shape StyleSheet.create accepts (same constraint as its generic). */
type NamedStyles = Parameters<typeof StyleSheet.create>[0];

/**
 * Defines a component's styles from the active palette. Returns a hook; each
 * palette's StyleSheet is built once and reused.
 *
 *   const useStyles = createStyles((colors) => ({ card: { backgroundColor: colors.surface } }));
 *   function Card() { const styles = useStyles(); ... }
 */

export function createStyles<S extends NamedStyles>(
  factory: (colors: Palette) => S & NamedStyles,
): () => Readonly<S> {
  const cache = new Map<Palette, Readonly<S>>();
  return function useStyles(): Readonly<S> {
    const colors = useColors();
    let styles = cache.get(colors);
    if (!styles) {
      styles = StyleSheet.create(factory(colors));
      cache.set(colors, styles);
    }
    return styles;
  };
}
