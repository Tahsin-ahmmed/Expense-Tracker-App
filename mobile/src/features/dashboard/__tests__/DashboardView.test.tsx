import { fireEvent, render, screen } from '@testing-library/react-native';

import type { IsoDate } from '@/domain/date';
import { makeTransaction } from '@/test-utils/transactions';

import { DashboardView } from '../components/DashboardView';
import { buildDashboardSummary } from '../summary';

const today = '2026-11-12' as IsoDate;

describe('DashboardView', () => {
  it('shows zero totals and empty states without transactions', async () => {
    await render(
      <DashboardView summary={buildDashboardSummary([], today)} today={today} onAdd={jest.fn()} />,
    );

    expect(screen.getByTestId('balance-amount')).toHaveTextContent('৳0.00');
    expect(screen.getByText('No expenses this month yet.')).toBeOnTheScreen();
    expect(screen.getByText('No transactions yet')).toBeOnTheScreen();
  });

  it('shows totals, category spending and recent transactions', async () => {
    const summary = buildDashboardSummary(
      [
        makeTransaction({ type: 'income', categoryId: 'salary', amount: 5000000 }),
        makeTransaction({ categoryId: 'rent', amount: 1500000, occurredOn: '2026-11-12' }),
        makeTransaction({ categoryId: 'food', amount: 125050, note: 'Biryani' }),
      ],
      today,
    );

    await render(<DashboardView summary={summary} today={today} onAdd={jest.fn()} />);

    expect(screen.getByTestId('balance-amount')).toHaveTextContent('৳33,749.50');
    expect(screen.getByTestId('income-amount')).toHaveTextContent('৳50,000.00');
    expect(screen.getByTestId('expense-amount')).toHaveTextContent('৳16,250.50');
    expect(screen.getByText('92%')).toBeOnTheScreen();
    expect(screen.getByText('Biryani · Cash')).toBeOnTheScreen();
    expect(screen.getByText('−৳1,250.50')).toBeOnTheScreen();
    expect(screen.getByText('+৳50,000.00')).toBeOnTheScreen();
  });

  it('opens the add screen with the chosen type', async () => {
    const onAdd = jest.fn();
    await render(
      <DashboardView summary={buildDashboardSummary([], today)} today={today} onAdd={onAdd} />,
    );

    await fireEvent.press(screen.getByTestId('add-expense'));
    await fireEvent.press(screen.getByTestId('add-income'));

    expect(onAdd.mock.calls).toEqual([['expense'], ['income']]);
  });
});
