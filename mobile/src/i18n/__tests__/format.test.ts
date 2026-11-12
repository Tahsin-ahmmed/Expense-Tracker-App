import type { IsoDate, MonthKey } from '@/domain/date';

import { formatDateLabel, formatMonthLabel, greetingFor } from '../format';

const today = '2026-11-12' as IsoDate;

describe('formatMonthLabel', () => {
  it('formats a month key', () => {
    expect(formatMonthLabel('2026-11' as MonthKey)).toBe('November 2026');
    expect(formatMonthLabel('2027-01' as MonthKey)).toBe('January 2027');
  });
});

describe('formatDateLabel', () => {
  it.each([
    ['2026-11-12', 'Today'],
    ['2026-11-11', 'Yesterday'],
    ['2026-11-01', '1 Nov'],
    ['2025-12-25', '25 Dec 2025'],
  ])('formats %s as %s', (date, expected) => {
    expect(formatDateLabel(date as IsoDate, today)).toBe(expected);
  });
});

describe('greetingFor', () => {
  it.each([
    [5, 'Good morning'],
    [11, 'Good morning'],
    [12, 'Good afternoon'],
    [16, 'Good afternoon'],
    [17, 'Good evening'],
    [2, 'Good evening'],
  ])('hour %i → %s', (hour, expected) => {
    expect(greetingFor(hour)).toBe(expected);
  });
});
