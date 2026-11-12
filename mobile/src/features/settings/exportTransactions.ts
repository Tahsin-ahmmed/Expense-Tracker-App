import { File, Paths } from 'expo-file-system';
import { isAvailableAsync, shareAsync } from 'expo-sharing';

import type { CurrencyCode } from '@/domain/currency';
import type { IsoDate } from '@/domain/date';
import type { Transaction } from '@/domain/transaction';
import {
  CATEGORY_APPEARANCE,
  PAYMENT_METHOD_LABEL_KEYS,
} from '@/features/transactions/categoryAppearance';
import { t } from '@/i18n';

import { buildTransactionsCsv } from './csv';

export class SharingUnavailableError extends Error {
  constructor() {
    super('Sharing is not available on this device');
    this.name = 'SharingUnavailableError';
  }
}

/**
 * Writes all transactions to a CSV file in the app's cache and opens the
 * system share sheet (save to Files / Drive, send by email or WhatsApp).
 */
export async function exportTransactionsCsv(
  transactions: readonly Transaction[],
  currency: CurrencyCode,
  today: IsoDate,
): Promise<void> {
  if (!(await isAvailableAsync())) {
    throw new SharingUnavailableError();
  }

  const csv = buildTransactionsCsv(transactions, currency, {
    categoryName: (tx) => t(CATEGORY_APPEARANCE[tx.categoryId].labelKey),
    paymentMethodName: (tx) => t(PAYMENT_METHOD_LABEL_KEYS[tx.paymentMethod]),
    typeName: (tx) => t(`transactionType.${tx.type}`),
  });

  const file = new File(Paths.cache, `hisabbondhu-transactions-${today}.csv`);
  file.create({ overwrite: true });
  await file.write(csv);

  await shareAsync(file.uri, {
    mimeType: 'text/csv',
    dialogTitle: t('settings.export.title'),
    UTI: 'public.comma-separated-values-text',
  });
}
