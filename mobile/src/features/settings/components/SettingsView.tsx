import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, SectionHeader } from '@/components/ui';
import { formatPhoneForDisplay } from '@/features/auth/identifier';
import type { AuthUser } from '@/features/auth/store';
import { t } from '@/i18n';
import { spacing } from '@/theme';

export interface SettingsViewProps {
  user: AuthUser;
  onChangePin: () => void;
  /** Throws on failure. */
  onLogOut: () => Promise<void>;
}

/** Account details and account actions. */
export function SettingsView({ user, onChangePin, onLogOut }: SettingsViewProps) {
  const [failed, setFailed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const identity = user.email ?? (user.phone ? formatPhoneForDisplay(user.phone) : '');

  const confirmLogOut = () => {
    Alert.alert(t('settings.logOutConfirmTitle'), t('settings.logOutConfirmMessage'), [
      { text: t('editTransaction.deleteCancel'), style: 'cancel' },
      {
        text: t('settings.logOut'),
        style: 'destructive',
        onPress: async () => {
          setFailed(false);
          setLoggingOut(true);
          try {
            await onLogOut();
          } catch {
            setFailed(true);
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  return (
    <View>
      <SectionHeader title={t('settings.account')} />
      <Card style={styles.card}>
        <View>
          <AppText variant="caption" color="textSecondary">
            {t('settings.signedInAs')}
          </AppText>
          <AppText variant="label" testID="signed-in-as">
            {identity}
          </AppText>
        </View>
        <Button
          testID="change-pin"
          label={t('settings.changePin')}
          onPress={onChangePin}
          variant="secondary"
        />
        <Button
          testID="log-out"
          label={t('settings.logOut')}
          onPress={confirmLogOut}
          variant="danger"
          loading={loggingOut}
        />
        {failed ? (
          <AppText color="danger" align="center" accessibilityRole="alert">
            {t('settings.logOutError')}
          </AppText>
        ) : null}
      </Card>

      <AppText variant="caption" color="textSecondary" style={styles.note}>
        {t('settings.moreSoon')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  note: {
    marginTop: spacing.lg,
  },
});
