import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';

import { AppText, Button, LoadingState } from '@/components/ui';
import { toAuthFailure } from '@/features/auth/authService';
import { NewPinForm } from '@/features/auth/components/NewPinForm';
import { authService, useAuthStore } from '@/features/auth/instance';
import { t } from '@/i18n';
import { spacing } from '@/theme';

type Stage = { kind: 'checking' } | { kind: 'ready' } | { kind: 'blocked'; message: string };

function leave() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/');
  }
}

/**
 * Sets a new PIN. Opened either from Settings (already signed in) or from the
 * email reset link, which carries a one-time `code` (PKCE) that signs the user in.
 */
export default function ResetPinScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const signedIn = useAuthStore((state) => state.status === 'signedIn');
  const [stage, setStage] = useState<Stage>(code ? { kind: 'checking' } : { kind: 'ready' });
  // A reset code can be used only once; guard against effects running twice.
  const exchanged = useRef(false);

  useEffect(() => {
    if (!code || exchanged.current) {
      return;
    }
    exchanged.current = true;
    authService
      .exchangeResetCode(code)
      .then(() => setStage({ kind: 'ready' }))
      .catch((error: unknown) =>
        setStage({ kind: 'blocked', message: toAuthFailure(error).message }),
      );
  }, [code]);

  if (stage.kind === 'checking') {
    return (
      <>
        <LoadingState />
        <AppText align="center" color="textSecondary" style={styles.padded}>
          {t('auth.reset.checking')}
        </AppText>
      </>
    );
  }

  if (stage.kind === 'blocked' || !signedIn) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <AppText color={stage.kind === 'blocked' ? 'danger' : 'textSecondary'}>
          {stage.kind === 'blocked' ? stage.message : t('auth.reset.needLink')}
        </AppText>
        <Button label={t('auth.forgot.backToLogIn')} onPress={leave} variant="secondary" />
      </ScrollView>
    );
  }

  const handleSubmit = async (pin: string) => {
    await authService.updatePin(pin);
    Alert.alert(t('auth.reset.done'));
    leave();
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <NewPinForm onSubmit={handleSubmit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  padded: {
    padding: spacing.lg,
  },
});
