import { makeTransaction } from '@/test-utils/transactions';

import { buildTransactionsCsv, csvField } from '../csv';

const labels = {
  categoryName: (tx: { categoryId: string }) => tx.categoryId,
  paymentMethodName: (tx: { paymentMethod: string }) => tx.paymentMethod,
  typeName: (tx: { type: string }) => tx.type,
};

describe('csvField', () => {
  it('quotes commas, quotes and new lines', () => {
    expect(csvField('plain')).toBe('plain');
    expect(csvField('a,b')).toBe('"a,b"');
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
    expect(csvField('two\nlines')).toBe('"two\nlines"');
  });

  it('neutralises spreadsheet formulas', () => {
    expect(csvField('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvField('+1')).toBe("'+1");
    expect(csvField('@sum')).toBe("'@sum");
  });
});

describe('buildTransactionsCsv', () => {
  it('writes a header and newest-first rows with signed plain amounts', () => {
    const csv = buildTransactionsCsv(
      [
        makeTransaction({
          occurredOn: '2026-11-01',
          type: 'income',
          categoryId: 'salary',
          amount: 5000000,
          paymentMethod: 'bank',
        }),
        makeTransaction({
          occurredOn: '2026-11-05',
          amount: 125050,
          note: 'Lunch, team',
          paymentMethod: 'bkash',
        }),
      ],
      'BDT',
      labels,
    );

    expect(csv.startsWith(String.fromCharCode(0xfeff))).toBe(true);
    expect(csv.slice(1).split('\r\n')).toEqual([
      'Date,Type,Category,Amount,Currency,Payment method,Note',
      '2026-11-05,expense,food,-1250.50,BDT,bkash,"Lunch, team"',
      '2026-11-01,income,salary,50000.00,BDT,bank,',
      '',
    ]);
  });

  it('keeps negative amounts numeric (no formula guard on numbers)', () => {
    const csv = buildTransactionsCsv([makeTransaction({ amount: 100 })], 'USD', labels);
    expect(csv).toContain(',-1.00,USD,');
  });
});
