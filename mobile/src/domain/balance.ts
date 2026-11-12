import { addMonths, monthOf, type IsoDate, type MonthKey } from './date';
import { sumMinor, toMinor, type MinorAmount } from './money';
import type { Profile } from './profile';
import type { Transaction } from './transaction';

/**
 * Running balance and month-to-month carry-over.
 *
 * The user enters what they had on one day (the opening balance). From that
 * day on, every income adds and every expense subtracts. Transactions dated
 * before the opening day are kept as history but do not change the balance,
 * so back-filling old entries never counts money twice.
 *
 * Nothing here is stored: carry-over is recalculated from the transactions,
 * so editing an old transaction automatically corrects every later month.
 */

type OpeningBalance = Pick<Profile, 'openingBalance' | 'openingBalanceDate'>;

function signed(tx: Transaction): number {
  return tx.type === 'income' ? tx.amount : -tx.amount;
}

/** Balance after every counted transaction dated before `day` (exclusive). */
function balanceBefore(
  transactions: readonly Transaction[],
  opening: MinorAmount,
  openingDate: IsoDate,
  day: string,
): MinorAmount {
  const net = sumMinor(
    transactions
      .filter((tx) => tx.occurredOn >= openingDate && tx.occurredOn < day)
      .map((tx) => toMinor(signed(tx))),
  );
  return toMinor(opening + net);
}

/** What the user has now: opening balance plus everything up to and including today. */
export function currentBalance(
  transactions: readonly Transaction[],
  profile: OpeningBalance,
  today: IsoDate,
): MinorAmount | null {
  if (!profile.openingBalanceDate) {
    return null;
  }
  // "Before tomorrow" = up to and including today; string compare works for ISO dates.
  return balanceBefore(
    transactions,
    profile.openingBalance,
    profile.openingBalanceDate,
    `${today}￿`,
  );
}

export type MonthStart =
  /** The month the opening balance was set in: it starts from the opening balance. */
  | { kind: 'opening'; amount: MinorAmount; date: IsoDate }
  /** A later month: it starts with what was left at the end of `fromMonth`. */
  | { kind: 'carryOver'; amount: MinorAmount; fromMonth: MonthKey };

/**
 * How a month starts. Null when no opening balance is set, or for months
 * before the opening balance (the balance is not known then).
 */
export function monthStart(
  transactions: readonly Transaction[],
  profile: OpeningBalance,
  month: MonthKey,
): MonthStart | null {
  const openingDate = profile.openingBalanceDate;
  if (!openingDate) {
    return null;
  }
  const openingMonth = monthOf(openingDate);
  if (month < openingMonth) {
    return null;
  }
  if (month === openingMonth) {
    return { kind: 'opening', amount: profile.openingBalance, date: openingDate };
  }
  return {
    kind: 'carryOver',
    amount: balanceBefore(transactions, profile.openingBalance, openingDate, `${month}-01`),
    fromMonth: addMonths(month, -1),
  };
}
