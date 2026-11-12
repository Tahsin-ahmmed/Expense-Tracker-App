import { profileRepository } from '@/data';

import { createProfileStore } from './store';

/** App-wide profile store backed by Supabase. */
export const useProfileStore = createProfileStore(profileRepository);
