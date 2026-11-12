import { formatTaka, parseTakaInput, toPoisha } from '../money';

describe('toPoisha', () => {
  it('accepts safe integers', () => {
    expect(toPoisha(125050)).toBe(125050);
    expect(toPoisha(0)).toBe(0);
    expect(toPoisha(-500)).toBe(-500);
  });

  it('rejects fractional and unsafe values', () => {
    expect(() => toPoisha(10.5)).toThrow(RangeError);
    expect(() => toPoisha(Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
    expect(() => toPoisha(Number.NaN)).toThrow(RangeError);
  });
});

describe('parseTakaInput', () => {
  it.each([
    ['1250', 125000],
    ['1250.5', 125050],
    ['1250.50', 125050],
    ['1,250.05', 125005],
    ['0.01', 1],
    ['0', 0],
    ['007', 700],
    ['12.', 1200],
    ['৳ 1,00,000', 10000000],
    ['৳500', 50000],
    ['Tk 99.5', 9950],
    ['tk. 10', 1000],
    ['BDT 20', 2000],
    ['  42  ', 4200],
    ['১২৫০.৫০', 125050],
  ])('parses %j as %i poisha', (input, expected) => {
    expect(parseTakaInput(input)).toBe(expected);
  });

  it('avoids floating-point rounding errors', () => {
    // 0.29 * 100 === 28.999999999999996 in floating point.
    expect(parseTakaInput('0.29')).toBe(29);
    expect(parseTakaInput('1.15')).toBe(115);
  });

  it.each(['', '   ', 'abc', '-50', '12.345', '1.2.3', '.5', '12a', '৳', '1e5'])(
    'rejects %j',
    (input) => {
      expect(parseTakaInput(input)).toBeNull();
    },
  );

  it('rejects amounts too large to store safely', () => {
    expect(parseTakaInput('99999999999999')).toBeNull();
    expect(parseTakaInput('9999999999999')).toBe(999999999999900);
  });
});

describe('formatTaka', () => {
  it.each([
    [0, '৳0.00'],
    [5, '৳0.05'],
    [125050, '৳1,250.50'],
    [10000000, '৳1,00,000.00'],
    [1234567890, '৳1,23,45,678.90'],
    [99900, '৳999.00'],
    [100000, '৳1,000.00'],
  ])('formats %i poisha as %s', (amount, expected) => {
    expect(formatTaka(toPoisha(amount))).toBe(expected);
  });

  it('formats negative amounts with a leading minus', () => {
    expect(formatTaka(toPoisha(-125050))).toBe('-৳1,250.50');
  });

  it('can hide the symbol', () => {
    expect(formatTaka(toPoisha(125050), { showSymbol: false })).toBe('1,250.50');
  });

  it('hides decimals for whole Taka in auto mode only', () => {
    expect(formatTaka(toPoisha(10000000), { decimals: 'auto' })).toBe('৳1,00,000');
    expect(formatTaka(toPoisha(125050), { decimals: 'auto' })).toBe('৳1,250.50');
  });

  it('round-trips with parseTakaInput', () => {
    const parsed = parseTakaInput('1,23,456.78');
    expect(parsed).not.toBeNull();
    expect(formatTaka(parsed!)).toBe('৳1,23,456.78');
  });
});
