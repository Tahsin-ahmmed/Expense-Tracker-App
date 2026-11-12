import { en, type Dictionary, type TranslationKey } from './en';

export type { TranslationKey } from './en';

/**
 * Minimal translation lookup. English only for now; when Bangla is added,
 * this becomes a lookup on the active language's dictionary.
 */
const dictionary: Dictionary = en;

/**
 * Returns the string for `key`, replacing `{name}` placeholders with `params`.
 * Use whole-sentence templates (not fragments) so translations can reorder words.
 */
export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const template = dictionary[key];
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}
