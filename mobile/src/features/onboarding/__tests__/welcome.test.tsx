import { fireEvent, render, screen } from '@testing-library/react-native';

import type { IsoDate } from '@/domain/date';

import { WelcomeForm } from '../components/WelcomeForm';
import { createWelcomeSchema } from '../schema';

const today = '2026-11-12' as IsoDate;

describe('welcome schema', () => {
  const schema = createWelcomeSchema(today);

  it('requires a balance but accepts 0 and negatives, dated today', () => {
    expect(schema.safeParse({ displayName: '', currency: 'BDT', balance: '' }).success).toBe(false);
    expect(schema.parse({ displayName: '', currency: 'BDT', balance: '0' })).toEqual({
      displayName: null,
      currency: 'BDT',
      openingBalance: 0,
      openingBalanceDate: today,
    });
    expect(schema.parse({ displayName: ' Karim ', currency: 'USD', balance: '-250' })).toEqual({
      displayName: 'Karim',
      currency: 'USD',
      openingBalance: -25000,
      openingBalanceDate: today,
    });
  });
});

describe('WelcomeForm', () => {
  it('asks for the balance, then saves name, currency and balance', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    await render(<WelcomeForm today={today} onSubmit={onSubmit} />);

    await fireEvent.press(screen.getByTestId('welcome-submit'));
    expect(await screen.findByText('Enter your current balance (0 is fine).')).toBeOnTheScreen();
    expect(onSubmit).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByTestId('welcome-name'), 'Rahim');
    await fireEvent.press(screen.getByTestId('welcome-currency-BDT'));
    await fireEvent.changeText(screen.getByTestId('welcome-balance'), '25,000');
    await fireEvent.press(screen.getByTestId('welcome-submit'));
    await screen.findByTestId('welcome-submit');

    expect(onSubmit).toHaveBeenCalledWith({
      displayName: 'Rahim',
      currency: 'BDT',
      openingBalance: 2500000,
      openingBalanceDate: today,
    });
  });

  it('shows an error when saving fails', async () => {
    await render(
      <WelcomeForm today={today} onSubmit={jest.fn().mockRejectedValue(new Error('offline'))} />,
    );
    await fireEvent.changeText(screen.getByTestId('welcome-balance'), '0');
    await fireEvent.press(screen.getByTestId('welcome-submit'));

    expect(await screen.findByTestId('form-error')).toHaveTextContent(/Could not save/);
  });
});
