import { addMonths, type IsoDate, type MonthKey } from './date';
import { sumMinor, toMinor, type MinorAmount } from './money';
import type { Profile } from './profile';
import type { Transaction } from './transaction';

/**
 * Running balance and month-to-month carry-over.
 *
 * The balance is the starting balance the user gave in the welcome setup
 * plus every income minus every expense they have recorded. Each month
 * starts with what was left at the end of the previous month.
 *
 * Nothing here is stored: carry-over is recalculated from the transactions,
 * so editing an old transaction automatically corrects every later month.
 */

type StartingBalance = Pick<Profile, 'openingBalance'>;

function signed(tx: Transaction): number {
  return tx.type === 'income' ? tx.amount : -tx.amount;
}

function netBefore(transactions: readonly Transaction[], day: string): MinorAmount {
  return sumMinor(
    transactions.filter((tx) => tx.occurredOn < day).map((tx) => toMinor(signed(tx))),
  );
}

/** What the user has now: starting balance plus everything up to and including today. */
export function currentBalance(
  transactions: readonly Transaction[],
  profile: StartingBalance,
  today: IsoDate,
): MinorAmount {
  // "Before tomorrow" = up to and including today; string compare works for ISO dates.
  return toMinor(profile.openingBalance + netBefore(transactions, `${today}￿`));
}

export type MonthStart =
  /** No transactions before this month: it starts from the starting balance. */
  | { kind: 'opening'; amount: MinorAmount }
  /** It starts with what was left at the end of `fromMonth`. */
  | { kind: 'carryOver'; amount: MinorAmount; fromMonth: MonthKey };

/**
 * How a month starts. Null when there is nothing to show: no earlier
 * transactions and a starting balance of zero.
 */
export function monthStart(
  transactions: readonly Transaction[],
  profile: StartingBalance,
  month: MonthKey,
): MonthStart | null {
  const firstDay = `${month}-01`;
  const hasEarlier = transactions.some((tx) => tx.occurredOn < firstDay);
  if (!hasEarlier) {
    return profile.openingBalance === 0
      ? null
      : { kind: 'opening', amount: profile.openingBalance };
  }
  return {
    kind: 'carryOver',
    amount: toMinor(profile.openingBalance + netBefore(transactions, firstDay)),
    fromMonth: addMonths(month, -1),
  };
}
