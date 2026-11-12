import { fireEvent, render, screen } from '@testing-library/react-native';

import { buildMonthBudgets, type BudgetEntry } from '@/domain/budget';
import type { IsoDate, MonthKey } from '@/domain/date';
import { toMinor } from '@/domain/money';
import type { Transaction } from '@/domain/transaction';
import { makeTransaction } from '@/test-utils/transactions';

import { DashboardView, type DashboardViewProps } from '../components/DashboardView';
import { buildDashboardSummary } from '../summary';

const today = '2026-11-12' as IsoDate;
const month = '2026-11' as MonthKey;

function budget(scope: BudgetEntry['scope'], limit: number): BudgetEntry {
  return { scope, effectiveFrom: month, limit: toMinor(limit), updatedAt: '2026-11-01T00:00:00Z' };
}

function renderDashboard(
  transactions: Transaction[] = [],
  entries: BudgetEntry[] = [],
  overrides: Partial<DashboardViewProps> = {},
) {
  return render(
    <DashboardView
      summary={buildDashboardSummary(transactions, today)}
      budgets={buildMonthBudgets(entries, transactions, month)}
      currentBalance={null}
      monthStart={null}
      today={today}
      onAdd={jest.fn()}
      {...overrides}
    />,
  );
}

describe('DashboardView', () => {
  it('shows zero totals and empty states without transactions', async () => {
    await renderDashboard();

    expect(screen.getByTestId('balance-amount')).toHaveTextContent('৳0.00');
    expect(screen.getByText('No expenses this month yet.')).toBeOnTheScreen();
    expect(screen.getByText('No transactions yet')).toBeOnTheScreen();
  });

  it('shows totals, category spending and recent transactions', async () => {
    await renderDashboard([
      makeTransaction({ type: 'income', categoryId: 'salary', amount: 5000000 }),
      makeTransaction({ categoryId: 'rent', amount: 1500000, occurredOn: '2026-11-12' }),
      makeTransaction({ categoryId: 'food', amount: 125050, note: 'Biryani' }),
    ]);

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
    await renderDashboard([], [], { onAdd });

    await fireEvent.press(screen.getByTestId('add-expense'));
    await fireEvent.press(screen.getByTestId('add-income'));

    expect(onAdd.mock.calls).toEqual([['expense'], ['income']]);
  });

  describe('budget section', () => {
    it('prompts to set a budget when none exist', async () => {
      const onSetBudget = jest.fn();
      await renderDashboard([], [], { onSetBudget });

      await fireEvent.press(screen.getByTestId('dashboard-set-budget'));

      expect(onSetBudget).toHaveBeenCalledTimes(1);
    });

    it('shows overall progress', async () => {
      await renderDashboard([makeTransaction({ amount: 1500000 })], [budget('overall', 2000000)]);

      expect(screen.getByTestId('budget-spent-of')).toHaveTextContent('৳15,000 of ৳20,000 spent');
      expect(screen.getByTestId('budget-overall-remainder')).toHaveTextContent('৳5,000.00 left');
      expect(screen.queryByTestId('dashboard-set-budget')).toBeNull();
    });

    it('reports how many category budgets are exceeded', async () => {
      const onOpenBudgets = jest.fn();
      await renderDashboard(
        [
          makeTransaction({ categoryId: 'food', amount: 60000 }),
          makeTransaction({ categoryId: 'transport', amount: 30000 }),
        ],
        [budget('food', 50000), budget('transport', 20000), budget('rent', 100000)],
        { onOpenBudgets },
      );

      expect(screen.getByTestId('categories-over')).toHaveTextContent(
        '2 category budgets exceeded',
      );
      await fireEvent.press(screen.getByTestId('dashboard-view-budgets'));
      expect(onOpenBudgets).toHaveBeenCalledTimes(1);
    });
  });

  describe('balance and budget redesign', () => {
    it('invites the user to set a balance until one exists', async () => {
      const onSetBalance = jest.fn();
      await renderDashboard([], [], { onSetBalance });

      await fireEvent.press(screen.getByTestId('set-balance'));
      expect(onSetBalance).toHaveBeenCalledTimes(1);
    });

    it('shows the current balance and how the month started', async () => {
      await renderDashboard([], [], {
        currentBalance: toMinor(3000000),
        monthStart: {
          kind: 'carryOver',
          amount: toMinor(500000),
          fromMonth: '2026-10' as MonthKey,
        },
      });

      expect(screen.getByText('Current balance')).toBeOnTheScreen();
      expect(screen.getByTestId('balance-amount')).toHaveTextContent('৳30,000.00');
      expect(screen.getByTestId('month-start')).toHaveTextContent(
        'Started November with ৳5,000.00',
      );
      expect(screen.queryByTestId('set-balance')).toBeNull();
    });

    it('suggests a safe daily amount for the rest of the month', async () => {
      // Nov 12: 19 days left including today. (৳20,000 − ৳1,000) / 19 = ৳1,000.
      await renderDashboard([makeTransaction({ amount: 100000 })], [budget('overall', 2000000)]);

      expect(screen.getByTestId('safe-daily')).toHaveTextContent(
        'You can spend ৳1,000.00 a day for the next 19 days.',
      );
    });

    it('shows the overspent amount and no daily tip when over budget', async () => {
      await renderDashboard([makeTransaction({ amount: 2500000 })], [budget('overall', 2000000)]);

      expect(screen.getByTestId('budget-overall-remainder')).toHaveTextContent(
        '৳5,000.00 over budget',
      );
      expect(screen.getByText('Over budget')).toBeOnTheScreen();
      expect(screen.queryByTestId('safe-daily')).toBeNull();
    });
  });
});
