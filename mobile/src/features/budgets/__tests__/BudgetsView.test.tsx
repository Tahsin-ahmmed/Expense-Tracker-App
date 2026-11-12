import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { buildMonthBudgets, type BudgetEntry } from '@/domain/budget';
import type { MonthKey } from '@/domain/date';
import { toMinor } from '@/domain/money';
import { makeTransaction } from '@/test-utils/transactions';

import { BudgetForm } from '../components/BudgetForm';
import { BudgetsView } from '../components/BudgetsView';

const nov = '2026-11' as MonthKey;

function budget(scope: BudgetEntry['scope'], limit: number): BudgetEntry {
  return { scope, effectiveFrom: nov, limit: toMinor(limit), updatedAt: 'x' };
}

describe('BudgetsView', () => {
  it('offers to set an overall budget and lists every expense category', async () => {
    const onEdit = jest.fn();
    await render(<BudgetsView budgets={buildMonthBudgets([], [], nov)} onEdit={onEdit} />);

    await fireEvent.press(screen.getByTestId('set-budget-overall'));
    await fireEvent.press(screen.getByTestId('set-budget-food'));

    expect(onEdit.mock.calls).toEqual([['overall'], ['food']]);
    expect(screen.getByTestId('set-budget-other_expense')).toBeOnTheScreen();
  });

  it('shows progress, status and over-budget amounts', async () => {
    const budgets = buildMonthBudgets(
      [budget('overall', 1000000), budget('food', 50000), budget('transport', 100000)],
      [
        makeTransaction({ categoryId: 'food', amount: 62500 }),
        makeTransaction({ categoryId: 'transport', amount: 85000 }),
        makeTransaction({ categoryId: 'health', amount: 12000 }),
      ],
      nov,
    );

    await render(<BudgetsView budgets={budgets} onEdit={jest.fn()} />);

    expect(screen.getByTestId('budget-food-remainder')).toHaveTextContent('৳125.00 over');
    expect(screen.getByText('Over budget')).toBeOnTheScreen();
    expect(screen.getByText('Almost used')).toBeOnTheScreen(); // transport 85%
    expect(screen.getByText('On track')).toBeOnTheScreen(); // overall
    expect(screen.getByText('৳120.00 spent this month')).toBeOnTheScreen(); // health, no budget
    // Categories with a budget are not repeated in the "No budget set" list.
    expect(screen.queryByTestId('set-budget-food')).toBeNull();
  });

  it('warns when category budgets add up to more than the overall budget', async () => {
    const budgets = buildMonthBudgets(
      [budget('overall', 100000), budget('food', 80000), budget('rent', 50000)],
      [],
      nov,
    );
    await render(<BudgetsView budgets={budgets} onEdit={jest.fn()} />);

    expect(
      screen.getByText('Your category budgets add up to more than your monthly budget.'),
    ).toBeOnTheScreen();
  });
});

describe('BudgetForm', () => {
  afterEach(() => jest.restoreAllMocks());

  it('validates and saves a new limit in poisha', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    await render(
      <BudgetForm currentLimit={null} month={nov} onSave={onSave} onRemove={jest.fn()} />,
    );

    expect(screen.getByText(/Applies from November 2026 onward/)).toBeOnTheScreen();
    expect(screen.queryByTestId('remove-budget')).toBeNull();

    await fireEvent.press(screen.getByTestId('save-budget'));
    expect(await screen.findByText('Enter an amount.')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByTestId('budget-amount-input'), '15,000');
    await fireEvent.press(screen.getByTestId('save-budget'));
    await screen.findByTestId('save-budget');

    expect(onSave).toHaveBeenCalledWith(1500000);
  });

  it('prefills an existing limit and removes it after confirmation', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const onRemove = jest.fn().mockResolvedValue(undefined);
    await render(
      <BudgetForm
        currentLimit={toMinor(2000050)}
        month={nov}
        onSave={jest.fn()}
        onRemove={onRemove}
      />,
    );

    expect(screen.getByTestId('budget-amount-input')).toHaveDisplayValue('20,000.50');

    await fireEvent.press(screen.getByTestId('remove-budget'));
    expect(onRemove).not.toHaveBeenCalled();

    const confirm = (alert.mock.calls[0][2] ?? []).find((b) => b.style === 'destructive');
    await act(async () => {
      await confirm?.onPress?.();
    });
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('shows an error when saving fails', async () => {
    await render(
      <BudgetForm
        currentLimit={null}
        month={nov}
        onSave={jest.fn().mockRejectedValue(new Error('disk'))}
        onRemove={jest.fn()}
      />,
    );

    await fireEvent.changeText(screen.getByTestId('budget-amount-input'), '500');
    await fireEvent.press(screen.getByTestId('save-budget'));

    expect(
      await screen.findByText('Could not save the budget. Please try again.'),
    ).toBeOnTheScreen();
  });
});
