import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { DEFAULT_PROFILE } from '@/domain/profile';
import { SettingsView, type SettingsViewProps } from '@/features/settings/components/SettingsView';

import { AuthFailure } from '../authService';
import { ForgotPinForm } from '../components/ForgotPinForm';
import { NewPinForm } from '../components/NewPinForm';
import { SignInForm } from '../components/SignInForm';
import { SignUpForm } from '../components/SignUpForm';

describe('SignInForm', () => {
  function renderForm(onSubmit = jest.fn().mockResolvedValue(undefined)) {
    return render(
      <SignInForm onSubmit={onSubmit} onCreateAccount={jest.fn()} onForgotPin={jest.fn()} />,
    );
  }

  it('validates before submitting', async () => {
    const onSubmit = jest.fn();
    await renderForm(onSubmit);

    await fireEvent.press(screen.getByTestId('log-in'));

    expect(await screen.findByText('Enter your email or phone number.')).toBeOnTheScreen();
    expect(screen.getByText('PIN must be exactly 6 digits.')).toBeOnTheScreen();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps only digits in the PIN and submits parsed credentials', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    await renderForm(onSubmit);

    await fireEvent.changeText(screen.getByTestId('identifier-input'), '01712-345678');
    await fireEvent.changeText(screen.getByTestId('pin-input'), '48a29-1567');
    await fireEvent.press(screen.getByTestId('log-in'));
    await screen.findByTestId('log-in');

    expect(onSubmit).toHaveBeenCalledWith({
      identifier: { kind: 'phone', phone: '+8801712345678' },
      pin: '482915',
    });
  });

  it('shows the failure message and clears the PIN', async () => {
    await renderForm(jest.fn().mockRejectedValue(new AuthFailure('invalid_credentials')));

    await fireEvent.changeText(screen.getByTestId('identifier-input'), 'me@mail.com');
    await fireEvent.changeText(screen.getByTestId('pin-input'), '482915');
    await fireEvent.press(screen.getByTestId('log-in'));

    expect(await screen.findByText('Wrong email, phone number or PIN.')).toBeOnTheScreen();
    expect(screen.getByTestId('pin-input')).toHaveDisplayValue('');
  });
});

describe('SignUpForm', () => {
  it('rejects a weak PIN, then submits a strong confirmed one', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    await render(<SignUpForm onSubmit={onSubmit} onLogIn={jest.fn()} />);

    await fireEvent.changeText(screen.getByTestId('identifier-input'), 'Me@Mail.com');
    await fireEvent.changeText(screen.getByTestId('pin-input'), '123456');
    await fireEvent.changeText(screen.getByTestId('confirm-pin-input'), '123456');
    await fireEvent.press(screen.getByTestId('sign-up'));
    expect(await screen.findByText(/too easy to guess/)).toBeOnTheScreen();
    expect(onSubmit).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByTestId('pin-input'), '730184');
    await fireEvent.changeText(screen.getByTestId('confirm-pin-input'), '730184');
    await fireEvent.press(screen.getByTestId('sign-up'));
    await screen.findByTestId('sign-up');

    expect(onSubmit).toHaveBeenCalledWith({
      identifier: { kind: 'email', email: 'me@mail.com' },
      pin: '730184',
    });
  });

  it('shows "already registered" from the server', async () => {
    await render(
      <SignUpForm
        onSubmit={jest.fn().mockRejectedValue(new AuthFailure('already_registered'))}
        onLogIn={jest.fn()}
      />,
    );

    await fireEvent.changeText(screen.getByTestId('identifier-input'), '01912345678');
    await fireEvent.changeText(screen.getByTestId('pin-input'), '730184');
    await fireEvent.changeText(screen.getByTestId('confirm-pin-input'), '730184');
    await fireEvent.press(screen.getByTestId('sign-up'));

    expect(await screen.findByTestId('form-error')).toHaveTextContent(/already exists/);
  });
});

