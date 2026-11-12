import { addDays, parseIsoDate, type IsoDate, type MonthKey } from '@/domain/date';

import { t, type TranslationKey } from './index';

const MONTH_KEYS = [
  'month.1',
  'month.2',
  'month.3',
  'month.4',
  'month.5',
  'month.6',
  'month.7',
  'month.8',
  'month.9',
  'month.10',
  'month.11',
  'month.12',
] as const satisfies readonly TranslationKey[];

function monthName(month: number): string {
  return t(MONTH_KEYS[month - 1]);
}

/** Short month names in the current language ("Jan" … "Dec"). */
export function monthNames(): string[] {
  return MONTH_KEYS.map((key) => t(key).slice(0, 3));
}

/** "2026-11" → "November 2026". */
export function formatMonthLabel(month: MonthKey): string {
  const [year, monthNumber] = month.split('-').map(Number);
  return `${monthName(monthNumber)} ${year}`;
}

/**
 * Short, friendly date: "Today", "Yesterday", "12 Nov" (this year)
 * or "12 Nov 2025" (other years).
 */
export function formatDateLabel(date: IsoDate, today: IsoDate): string {
  if (date === today) {
    return t('common.today');
  }
  if (date === addDays(today, -1)) {
    return t('common.yesterday');
  }
  const { year, month, day } = parseIsoDate(date);
  const short = `${day} ${monthName(month).slice(0, 3)}`;
  return year === parseIsoDate(today).year ? short : `${short} ${year}`;
}

/** Greeting for the given hour (0–23) in Dhaka. */
export function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 12) {
    return t('greeting.morning');
  }
  if (hour >= 12 && hour < 17) {
    return t('greeting.afternoon');
  }
  return t('greeting.evening');
}
