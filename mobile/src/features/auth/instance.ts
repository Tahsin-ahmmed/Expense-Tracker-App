import { getSupabase } from '@/data/supabase/client';

import { createAuthService } from './authService';
import { createAuthStore } from './store';

/** App-wide auth service and store backed by Supabase. */
export const authService = createAuthService(getSupabase);
export const useAuthStore = createAuthStore(authService);
