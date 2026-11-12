import { fireEvent, render, screen } from '@testing-library/react-native';

import type { IsoDate, MonthKey } from '@/domain/date';
import { toMinor } from '@/domain/money';
import { makeTransaction } from '@/test-utils/transactions';

import {
  TransactionHistoryView,
  type TransactionHistoryViewProps,
} from '../components/TransactionHistoryView';
import { groupByDay } from '../history';

const today = '2026-11-12' as IsoDate;

function props(overrides: Partial<TransactionHistoryViewProps> = {}): TransactionHistoryViewProps {
  return {
    filter: { month: '2026-11' as MonthKey, type: 'all', query: '' },
    onChangeFilter: jest.fn(),
    onPreviousMonth: jest.fn(),
    onNextMonth: jest.fn(),
    canGoNext: false,
    sections: [],
    totals: { income: toMinor(0), expense: toMinor(0) },
    monthHasTransactions: false,
    today,
    onPressTransaction: jest.fn(),
    ...overrides,
  };
}

describe('TransactionHistoryView', () => {
  it('shows the month, totals and day groups', async () => {
    const lunch = makeTransaction({ id: 'lunch', amount: 25000, occurredOn: '2026-11-12' });
    const salary = makeTransaction({
      id: 'salary',
      type: 'income',
      categoryId: 'salary',
      amount: 5000000,
      occurredOn: '2026-11-01',
    });

    await render(
      <TransactionHistoryView
        {...props({
          sections: groupByDay([lunch, salary]),
          totals: { income: toMinor(5000000), expense: toMinor(25000) },
          monthHasTransactions: true,
        })}
      />,
    );

    expect(screen.getByTestId('month-label')).toHaveTextContent('November 2026');
    expect(screen.getByTestId('month-income')).toHaveTextContent('৳50,000.00');
    expect(screen.getByTestId('month-expense')).toHaveTextContent('৳250.00');
    expect(screen.getByText('Today')).toBeOnTheScreen();
    expect(screen.getByText('1 Nov')).toBeOnTheScreen();
    // Day net total and the row amount are the same for a one-transaction day.
    expect(screen.getAllByText('−৳250.00')).toHaveLength(2);
    expect(screen.getAllByText('+৳50,000.00')).toHaveLength(2);
  });

  it('opens a transaction when tapped', async () => {
    const lunch = makeTransaction({ id: 'lunch', occurredOn: '2026-11-12' });
    const onPressTransaction = jest.fn();
    await render(
      <TransactionHistoryView
        {...props({
          sections: groupByDay([lunch]),
          monthHasTransactions: true,
          onPressTransaction,
        })}
      />,
    );

    await fireEvent.press(screen.getByTestId('transaction-lunch'));

    expect(onPressTransaction).toHaveBeenCalledWith(lunch);
  });

  it('distinguishes an empty month from no search matches', async () => {
    const { rerender } = await render(<TransactionHistoryView {...props()} />);
    expect(screen.getByText('No transactions this month')).toBeOnTheScreen();

    await rerender(<TransactionHistoryView {...props({ monthHasTransactions: true })} />);
    expect(screen.getByText('No matches')).toBeOnTheScreen();
  });

  it('reports filter, search and month changes', async () => {
    const onChangeFilter = jest.fn();
    const onPreviousMonth = jest.fn();
    const onNextMonth = jest.fn();
    await render(
      <TransactionHistoryView {...props({ onChangeFilter, onPreviousMonth, onNextMonth })} />,
    );

    await fireEvent.press(screen.getByRole('radio', { name: 'Income' }));
    await fireEvent.changeText(screen.getByTestId('search-input'), 'rent');
    await fireEvent.press(screen.getByTestId('previous-month'));
    await fireEvent.press(screen.getByTestId('next-month'));

    expect(onChangeFilter.mock.calls).toEqual([
      [{ month: '2026-11', type: 'income', query: '' }],
      [{ month: '2026-11', type: 'all', query: 'rent' }],
    ]);
    expect(onPreviousMonth).toHaveBeenCalledTimes(1);
    // Next is disabled on the current month.
    expect(onNextMonth).not.toHaveBeenCalled();
  });
});
