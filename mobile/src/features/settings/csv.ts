import type { CurrencyCode } from '@/domain/currency';
import { formatMoney, toMinor } from '@/domain/money';
import { compareNewestFirst, type Transaction } from '@/domain/transaction';

/**
 * Builds a CSV of transactions for export. Plain function (no files) so it
 * can be tested; amounts are plain numbers (e.g. 1250.50) so spreadsheets
 * can sum them.
 */
export interface CsvLabels {
  categoryName: (transaction: Transaction) => string;
  paymentMethodName: (transaction: Transaction) => string;
  typeName: (transaction: Transaction) => string;
}

const HEADER = ['Date', 'Type', 'Category', 'Amount', 'Currency', 'Payment method', 'Note'];

/** Quotes a field when needed and neutralises spreadsheet formulas (CSV injection). */
export function csvField(value: string): string {
  let text = value;
  // A cell starting with = + - @ (or tab/CR) can run as a formula in Excel/Sheets.
  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildTransactionsCsv(
  transactions: readonly Transaction[],
  currency: CurrencyCode,
  labels: CsvLabels,
): string {
  const rows = [...transactions].sort(compareNewestFirst).map((tx) => {
    // Signed so a spreadsheet sum gives the net. Numbers are written as-is
    // (no formula guard) so spreadsheets treat them as numbers.
    const amount = formatMoney(tx.type === 'expense' ? toMinor(-tx.amount) : tx.amount, {
      currency,
      showSymbol: false,
    }).replace(/,/g, '');
    return [
      tx.occurredOn,
      csvField(labels.typeName(tx)),
      csvField(labels.categoryName(tx)),
      amount,
      currency,
      csvField(labels.paymentMethodName(tx)),
      csvField(tx.note ?? ''),
    ].join(',');
  });
  // UTF-8 byte order mark so Excel shows Bangla text correctly; CRLF per RFC 4180.
  const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);
  return `${BYTE_ORDER_MARK}${[HEADER.join(','), ...rows].join('\r\n')}\r\n`;
}
