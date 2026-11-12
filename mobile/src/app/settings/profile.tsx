import { router } from 'expo-router';

import { ErrorState, LoadingState } from '@/components/ui';
import type { ProfileUpdate } from '@/domain/profile';
import { ProfileForm } from '@/features/profile/components/ProfileForm';
import { useProfileStore } from '@/features/profile/useProfileStore';
import { useAppData } from '@/hooks/useAppData';
import { useToday } from '@/hooks/useToday';
import { t } from '@/i18n';

/** Name, currency, opening balance and week start. */
export default function ProfileScreen() {
  const { today } = useToday();
  const { status, retry } = useAppData();
  const profile = useProfileStore((state) => state.profile);
  const update = useProfileStore((state) => state.update);

  if (status === 'error') {
    return <ErrorState message={t('profile.saveError')} onRetry={retry} />;
  }
  if (status !== 'ready') {
    return <LoadingState />;
  }

  const handleSave = async (changes: ProfileUpdate) => {
    await update(changes);
    router.back();
  };

  return <ProfileForm profile={profile} today={today} onSave={handleSave} />;
}
