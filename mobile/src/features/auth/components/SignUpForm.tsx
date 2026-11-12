import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { AppText, Button, PinField, TextButton, TextField } from '@/components/ui';
import { t } from '@/i18n';

import { toAuthFailure } from '../authService';
import { signUpSchema, type Credentials, type SignUpValues } from '../schema';
import { FormError } from './AuthScaffold';

export interface SignUpFormProps {
  /** Throws on failure; the message is shown above the button. */
  onSubmit: (credentials: Credentials) => Promise<void>;
  onLogIn: () => void;
}

export function SignUpForm({ onSubmit, onLogIn }: SignUpFormProps) {
  const [failure, setFailure] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues, unknown, Credentials>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { identifier: '', pin: '', confirmPin: '' },
  });

  const submit = handleSubmit(async (credentials) => {
    setFailure(null);
    try {
      await onSubmit(credentials);
    } catch (error) {
      setFailure(toAuthFailure(error).message);
    }
  });

  return (
    <>
      <Controller
        control={control}
        name="identifier"
        render={({ field }) => (
          <TextField
            testID="identifier-input"
            label={t('auth.identifier')}
            placeholder={t('auth.identifierPlaceholder')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            keyboardType="email-address"
            error={errors.identifier?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="pin"
        render={({ field }) => (
          <PinField
            testID="pin-input"
            label={t('auth.pin')}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.pin?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="confirmPin"
        render={({ field }) => (
          <PinField
            testID="confirm-pin-input"
            label={t('auth.confirmPin')}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.confirmPin?.message}
          />
        )}
      />
      <AppText variant="caption" color="textSecondary">
        {t('auth.signUp.pinHint')}
      </AppText>
      <FormError message={failure} />
      <Button
        testID="sign-up"
        label={t('auth.signUp.submit')}
        onPress={submit}
        loading={isSubmitting}
      />
      <TextButton testID="go-log-in" label={t('auth.signUp.hasAccount')} onPress={onLogIn} />
    </>
  );
}
