import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

import { AppText } from './AppText';

export interface ScreenProps {
  /** Large page title shown at the top of the screen. */
  title: string;
  /** Small text above the title, e.g. a greeting. */
  eyebrow?: string;
  children: ReactNode;
  /** Wrap content in a ScrollView. Default: true. */
  scrollable?: boolean;
}

/** Standard page container: safe area, background colour, title and padding. */
export function Screen({ title, eyebrow, children, scrollable = true }: ScreenProps) {
  const header = (
    <View style={styles.header}>
      {eyebrow ? (
        <AppText variant="label" color="textSecondary">
          {eyebrow}
        </AppText>
      ) : null}
      <AppText variant="title" accessibilityRole="header">
        {title}
      </AppText>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {scrollable ? (
        <ScrollView contentContainerStyle={styles.content}>
          {header}
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.fill]}>
          {header}
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  fill: {
    flex: 1,
  },
  header: {
    marginBottom: spacing.xl,
  },
});
