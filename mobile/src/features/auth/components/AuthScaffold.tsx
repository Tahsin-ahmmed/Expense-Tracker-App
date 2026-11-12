import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Icon } from '@/components/ui';
import { t } from '@/i18n';
import { colors, radius, spacing } from '@/theme';

export interface AuthScaffoldProps {
  title: string;
  children: ReactNode;
}

/** Shared layout for the sign-in screens: brand header, title and form. */
export function AuthScaffold({ title, children }: AuthScaffoldProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Icon
                name={{ ios: 'banknote', android: 'account_balance_wallet' }}
                size={32}
                color={colors.onPrimary}
              />
            </View>
            <AppText variant="title">{t('app.name')}</AppText>
            <AppText color="textSecondary">{t('auth.tagline')}</AppText>
          </View>
          <AppText variant="heading" accessibilityRole="header" style={styles.title}>
            {title}
          </AppText>
          <View style={styles.form}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Error banner for failures that are not tied to one field. */
export function FormError({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }
  return (
    <AppText color="danger" align="center" accessibilityRole="alert" testID="form-error">
      {message}
    </AppText>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  brand: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xxl,
  },
  logo: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    marginBottom: spacing.sm,
  },
  title: {
    marginBottom: spacing.lg,
  },
  form: {
    gap: spacing.lg,
  },
});
