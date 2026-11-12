import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { AppText, Button, Card, PinField } from '@/components/ui';
import { toAuthFailure } from '@/features/auth/authService';
import { isPinFormat } from '@/features/auth/pin';
import { t } from '@/i18n';
import { spacing } from '@/theme';

export interface DeleteAccountFormProps {
  /** Re-checks the PIN, then deletes. Throws on failure. */
  onDelete: (pin: string) => Promise<void>;
}

/** Permanent account deletion, confirmed by re-entering the PIN. */
export function DeleteAccountForm({ onDelete }: DeleteAccountFormProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const submit = async () => {
    if (!isPinFormat(pin)) {
      setError(t('auth.pinFormat'));
      return;
    }
    setError(null);
    setDeleting(true);
    try {
      await onDelete(pin);
    } catch (caught) {
      const failure = toAuthFailure(caught);
      setError(failure.reason === 'unknown' ? t('deleteAccount.error') : failure.message);
      setPin('');
      setDeleting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Card style={styles.warning}>
        <AppText color="danger" variant="label">
          {t('deleteAccount.warning')}
        </AppText>
        <AppText color="textSecondary">{t('deleteAccount.exportFirst')}</AppText>
      </Card>
      <PinField
        testID="delete-pin-input"
        label={t('deleteAccount.pin')}
        value={pin}
        onChange={setPin}
        error={error ?? undefined}
      />
      <Button
        testID="confirm-delete-account"
        label={t('deleteAccount.submit')}
        onPress={() => void submit()}
        variant="danger"
        loading={deleting}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  warning: {
    gap: spacing.sm,
  },
});
