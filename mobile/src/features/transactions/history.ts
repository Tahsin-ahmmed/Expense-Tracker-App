import { monthOf, type IsoDate, type MonthKey } from '@/domain/date';
import { formatMoney, sumMinor, toMinor, type MinorAmount } from '@/domain/money';
import { compareNewestFirst, type Transaction, type TransactionType } from '@/domain/transaction';

export type TypeFilter = 'all' | TransactionType;

export interface HistoryFilter {
  month: MonthKey;
  type: TypeFilter;
  /** Free-text search; empty string means no search. */
  query: string;
}

/**
 * Returns the searchable text for a transaction (category name, payment
 * method name, note). Injected so this module stays independent of i18n.
 */
export type SearchTextResolver = (transaction: Transaction) => string;

function normalise(text: string): string {
  return text.toLocaleLowerCase().replace(/,/g, '').trim();
}

/** Applies month, type and search filters. Result is newest first. */
export function filterTransactions(
  transactions: readonly Transaction[],
  filter: HistoryFilter,
  searchText: SearchTextResolver,
): Transaction[] {
  const query = normalise(filter.query);

  return transactions
    .filter((tx) => monthOf(tx.occurredOn) === filter.month)
    .filter((tx) => filter.type === 'all' || tx.type === filter.type)
    .filter((tx) => {
      if (query === '') {
        return true;
      }
      // Amount is searchable as plain digits, e.g. "1250" or "1250.50".
      const amount = formatMoney(tx.amount, { showSymbol: false });
      const haystack = normalise(`${searchText(tx)} ${tx.note ?? ''} ${amount}`);
      return haystack.includes(query);
    })
    .sort(compareNewestFirst);
}

export interface MonthTotals {
  income: MinorAmount;
  expense: MinorAmount;
}

export function totalsFor(transactions: readonly Transaction[]): MonthTotals {
  return {
    income: sumMinor(transactions.filter((tx) => tx.type === 'income').map((tx) => tx.amount)),
    expense: sumMinor(transactions.filter((tx) => tx.type === 'expense').map((tx) => tx.amount)),
  };
}

export interface DaySection {
  date: IsoDate;
  /** Income minus expense for the day. */
  net: MinorAmount;
  data: Transaction[];
}

/** Groups newest-first transactions into one section per day, keeping order. */
export function groupByDay(transactions: readonly Transaction[]): DaySection[] {
  const sections: DaySection[] = [];
  for (const tx of transactions) {
    let section = sections.at(-1);
    if (!section || section.date !== tx.occurredOn) {
      section = { date: tx.occurredOn, net: toMinor(0), data: [] };
      sections.push(section);
    }
    section.data.push(tx);
    section.net = toMinor(section.net + (tx.type === 'income' ? tx.amount : -tx.amount));
  }
  return sections;
}
