import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { AppText } from './AppText';

export interface EmptyStateProps {
  title: string;
  message: string;
}

/** Shown when a list or section has no data yet. */
export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <View style={styles.container} accessible accessibilityLabel={`${title}. ${message}`}>
      <AppText variant="heading" align="center">
        {title}
      </AppText>
      <AppText color="textSecondary" align="center" style={styles.message}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  message: {
    marginTop: spacing.sm,
  },
});
