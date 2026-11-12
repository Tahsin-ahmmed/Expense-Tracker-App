import { create } from 'zustand';

import type { ProfileRepository } from '@/data/repositories';
import { DEFAULT_PROFILE, type Profile, type ProfileUpdate } from '@/domain/profile';
import type { LoadStatus } from '@/lib/loadStatus';

export interface ProfileState {
  profile: Profile;
  status: LoadStatus;
  load: () => Promise<void>;
  /** Saves fields and replaces the profile with the server's copy. Rejects on failure. */
  update: (update: ProfileUpdate) => Promise<void>;
  /** Clears the profile from memory (on sign-out or account switch). */
  reset: () => void;
}

export function createProfileStore(repository: ProfileRepository) {
  // See the transactions store: discards results from before a reset.
  let generation = 0;

  return create<ProfileState>()((set, get) => ({
    profile: DEFAULT_PROFILE,
    status: 'idle',

    async load() {
      if (get().status === 'loading') {
        return;
      }
      const started = generation;
      set({ status: 'loading' });
      try {
        const profile = await repository.get();
        if (started === generation) {
          set({ profile, status: 'ready' });
        }
      } catch {
        if (started === generation) {
          set({ status: 'error' });
        }
      }
    },

    async update(update) {
      const started = generation;
      const profile = await repository.update(update);
      if (started === generation) {
        set({ profile });
      }
    },

    reset() {
      generation += 1;
      set({ profile: DEFAULT_PROFILE, status: 'idle' });
    },
  }));
}
