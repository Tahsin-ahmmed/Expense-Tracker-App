import { router } from 'expo-router';
import { useEffect } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, BrandMark } from '@/components/ui';
import type { ProfileUpdate } from '@/domain/profile';
import { WelcomeForm } from '@/features/onboarding/components/WelcomeForm';
import { useProfileStore } from '@/features/profile/useProfileStore';
import { useToday } from '@/hooks/useToday';
import { t } from '@/i18n';
import { spacing, createStyles } from '@/theme';

/**
 * First-login setup, opened as a modal over the dashboard: name, currency and
 * starting balance. It stays open until saved (swipe-down and the Android
 * back button are disabled), so every account gets a starting balance.
 */
export default function WelcomeScreen() {
  const styles = useStyles();
  const { today } = useToday();
  const update = useProfileStore((state) => state.update);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, []);

  const handleSubmit = async (changes: ProfileUpdate) => {
    await update(changes);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <BrandMark size={72} />
          <AppText variant="title" accessibilityRole="header">
            {t('welcome.title')}
          </AppText>
          <WelcomeForm today={today} onSubmit={handleSubmit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    padding: spacing.xl,
    gap: spacing.lg,
  },
}));
