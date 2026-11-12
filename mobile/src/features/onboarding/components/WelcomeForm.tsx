import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { AppText, Button, Chip, TextField } from '@/components/ui';
import { CURRENCIES, CURRENCY_CODES, DEFAULT_CURRENCY } from '@/domain/currency';
import type { IsoDate } from '@/domain/date';
import type { ProfileUpdate } from '@/domain/profile';
import { FormError } from '@/features/auth/components/AuthScaffold';
import { t } from '@/i18n';
import { spacing } from '@/theme';

import { createWelcomeSchema, type WelcomeValues } from '../schema';

export interface WelcomeFormProps {
  today: IsoDate;
  /** Saves the profile. Throws on failure. */
  onSubmit: (update: ProfileUpdate) => Promise<void>;
}

/** First-run setup: name, currency and the money the user has right now. */
export function WelcomeForm({ today, onSubmit }: WelcomeFormProps) {
  const [failed, setFailed] = useState(false);
  const schema = useMemo(() => createWelcomeSchema(today), [today]);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WelcomeValues, unknown, ProfileUpdate>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: '', currency: DEFAULT_CURRENCY, balance: '' },
  });

  const submit = handleSubmit(async (update) => {
    setFailed(false);
    try {
      await onSubmit(update);
    } catch {
      setFailed(true);
    }
  });

  return (
    <>
      <AppText color="textSecondary">{t('welcome.subtitle')}</AppText>

      <Controller
        control={control}
        name="displayName"
        render={({ field }) => (
          <TextField
            testID="welcome-name"
            label={t('profile.name')}
            placeholder={t('profile.namePlaceholder')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            maxLength={60}
            autoComplete="name"
            error={errors.displayName?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="currency"
        render={({ field }) => (
          <View>
            <AppText variant="label" color="textSecondary" style={{ marginBottom: spacing.xs }}>
              {t('profile.currency')}
            </AppText>
            <View
              style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}
              accessibilityRole="radiogroup"
              accessibilityLabel={t('profile.currency')}>
              {CURRENCY_CODES.map((code) => (
                <Chip
                  key={code}
                  testID={`welcome-currency-${code}`}
                  label={`${CURRENCIES[code].symbol} ${code}`}
                  selected={field.value === code}
                  onPress={() => field.onChange(code)}
                />
              ))}
            </View>
          </View>
        )}
      />

      <Controller
        control={control}
        name="balance"
        render={({ field }) => (
          <View style={{ gap: spacing.xs }}>
            <TextField
              testID="welcome-balance"
              label={t('welcome.balance')}
              placeholder="0"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              keyboardType="numbers-and-punctuation"
              large
              error={errors.balance?.message}
            />
            <AppText variant="caption" color="textSecondary">
              {t('welcome.balanceHint')}
            </AppText>
          </View>
        )}
      />

      <FormError message={failed ? t('welcome.saveError') : null} />
      <Button
        testID="welcome-submit"
        label={t('welcome.submit')}
        onPress={submit}
        loading={isSubmitting}
      />
    </>
  );
}
