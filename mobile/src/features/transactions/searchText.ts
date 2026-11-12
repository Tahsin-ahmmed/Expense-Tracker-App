import type { Transaction } from '@/domain/transaction';
import { t } from '@/i18n';

import { CATEGORY_APPEARANCE, PAYMENT_METHOD_LABEL_KEYS } from './categoryAppearance';
import type { SearchTextResolver } from './history';

/** Searchable text in the current language: category and payment method names. */
export const transactionSearchText: SearchTextResolver = (transaction: Transaction) =>
  `${t(CATEGORY_APPEARANCE[transaction.categoryId].labelKey)} ${t(
    PAYMENT_METHOD_LABEL_KEYS[transaction.paymentMethod],
  )}`;