describe('ForgotPinForm', () => {
  it('sends a reset link for an email and confirms', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    await render(<ForgotPinForm onSubmit={onSubmit} onBack={jest.fn()} />);

    await fireEvent.changeText(screen.getByTestId('email-input'), ' Me@Mail.com ');
    await fireEvent.press(screen.getByTestId('send-reset'));

    expect(await screen.findByTestId('reset-sent')).toBeOnTheScreen();
    expect(onSubmit).toHaveBeenCalledWith('me@mail.com');
  });
});

describe('NewPinForm', () => {
  it('requires matching, non-weak PINs', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    await render(<NewPinForm onSubmit={onSubmit} />);

    await fireEvent.changeText(screen.getByTestId('new-pin-input'), '730184');
    await fireEvent.changeText(screen.getByTestId('confirm-new-pin-input'), '730185');
    await fireEvent.press(screen.getByTestId('save-pin'));
    expect(await screen.findByText('The PINs do not match.')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByTestId('confirm-new-pin-input'), '730184');
    await fireEvent.press(screen.getByTestId('save-pin'));
    await screen.findByTestId('save-pin');
    expect(onSubmit).toHaveBeenCalledWith('730184');
  });
});

describe('SettingsView', () => {
  afterEach(() => jest.restoreAllMocks());

  function renderSettings(overrides: Partial<SettingsViewProps> = {}) {
    return render(
      <SettingsView
        user={{ id: 'u', email: null, phone: '8801712345678' }}
        profile={DEFAULT_PROFILE}
        appVersion="1.0.0"
        onOpenProfile={jest.fn()}
        onChangePin={jest.fn()}
        onExport={jest.fn().mockResolvedValue(undefined)}
        onDeleteAccount={jest.fn()}
        onLogOut={jest.fn().mockResolvedValue(undefined)}
        {...overrides}
      />,
    );
  }

  it('shows the phone in local format, currency and version', async () => {
    await renderSettings();

    expect(screen.getByTestId('account-name')).toHaveTextContent('01712-345678');
    expect(screen.getByTestId('row-currency')).toHaveTextContent('CurrencyBDT (৳)');
    expect(screen.getByTestId('row-opening-balance')).toHaveTextContent('Opening balance৳0');
    expect(screen.getByText('1.0.0')).toBeOnTheScreen();
  });

  it('shows the name when set, with the sign-in identity underneath', async () => {
    await renderSettings({ profile: { ...DEFAULT_PROFILE, displayName: 'Rahim' } });

    expect(screen.getByTestId('account-name')).toHaveTextContent('Rahim');
    expect(screen.getByTestId('signed-in-as')).toHaveTextContent('01712-345678');
  });

  it('opens profile, delete account and export', async () => {
    const onOpenProfile = jest.fn();
    const onDeleteAccount = jest.fn();
    const onExport = jest
      .fn()
      .mockRejectedValue(new Error('There are no transactions to export yet.'));
    await renderSettings({ onOpenProfile, onDeleteAccount, onExport });

    await fireEvent.press(screen.getByTestId('open-profile'));
    await fireEvent.press(screen.getByTestId('delete-account'));
    await fireEvent.press(screen.getByTestId('export-csv'));

    expect(onOpenProfile).toHaveBeenCalled();
    expect(onDeleteAccount).toHaveBeenCalled();
    expect(await screen.findByText('There are no transactions to export yet.')).toBeOnTheScreen();
  });

  it('logs out after confirmation', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const onLogOut = jest.fn().mockResolvedValue(undefined);
    await renderSettings({ onLogOut });

    await fireEvent.press(screen.getByTestId('log-out'));
    expect(onLogOut).not.toHaveBeenCalled();

    const confirm = (alert.mock.calls[0][2] ?? []).find((b) => b.style === 'destructive');
    await act(async () => {
      await confirm?.onPress?.();
    });
    expect(onLogOut).toHaveBeenCalledTimes(1);
  });
});
