import { Fragment, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDisplayCurrency } from '@/lib/displayCurrency';
import { spacing, createStyles, useColorSchemeResolved } from '@/theme';

import { AppText } from './AppText';

export interface ScreenProps {
  /** Large page title shown at the top of the screen. */
  title: string;
  /** Small text above the title, e.g. a greeting. */
  eyebrow?: string;
  /** Element shown to the left of the title, e.g. the app logo. */
  leading?: ReactNode;
  /** Element shown to the right of the title, e.g. an add button. */
  action?: ReactNode;
  children: ReactNode;
  /**
   * Wrap content in a ScrollView. Default: true. Set false when the content
   * is its own list (FlatList/SectionList) so lists are not nested.
   */
  scrollable?: boolean;
}

/** Standard page container: safe area, background colour, title and padding. */
export function Screen({
  title,
  eyebrow,
  leading,
  action,
  children,
  scrollable = true,
}: ScreenProps) {
  const styles = useStyles();
  // Remount the content when the display currency changes so every amount updates.
  const currency = useDisplayCurrency((state) => state.currency);
  // Rebuild the content when the theme changes too: guarantees every native view
  // repaints with the new palette (some kept a stale background otherwise).
  const scheme = useColorSchemeResolved();
  const content = <Fragment key={`${currency}-${scheme}`}>{children}</Fragment>;

  const header = (
    <View style={styles.header}>
      {leading}
      <View style={styles.titles}>
        {eyebrow ? (
          <AppText variant="label" color="textSecondary">
            {eyebrow}
          </AppText>
        ) : null}
        <AppText variant="title" accessibilityRole="header">
          {title}
        </AppText>
      </View>
      {action}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {scrollable ? (
        <ScrollView contentContainerStyle={styles.content}>
          {header}
          {content}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.fill]}>
          {header}
          {content}
        </View>
      )}
    </SafeAreaView>
  );
}

const useStyles = createStyles((colors) => ({
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
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  titles: {
    flex: 1,
  },
}));
