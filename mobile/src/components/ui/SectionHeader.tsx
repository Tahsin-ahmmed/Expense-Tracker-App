import { StyleSheet } from 'react-native';

import { spacing } from '@/theme';

import { AppText } from './AppText';

export interface SectionHeaderProps {
  title: string;
}

/** Heading above a dashboard or form section. */
export function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <AppText variant="label" color="textSecondary" accessibilityRole="header" style={styles.title}>
      {title}
    </AppText>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
