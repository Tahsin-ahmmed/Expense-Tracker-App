import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { t } from '@/i18n';
import { colors, spacing } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';

/** Centred spinner for a loading screen or section. */
export function LoadingState() {
  return (
    <View style={styles.center} accessibilityLabel={t('common.loading')} accessible>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

/** Error message with a retry button. */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.center}>
      <AppText align="center" color="textSecondary" accessibilityRole="alert">
        {message}
      </AppText>
      <View style={styles.action}>
        <Button label={t('common.retry')} onPress={onRetry} variant="secondary" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  action: {
    marginTop: spacing.lg,
  },
});
