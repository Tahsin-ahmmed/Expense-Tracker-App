import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { AppText, Button, TextButton, TextField } from '@/components/ui';
import { t } from '@/i18n';

import { toAuthFailure } from '../authService';
import { forgotPinSchema, type ForgotPinValues } from '../schema';
import { FormError } from './AuthScaffold';

export interface ForgotPinFormProps {
  /** Sends the reset email. Throws on failure. */
  onSubmit: (email: string) => Promise<void>;
  onBack: () => void;
}

export function ForgotPinForm({ onSubmit, onBack }: ForgotPinFormProps) {
  const [failure, setFailure] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPinValues, unknown, string>({
    resolver: zodResolver(forgotPinSchema),
    defaultValues: { email: '' },
  });

  const submit = handleSubmit(async (email) => {
    setFailure(null);
    try {
      await onSubmit(email);
      setSent(true);
    } catch (error) {
      setFailure(toAuthFailure(error).message);
    }
  });

  return (
    <>
      <AppText color="textSecondary">{t('auth.forgot.message')}</AppText>
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextField
            testID="email-input"
            label={t('auth.email')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            keyboardType="email-address"
            error={errors.email?.message}
          />
        )}
      />
      {sent ? (
        <AppText color="primary" accessibilityRole="alert" testID="reset-sent">
          {t('auth.forgot.sent')}
        </AppText>
      ) : null}
      <FormError message={failure} />
      <Button
        testID="send-reset"
        label={t('auth.forgot.submit')}
        onPress={submit}
        loading={isSubmitting}
      />
      <TextButton label={t('auth.forgot.backToLogIn')} onPress={onBack} />
    </>
  );
}
