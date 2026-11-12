import {
  addDays,
  addMonths,
  monthOf,
  parseIsoDate,
  type IsoDate,
  type MonthKey,
} from '@/domain/date';
import { sumMinor, toMinor, type MinorAmount } from '@/domain/money';
import type { Weekday } from '@/domain/profile';
import type { Transaction } from '@/domain/transaction';

/** Chart ranges: 1M = daily points, 3M = weekly, 6M and 1Y = monthly. */
export const TREND_RANGES = ['1M', '3M', '6M', '1Y'] as const;
export type TrendRange = (typeof TREND_RANGES)[number];

export type Granularity = 'day' | 'week' | 'month';

export interface SeriesPoint {
  /** First day of the bucket (inclusive). */
  start: IsoDate;
  /** Last day of the bucket (inclusive). */
  end: IsoDate;
  income: MinorAmount;
  expense: MinorAmount;
}

export interface TrendSeries {
  range: TrendRange;
  granularity: Granularity;
  /** Oldest first; the last point contains today. */
  points: SeriesPoint[];
  /** Mean expense per point (rounded to the minor unit). */
  averageExpense: MinorAmount;
  /** The same average for the equally long period just before; null if nothing was recorded then. */
  previousAverageExpense: MinorAmount | null;
}

const RANGE_SPEC: Record<TrendRange, { granularity: Granularity; count: number }> = {
  '1M': { granularity: 'day', count: 30 },
  '3M': { granularity: 'week', count: 13 },
  '6M': { granularity: 'month', count: 6 },
  '1Y': { granularity: 'month', count: 12 },
};

function dayOfWeek(date: IsoDate): number {
  const { year, month, day } = parseIsoDate(date);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function lastDayOfMonth(month: MonthKey): IsoDate {
  return addDays(`${addMonths(month, 1)}-01` as IsoDate, -1);
}

/** Bucket boundaries, oldest first, ending with the bucket that contains `today`. */
function buckets(
  granularity: Granularity,
  count: number,
  today: IsoDate,
  weekStartsOn: Weekday,
  offset = 0,
): { start: IsoDate; end: IsoDate }[] {
  const result: { start: IsoDate; end: IsoDate }[] = [];
  for (let i = count - 1 + offset; i >= offset; i -= 1) {
    if (granularity === 'day') {
      const day = addDays(today, -i);
      result.push({ start: day, end: day });
    } else if (granularity === 'week') {
      const back = (dayOfWeek(today) - weekStartsOn + 7) % 7;
      const start = addDays(today, -back - i * 7);
      result.push({ start, end: addDays(start, 6) });
    } else {
      const month = addMonths(monthOf(today), -i);
      result.push({ start: `${month}-01` as IsoDate, end: lastDayOfMonth(month) });
    }
  }
  return result;
}

function fill(
  transactions: readonly Transaction[],
  ranges: { start: IsoDate; end: IsoDate }[],
): SeriesPoint[] {
  return ranges.map(({ start, end }) => {
    const inside = transactions.filter((tx) => tx.occurredOn >= start && tx.occurredOn <= end);
    return {
      start,
      end,
      income: sumMinor(inside.filter((tx) => tx.type === 'income').map((tx) => tx.amount)),
      expense: sumMinor(inside.filter((tx) => tx.type === 'expense').map((tx) => tx.amount)),
    };
  });
}

function averageExpense(points: readonly SeriesPoint[]): MinorAmount {
  if (points.length === 0) {
    return toMinor(0);
  }
  return toMinor(Math.round(sumMinor(points.map((p) => p.expense)) / points.length));
}

/** Income and expense per day / week / month for the chosen range, ending today. */
export function buildTrendSeries(
  transactions: readonly Transaction[],
  range: TrendRange,
  today: IsoDate,
  weekStartsOn: Weekday,
): TrendSeries {
  const { granularity, count } = RANGE_SPEC[range];
  const points = fill(transactions, buckets(granularity, count, today, weekStartsOn));
  const previous = fill(transactions, buckets(granularity, count, today, weekStartsOn, count));
  const previousHasData = previous.some((p) => p.income > 0 || p.expense > 0);

  return {
    range,
    granularity,
    points,
    averageExpense: averageExpense(points),
    previousAverageExpense: previousHasData ? averageExpense(previous) : null,
  };
}

/** Short axis label for a point: "12 Nov" for days/weeks, "Nov" for months. */
export function pointLabel(
  point: SeriesPoint,
  granularity: Granularity,
  monthNames: string[],
): string {
  const { month, day } = parseIsoDate(point.start);
  const name = monthNames[month - 1];
  return granularity === 'month' ? name : `${day} ${name}`;
}
