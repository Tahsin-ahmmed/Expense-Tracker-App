import * as Linking from 'expo-linking';
import { router } from 'expo-router';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { ForgotPinForm } from '@/features/auth/components/ForgotPinForm';
import { authService } from '@/features/auth/instance';
import { t } from '@/i18n';

export default function ForgotPinScreen() {
  return (
    <AuthScaffold title={t('auth.forgot.title')}>
      <ForgotPinForm
        // hisabbondhu://reset-pin in builds; exp://…/--/reset-pin in Expo Go.
        onSubmit={(email) => authService.requestPinReset(email, Linking.createURL('reset-pin'))}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/sign-in'))}
      />
    </AuthScaffold>
  );
}
