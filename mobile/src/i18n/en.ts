/**
 * English strings. Every user-facing string goes through `t()` so a Bangla
 * dictionary (`bn.ts`) can be added later with the same keys.
 */
export const en = {
  'app.name': 'HisabBondhu',

  'tabs.dashboard': 'Dashboard',
  'tabs.transactions': 'Transactions',
  'tabs.budgets': 'Budgets',
  'tabs.settings': 'Settings',

  'dashboard.empty.title': 'Your money at a glance',
  'dashboard.empty.message': 'Your balance, spending and budgets will appear here.',

  'transactions.empty.title': 'No transactions yet',
  'transactions.empty.message': 'Income and expenses you add will be listed here.',

  'budgets.empty.title': 'No budgets yet',
  'budgets.empty.message': 'Set monthly limits for your spending categories here.',

  'settings.empty.title': 'Settings',
  'settings.empty.message': 'Profile, language and app preferences will be available here.',
} as const;

export type TranslationKey = keyof typeof en;
export type Dictionary = Record<TranslationKey, string>;
