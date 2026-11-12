import { isCurrencyCode } from '@/domain/currency';
import { isIsoDate } from '@/domain/date';
import { toMinor } from '@/domain/money';
import {
  DEFAULT_PROFILE,
  isThemePreference,
  isWeekday,
  type Profile,
  type ProfileUpdate,
} from '@/domain/profile';

import type { ProfileRepository } from '../repositories';
import type { AppSupabaseClient } from './client';
import type { Database } from './database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileColumns = Database['public']['Tables']['profiles']['Update'];

const COLUMNS =
  'display_name, currency, opening_balance_minor, opening_balance_date, theme, week_starts_on';

/** Maps a row, falling back to defaults for any value the app does not recognise. */
function fromRow(row: Omit<ProfileRow, 'user_id' | 'created_at' | 'updated_at'>): Profile {
  return {
    displayName: row.display_name,
    currency: isCurrencyCode(row.currency) ? row.currency : DEFAULT_PROFILE.currency,
    openingBalance: Number.isSafeInteger(row.opening_balance_minor)
      ? toMinor(row.opening_balance_minor)
      : DEFAULT_PROFILE.openingBalance,
    openingBalanceDate:
      row.opening_balance_date && isIsoDate(row.opening_balance_date)
        ? row.opening_balance_date
        : null,
    theme: isThemePreference(row.theme) ? row.theme : DEFAULT_PROFILE.theme,
    weekStartsOn: isWeekday(row.week_starts_on) ? row.week_starts_on : DEFAULT_PROFILE.weekStartsOn,
  };
}

function toColumns(update: ProfileUpdate): ProfileColumns {
  const columns: ProfileColumns = {};
  if (update.displayName !== undefined) columns.display_name = update.displayName;
  if (update.currency !== undefined) columns.currency = update.currency;
  if (update.openingBalance !== undefined) columns.opening_balance_minor = update.openingBalance;
  if (update.openingBalanceDate !== undefined)
    columns.opening_balance_date = update.openingBalanceDate;
  if (update.theme !== undefined) columns.theme = update.theme;
  if (update.weekStartsOn !== undefined) columns.week_starts_on = update.weekStartsOn;
  return columns;
}

export function createSupabaseProfileRepository(
  getClient: () => AppSupabaseClient,
  getUserId: () => Promise<string>,
): ProfileRepository {
  return {
    async get() {
      const { data, error } = await getClient().from('profiles').select(COLUMNS).maybeSingle();
      if (error) {
        throw error;
      }
      return data ? fromRow(data) : DEFAULT_PROFILE;
    },

    async update(update) {
      // Upsert: the row is created the first time the user saves anything.
      const { data, error } = await getClient()
        .from('profiles')
        .upsert({ user_id: await getUserId(), ...toColumns(update) }, { onConflict: 'user_id' })
        .select(COLUMNS)
        .single();
      if (error) {
        throw error;
      }
      return fromRow(data);
    },

    async deleteAccount() {
      const { error } = await getClient().rpc('delete_my_account');
      if (error) {
        throw error;
      }
    },
  };
}
