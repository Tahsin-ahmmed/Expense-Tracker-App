import { router } from 'expo-router';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { SignUpForm } from '@/features/auth/components/SignUpForm';
import { authService } from '@/features/auth/instance';
import { t } from '@/i18n';

export default function SignUpScreen() {
  return (
    <AuthScaffold title={t('auth.signUp.title')}>
      <SignUpForm
        onSubmit={({ identifier, pin }) => authService.signUp(identifier, pin)}
        onLogIn={() => router.replace('/sign-in')}
      />
    </AuthScaffold>
  );
}
