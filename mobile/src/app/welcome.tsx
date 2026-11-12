import type { ProfileUpdate } from '@/domain/profile';
import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { WelcomeForm } from '@/features/onboarding/components/WelcomeForm';
import { useProfileStore } from '@/features/profile/useProfileStore';
import { useToday } from '@/hooks/useToday';
import { t } from '@/i18n';

/**
 * First-run setup, shown once after sign-up (or to any account without a
 * starting balance). Saving the profile unlocks the app via the root layout.
 */
export default function WelcomeScreen() {
  const { today } = useToday();
  const update = useProfileStore((state) => state.update);

  return (
    <AuthScaffold title={t('welcome.title')}>
      <WelcomeForm today={today} onSubmit={(changes: ProfileUpdate) => update(changes)} />
    </AuthScaffold>
  );
}
