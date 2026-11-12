import { fireEvent, render, screen } from '@testing-library/react-native';

import type { IsoDate } from '@/domain/date';

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
