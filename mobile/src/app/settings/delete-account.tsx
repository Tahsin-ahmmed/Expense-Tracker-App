import { Alert } from 'react-native';

import { profileRepository } from '@/data';
import { parseIdentifier } from '@/features/auth/identifier';
import { authService, useAuthStore } from '@/features/auth/instance';
import { DeleteAccountForm } from '@/features/settings/components/DeleteAccountForm';
import { t } from '@/i18n';

/** Permanently deletes the account after re-checking the PIN. */
export default function DeleteAccountScreen() {
  const user = useAuthStore((state) => state.user);

  const handleDelete = async (pin: string) => {
    const identifier = parseIdentifier(user?.email ?? user?.phone ?? '');
    if (!identifier) {
      throw new Error('No signed-in account');
    }
    // Re-authenticate so a borrowed, unlocked phone cannot delete the account.
    await authService.signIn(identifier, pin);
    await profileRepository.deleteAccount();
    // The account no longer exists; clear the local session. Protected routes
    // then show the sign-in screen.
    await authService.signOut('local').catch(() => undefined);
    Alert.alert(t('deleteAccount.done'));
  };

  return <DeleteAccountForm onDelete={handleDelete} />;
}
