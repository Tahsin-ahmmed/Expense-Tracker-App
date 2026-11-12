import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Button, PinField } from '@/components/ui';
import { t } from '@/i18n';

import { toAuthFailure } from '../authService';
import { newPinSchema, type NewPinValues } from '../schema';
import { FormError } from './AuthScaffold';

export interface NewPinFormProps {
  /** Saves the new PIN. Throws on failure. */
  onSubmit: (pin: string) => Promise<void>;
}

export function NewPinForm({ onSubmit }: NewPinFormProps) {
  const [failure, setFailure] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewPinValues, unknown, string>({
    resolver: zodResolver(newPinSchema),
    defaultValues: { pin: '', confirmPin: '' },
  });

  const submit = handleSubmit(async (pin) => {
    setFailure(null);
    try {
      await onSubmit(pin);
    } catch (error) {
      setFailure(toAuthFailure(error).message);
    }
  });

  return (
    <>
      <Controller
        control={control}
        name="pin"
        render={({ field }) => (
          <PinField
            testID="new-pin-input"
            label={t('auth.newPin')}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.pin?.message}
            autoFocus
          />
        )}
      />
      <Controller
        control={control}
        name="confirmPin"
        render={({ field }) => (
          <PinField
            testID="confirm-new-pin-input"
            label={t('auth.confirmPin')}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.confirmPin?.message}
          />
        )}
      />
      <FormError message={failure} />
      <Button
        testID="save-pin"
        label={t('auth.reset.submit')}
        onPress={submit}
        loading={isSubmitting}
      />
    </>
  );
}
