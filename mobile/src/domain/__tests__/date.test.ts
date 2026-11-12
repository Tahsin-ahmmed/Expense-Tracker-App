import {
  addDays,
  dhakaHour,
  fromPickerDate,
  isIsoDate,
  monthOf,
  toIsoDate,
  todayInDhaka,
  toPickerDate,
  type IsoDate,
} from '../date';

describe('todayInDhaka', () => {
  it('uses Dhaka time (UTC+6), not UTC', () => {
    // 20:00 UTC on 12 Nov is 02:00 on 13 Nov in Dhaka.
    expect(todayInDhaka(new Date('2026-11-12T20:00:00Z'))).toBe('2026-11-13');
    // 17:59 UTC is 23:59 in Dhaka, still the same day.
    expect(todayInDhaka(new Date('2026-11-12T17:59:00Z'))).toBe('2026-11-12');
    // 18:00 UTC is exactly Dhaka midnight.
    expect(todayInDhaka(new Date('2026-11-12T18:00:00Z'))).toBe('2026-11-13');
  });

  it('rolls over months and years', () => {
    expect(todayInDhaka(new Date('2026-12-31T18:30:00Z'))).toBe('2027-01-01');
  });
});

describe('dhakaHour', () => {
  it('returns the hour in Dhaka', () => {
    expect(dhakaHour(new Date('2026-11-12T00:00:00Z'))).toBe(6);
    expect(dhakaHour(new Date('2026-11-12T20:30:00Z'))).toBe(2);
  });
});

describe('toIsoDate / isIsoDate', () => {
  it('builds zero-padded dates', () => {
    expect(toIsoDate(2026, 3, 5)).toBe('2026-03-05');
  });

  it('rejects impossible dates', () => {
    expect(() => toIsoDate(2026, 2, 30)).toThrow(RangeError);
    expect(() => toIsoDate(2026, 13, 1)).toThrow(RangeError);
  });

  it.each([
    ['2026-11-12', true],
    ['2028-02-29', true],
    ['2026-02-29', false],
    ['2026-11-31', false],
    ['2026-1-12', false],
    ['12-11-2026', false],
    ['', false],
  ])('isIsoDate(%j) is %s', (value, expected) => {
    expect(isIsoDate(value)).toBe(expected);
  });
});

describe('addDays', () => {
  const date = '2026-03-01' as IsoDate;

  it('moves across month and leap-year boundaries', () => {
    expect(addDays(date, -1)).toBe('2026-02-28');
    expect(addDays('2028-03-01' as IsoDate, -1)).toBe('2028-02-29');
    expect(addDays('2026-12-31' as IsoDate, 1)).toBe('2027-01-01');
    expect(addDays(date, 0)).toBe(date);
  });
});

describe('monthOf', () => {
  it('returns YYYY-MM', () => {
    expect(monthOf('2026-11-12' as IsoDate)).toBe('2026-11');
  });
});

describe('picker conversion', () => {
  it('round-trips through a local Date', () => {
    const date = '2026-01-31' as IsoDate;
    expect(fromPickerDate(toPickerDate(date))).toBe(date);
  });
});
