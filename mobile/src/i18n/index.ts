import { en, type Dictionary, type TranslationKey } from './en';

export type { TranslationKey } from './en';

/**
 * Minimal translation lookup. English only for now; when Bangla is added,
 * this becomes a lookup on the active language's dictionary.
 */
const dictionary: Dictionary = en;

export function t(key: TranslationKey): string {
  return dictionary[key];
}
