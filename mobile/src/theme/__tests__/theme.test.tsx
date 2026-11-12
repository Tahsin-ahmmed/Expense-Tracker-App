import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { AppText } from '@/components/ui';

import { darkColors, lightColors } from '../colors';
import {
  createStyles,
  resolveScheme,
  setThemePreference,
  useColors,
  useThemePreference,
} from '../useTheme';

describe('resolveScheme', () => {
  it.each([
    ['system', 'dark', 'dark'],
    ['system', 'light', 'light'],
    ['system', null, 'light'],
    ['light', 'dark', 'light'],
    ['dark', 'light', 'dark'],
  ] as const)('preference %s with device %s → %s', (preference, system, expected) => {
    expect(resolveScheme(preference, system)).toBe(expected);
  });
});

describe('palettes', () => {
  it('have the same tokens in light and dark', () => {
    expect(Object.keys(darkColors).sort()).toEqual(Object.keys(lightColors).sort());
  });
});

describe('theme hooks', () => {
  afterEach(async () => {
    await act(async () => setThemePreference('system'));
  });

  const useStyles = createStyles((colors) => ({ box: { backgroundColor: colors.surface } }));

  function Probe() {
    const colors = useColors();
    const styles = useStyles();
    return <Text testID="probe">{`${colors.background}|${styles.box.backgroundColor}`}</Text>;
  }

  it('switches palette and styles when the preference changes', async () => {
    await render(<Probe />);
    expect(screen.getByTestId('probe')).toHaveTextContent(
      `${lightColors.background}|${lightColors.surface}`,
    );

    await act(async () => setThemePreference('dark'));
    expect(useThemePreference.getState().preference).toBe('dark');
    expect(screen.getByTestId('probe')).toHaveTextContent(
      `${darkColors.background}|${darkColors.surface}`,
    );
  });

  it('reuses the same StyleSheet per palette', async () => {
    let first: unknown;
    let second: unknown;
    function Capture({ onStyles }: { onStyles: (s: unknown) => void }) {
      onStyles(useStyles());
      return null;
    }
    await render(
      <>
        <Capture onStyles={(s) => (first = s)} />
        <Capture onStyles={(s) => (second = s)} />
      </>,
    );
    expect(first).toBeDefined();
    expect(second).toBe(first);
  });

  it('re-themes shared text components when switching to dark', async () => {
    await render(<AppText testID="themed-text">Hello</AppText>);
    expect(screen.getByTestId('themed-text')).toHaveStyle({ color: lightColors.text });

    await act(async () => setThemePreference('dark'));
    expect(screen.getByTestId('themed-text')).toHaveStyle({ color: darkColors.text });
  });
});
