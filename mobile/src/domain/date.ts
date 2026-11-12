/**
 * Calendar-date helpers for Bangladesh (Asia/Dhaka).
 *
 * Bangladesh uses UTC+6 all year (no daylight saving since 2009), so a fixed
 * offset is exact and avoids relying on the JS engine's time-zone database.
 *
 * Transactions store the calendar day they happened as an `IsoDate`
 * ("YYYY-MM-DD" in Dhaka time). Month totals then compare strings, which is
 * exact and maps directly to PostgreSQL's `date` type.
 */

/** A calendar date in Asia/Dhaka, formatted "YYYY-MM-DD". */
export type IsoDate = string & { readonly __brand: 'IsoDate' };

/** A calendar month, formatted "YYYY-MM". */
export type MonthKey = string & { readonly __brand: 'MonthKey' };

const DHAKA_UTC_OFFSET_MS = 6 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0');
}

/** Shifts an instant so its UTC fields read as Dhaka wall-clock time. */
function toDhakaWallClock(instant: Date): Date {
  return new Date(instant.getTime() + DHAKA_UTC_OFFSET_MS);
}

/** Builds an IsoDate from year, month (1–12) and day. Throws on impossible dates. */
export function toIsoDate(year: number, month: number, day: number): IsoDate {
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    throw new RangeError(`Invalid calendar date: ${year}-${month}-${day}`);
  }
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}` as IsoDate;
}

/** True if the value is a real calendar date in "YYYY-MM-DD" form. */
export function isIsoDate(value: string): value is IsoDate {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) {
    return false;
  }
  try {
    toIsoDate(Number(match[1]), Number(match[2]), Number(match[3]));
    return true;
  } catch {
    return false;
  }
}

/** Splits an IsoDate into numeric parts (month is 1–12). */
export function parseIsoDate(date: IsoDate): { year: number; month: number; day: number } {
  const [year, month, day] = date.split('-').map(Number);
  return { year, month, day };
}

/** Today's calendar date in Dhaka. */
export function todayInDhaka(now: Date = new Date()): IsoDate {
  const dhaka = toDhakaWallClock(now);
  return toIsoDate(dhaka.getUTCFullYear(), dhaka.getUTCMonth() + 1, dhaka.getUTCDate());
}

/** Current hour (0–23) in Dhaka. */
export function dhakaHour(now: Date = new Date()): number {
  return toDhakaWallClock(now).getUTCHours();
}

/** Adds (or subtracts) whole days. */
export function addDays(date: IsoDate, days: number): IsoDate {
  const { year, month, day } = parseIsoDate(date);
  const shifted = new Date(Date.UTC(year, month - 1, day) + days * DAY_MS);
  return toIsoDate(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate());
}

/** The month a date belongs to. */
export function monthOf(date: IsoDate): MonthKey {
  return date.slice(0, 7) as MonthKey;
}

/** Number of days in a month (28–31). */
export function daysInMonth(month: MonthKey): number {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
}

/** Adds (or subtracts) whole months to a month key. "2026-01" − 1 → "2025-12". */
export function addMonths(month: MonthKey, months: number): MonthKey {
  const [year, monthNumber] = month.split('-').map(Number);
  const index = year * 12 + (monthNumber - 1) + months;
  const nextYear = Math.floor(index / 12);
  const nextMonth = (index % 12) + 1;
  return `${pad(nextYear, 4)}-${pad(nextMonth)}` as MonthKey;
}

/**
 * Converts a date chosen in a device date picker to an IsoDate.
 * Pickers return the chosen calendar day in the device's own time zone.
 */
export function fromPickerDate(value: Date): IsoDate {
  return toIsoDate(value.getFullYear(), value.getMonth() + 1, value.getDate());
}

/** Converts an IsoDate to a Date suitable as a date picker's value (local noon). */
export function toPickerDate(date: IsoDate): Date {
  const { year, month, day } = parseIsoDate(date);
  return new Date(year, month - 1, day, 12);
}
