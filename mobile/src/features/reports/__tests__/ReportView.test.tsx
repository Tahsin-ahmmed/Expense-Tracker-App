import { fireEvent, render, screen } from '@testing-library/react-native';

import type { IsoDate, MonthKey } from '@/domain/date';
import { makeTransaction } from '@/test-utils/transactions';

import { ReportView, type ReportViewProps } from '../components/ReportView';
import { buildMonthReport, buildTrend } from '../report';

const nov = '2026-11' as MonthKey;
const today = '2026-11-12' as IsoDate;

const transactions = [
  makeTransaction({
    type: 'income',
    categoryId: 'salary',
    amount: 5000000,
    occurredOn: '2026-11-01',
  }),
  makeTransaction({
    categoryId: 'rent',
    amount: 1500000,
    paymentMethod: 'bkash',
    occurredOn: '2026-11-02',
  }),
  makeTransaction({
    type: 'income',
    categoryId: 'salary',
    amount: 4000000,
    occurredOn: '2026-10-01',
  }),
  makeTransaction({ categoryId: 'rent', amount: 2000000, occurredOn: '2026-10-02' }),
];

function renderReport(month: MonthKey = nov, overrides: Partial<ReportViewProps> = {}) {
  return render(
    <ReportView
      month={month}
      report={buildMonthReport(transactions, [], month, today)}
      trend={buildTrend(transactions, month)}
      canGoNext={month < nov}
      onChangeMonth={jest.fn()}
      onPreviousMonth={jest.fn()}
      onNextMonth={jest.fn()}
      {...overrides}
    />,
  );
}

describe('ReportView', () => {
  it('shows headline numbers with direction and meaning of each change', async () => {
    await renderReport();

    expect(screen.getByTestId('tile-income')).toHaveTextContent(/৳50,000.00.*▲ 25% vs Oct/);
    // Expense went down 25%: good news, still stated with an arrow and words.
    expect(screen.getByTestId('tile-expense')).toHaveTextContent(/৳15,000.00.*▼ 25% vs Oct/);
    expect(screen.getByTestId('tile-net')).toHaveTextContent(/৳35,000.00/);
    expect(screen.getByTestId('tile-savings-rate')).toHaveTextContent(/70%/);
  });

  it('ranks spending by category and payment method', async () => {
    await renderReport();

    expect(screen.getByTestId('ranked-rent')).toHaveTextContent(/Rent.*৳15,000.00.*100%/);
    expect(screen.getByTestId('ranked-bkash')).toHaveTextContent(/bKash/);
  });

  it('shows an empty state and "no budgets" for a month with nothing recorded', async () => {
    await renderReport('2026-09' as MonthKey);

    expect(screen.getByText('Nothing recorded')).toBeOnTheScreen();
    expect(screen.getByText('No budgets were set for this month.')).toBeOnTheScreen();
    expect(screen.getByTestId('tile-savings-rate')).toHaveTextContent(/No income/);
  });

  it('selects a month from the trend chart and shows its values', async () => {
    const onChangeMonth = jest.fn();
    await renderReport(nov, { onChangeMonth });

    expect(screen.getByTestId('trend-readout')).toHaveTextContent(
      /November 2026.*Income ৳50,000.00.*Expense ৳15,000.00/,
    );
    await fireEvent.press(screen.getByTestId('trend-2026-10'));
    expect(onChangeMonth).toHaveBeenCalledWith('2026-10');
  });

  it('describes each trend month for screen readers and offers a table view', async () => {
    await renderReport();

    expect(
      screen.getByRole('button', {
        name: 'October 2026: income ৳40,000.00, expense ৳20,000.00',
      }),
    ).toBeOnTheScreen();

    expect(screen.queryByTestId('trend-table')).toBeNull();
    await fireEvent.press(screen.getByTestId('toggle-trend-table'));
    expect(screen.getByTestId('trend-table')).toHaveTextContent(/Oct.*৳40,000.*৳20,000.*৳20,000/);
  });
});
