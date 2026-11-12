import { router } from 'expo-router';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { SignInForm } from '@/features/auth/components/SignInForm';
import { authService } from '@/features/auth/instance';
import { t } from '@/i18n';

export default function SignInScreen() {
  return (
    <AuthScaffold title={t('auth.logIn.title')}>
      <SignInForm
        onSubmit={({ identifier, pin }) => authService.signIn(identifier, pin)}
        onCreateAccount={() => router.replace('/sign-up')}
        onForgotPin={() => router.push('/forgot-pin')}
      />
    </AuthScaffold>
  );
}
