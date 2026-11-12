import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { Button, PinField, TextButton, TextField } from '@/components/ui';
import { t } from '@/i18n';

import { toAuthFailure } from '../authService';
import { signInSchema, type Credentials, type SignInValues } from '../schema';
import { FormError } from './AuthScaffold';

export interface SignInFormProps {
  /** Throws on failure; the message is shown above the button. */
  onSubmit: (credentials: Credentials) => Promise<void>;
  onCreateAccount: () => void;
  onForgotPin: () => void;
}

export function SignInForm({ onSubmit, onCreateAccount, onForgotPin }: SignInFormProps) {
  const [failure, setFailure] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues, unknown, Credentials>({
    resolver: zodResolver(signInSchema),
    defaultValues: { identifier: '', pin: '' },
  });

  const submit = handleSubmit(async (credentials) => {
    setFailure(null);
    try {
      await onSubmit(credentials);
    } catch (error) {
      setFailure(toAuthFailure(error).message);
      // Never leave a rejected PIN on screen.
      setValue('pin', '');
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
      <FormError message={failure} />
      <Button
        testID="log-in"
        label={t('auth.logIn.submit')}
        onPress={submit}
        loading={isSubmitting}
      />
      <View>
        <TextButton
          testID="go-forgot-pin"
          label={t('auth.logIn.forgotPin')}
          onPress={onForgotPin}
        />
        <TextButton
          testID="go-sign-up"
          label={t('auth.logIn.noAccount')}
          onPress={onCreateAccount}
        />
      </View>
    </>
  );
}
