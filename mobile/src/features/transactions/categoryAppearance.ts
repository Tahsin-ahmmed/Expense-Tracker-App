import type { AndroidSymbol, SFSymbol } from 'expo-symbols';

import type { CategoryId } from '@/domain/category';
import type { PaymentMethod } from '@/domain/transaction';
import type { TranslationKey } from '@/i18n';

export interface CategoryAppearance {
  labelKey: TranslationKey;
  icon: { ios: SFSymbol; android: AndroidSymbol };
  /** Accent colour for the icon badge and category bars. */
  color: string;
}

/** How each built-in category is shown in the UI. */
export const CATEGORY_APPEARANCE: Record<CategoryId, CategoryAppearance> = {
  food: {
    labelKey: 'category.food',
    icon: { ios: 'fork.knife', android: 'restaurant' },
    color: '#E8590C',
  },
  transport: {
    labelKey: 'category.transport',
    icon: { ios: 'bus', android: 'directions_bus' },
    color: '#1971C2',
  },
  rent: { labelKey: 'category.rent', icon: { ios: 'house', android: 'home' }, color: '#7048E8' },
  bills: {
    labelKey: 'category.bills',
    icon: { ios: 'bolt', android: 'bolt' },
    color: '#F08C00',
  },
  mobile_recharge: {
    labelKey: 'category.mobile_recharge',
    icon: { ios: 'iphone', android: 'smartphone' },
    color: '#0C8599',
  },
  shopping: {
    labelKey: 'category.shopping',
    icon: { ios: 'bag', android: 'shopping_bag' },
    color: '#C2255C',
  },
  health: {
    labelKey: 'category.health',
    icon: { ios: 'cross.case', android: 'medical_services' },
    color: '#E03131',
  },
  education: {
    labelKey: 'category.education',
    icon: { ios: 'book', android: 'school' },
    color: '#3B5BDB',
  },
  family: {
    labelKey: 'category.family',
    icon: { ios: 'person.2', android: 'family_restroom' },
    color: '#9C36B5',
  },
  entertainment: {
    labelKey: 'category.entertainment',
    icon: { ios: 'film', android: 'movie' },
    color: '#D6336C',
  },
  other_expense: {
    labelKey: 'category.other_expense',
    icon: { ios: 'ellipsis.circle', android: 'more_horiz' },
    color: '#5C677D',
  },
  salary: {
    labelKey: 'category.salary',
    icon: { ios: 'banknote', android: 'payments' },
    color: '#12805C',
  },
  business: {
    labelKey: 'category.business',
    icon: { ios: 'briefcase', android: 'storefront' },
    color: '#2B8A3E',
  },
  freelance: {
    labelKey: 'category.freelance',
    icon: { ios: 'laptopcomputer', android: 'laptop' },
    color: '#087F5B',
  },
  gift: { labelKey: 'category.gift', icon: { ios: 'gift', android: 'redeem' }, color: '#AE3EC9' },
  other_income: {
    labelKey: 'category.other_income',
    icon: { ios: 'ellipsis.circle', android: 'more_horiz' },
    color: '#5C677D',
  },
};

export const PAYMENT_METHOD_LABEL_KEYS: Record<PaymentMethod, TranslationKey> = {
  cash: 'paymentMethod.cash',
  bkash: 'paymentMethod.bkash',
  nagad: 'paymentMethod.nagad',
  bank: 'paymentMethod.bank',
  card: 'paymentMethod.card',
};
