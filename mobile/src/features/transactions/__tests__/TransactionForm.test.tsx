import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import type { IsoDate } from '@/domain/date';
import { makeTransaction } from '@/test-utils/transactions';

import { TransactionForm } from '../components/TransactionForm';

const today = '2026-11-12' as IsoDate;

async function renderForm(onSubmit = jest.fn().mockResolvedValue(undefined)) {
  await render(<TransactionForm initialType="expense" today={today} onSubmit={onSubmit} />);
  return onSubmit;
}

describe('TransactionForm', () => {
  it('shows validation errors and does not submit an empty form', async () => {
    const onSubmit = await renderForm();

    await fireEvent.press(screen.getByTestId('save-transaction'));

    expect(await screen.findByText('Enter an amount.')).toBeOnTheScreen();
    expect(screen.getByText('Choose a category.')).toBeOnTheScreen();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a valid expense in poisha', async () => {
    const onSubmit = await renderForm();

    await fireEvent.changeText(screen.getByTestId('amount-input'), '1,250.50');
    await fireEvent.press(screen.getByTestId('category-food'));
    await fireEvent.press(screen.getByRole('radio', { name: 'bKash' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Yesterday' }));
    await fireEvent.changeText(screen.getByTestId('note-input'), ' Lunch ');
    await fireEvent.press(screen.getByTestId('save-transaction'));

    await screen.findByTestId('save-transaction');
    expect(onSubmit).toHaveBeenCalledWith({
      type: 'expense',
      amount: 125050,
      categoryId: 'food',
      paymentMethod: 'bkash',
      occurredOn: '2026-11-11',
      note: 'Lunch',
    });
  });

  it('shows income categories and clears an expense category when switching type', async () => {
    const onSubmit = await renderForm();

    await fireEvent.changeText(screen.getByTestId('amount-input'), '500');
    await fireEvent.press(screen.getByTestId('category-food'));
    await fireEvent.press(screen.getByRole('radio', { name: 'Income' }));

    expect(screen.queryByTestId('category-food')).toBeNull();
    expect(screen.getByTestId('category-salary')).toBeOnTheScreen();
    expect(screen.getByText('Received in')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('save-transaction'));
    expect(await screen.findByText('Choose a category.')).toBeOnTheScreen();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows a save error when saving fails', async () => {
    await renderForm(jest.fn().mockRejectedValue(new Error('disk full')));

    await fireEvent.changeText(screen.getByTestId('amount-input'), '100');
    await fireEvent.press(screen.getByTestId('category-transport'));
    await fireEvent.press(screen.getByTestId('save-transaction'));

    expect(await screen.findByText('Could not save. Please try again.')).toBeOnTheScreen();
  });
});

describe('TransactionForm in edit mode', () => {
  const existing = makeTransaction({
    id: 'tx-edit',
    type: 'income',
    categoryId: 'freelance',
    amount: 1500050,
    paymentMethod: 'bank',
    occurredOn: '2026-10-03',
    note: 'Website project',
  });

  async function renderEdit(
    onSubmit = jest.fn().mockResolvedValue(undefined),
    onDelete = jest.fn().mockResolvedValue(undefined),
  ) {
    await render(
      <TransactionForm
        transaction={existing}
        today={today}
        onSubmit={onSubmit}
        onDelete={onDelete}
      />,
    );
    return { onSubmit, onDelete };
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('prefills every field from the transaction', async () => {
    await renderEdit();

    expect(screen.getByTestId('amount-input')).toHaveDisplayValue('15,000.50');
    expect(screen.getByTestId('note-input')).toHaveDisplayValue('Website project');
    expect(screen.getByRole('radio', { name: 'Income' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Freelance' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Bank' })).toBeSelected();
    expect(screen.getByRole('radio', { name: '3 Oct' })).toBeSelected();
  });

  it('saves changes', async () => {
    const { onSubmit } = await renderEdit();

    await fireEvent.changeText(screen.getByTestId('amount-input'), '16000');
    await fireEvent.press(screen.getByTestId('save-transaction'));

    await screen.findByTestId('save-transaction');
    expect(onSubmit).toHaveBeenCalledWith({
      type: 'income',
      amount: 1600000,
      categoryId: 'freelance',
      paymentMethod: 'bank',
      occurredOn: '2026-10-03',
      note: 'Website project',
    });
  });

  it('asks for confirmation before deleting', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { onDelete } = await renderEdit();

    await fireEvent.press(screen.getByTestId('delete-transaction'));

    expect(alert).toHaveBeenCalledTimes(1);
    expect(onDelete).not.toHaveBeenCalled();

    // Simulate tapping the destructive "Delete" button in the dialog.
    const buttons = alert.mock.calls[0][2] ?? [];
    const confirm = buttons.find((button) => button.style === 'destructive');
    await act(async () => {
      await confirm?.onPress?.();
    });

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('shows an error when deleting fails', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await renderEdit(undefined, jest.fn().mockRejectedValue(new Error('locked')));

    await fireEvent.press(screen.getByTestId('delete-transaction'));
    const confirm = (alert.mock.calls[0][2] ?? []).find((b) => b.style === 'destructive');
    await act(async () => {
      await confirm?.onPress?.();
    });

    expect(screen.getByText('Could not delete. Please try again.')).toBeOnTheScreen();
  });

  it('has no delete button when adding', async () => {
    await renderForm();
    expect(screen.queryByTestId('delete-transaction')).toBeNull();
  });
});
