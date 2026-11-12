import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, BrandMark } from '@/components/ui';
import { t } from '@/i18n';
import { createStyles, spacing } from '@/theme';

export interface AuthScaffoldProps {
  title: string;
  children: ReactNode;
}

/** Shared layout for the sign-in screens: brand header, title and form. */
export function AuthScaffold({ title, children }: AuthScaffoldProps) {
  const styles = useStyles();
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <BrandMark size={96} />
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

const useStyles = createStyles((colors) => ({
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
  title: {
    marginBottom: spacing.lg,
  },
  form: {
    gap: spacing.lg,
  },
}));
