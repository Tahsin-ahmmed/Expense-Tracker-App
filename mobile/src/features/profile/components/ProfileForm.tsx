import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, Chip, TextField } from '@/components/ui';
import { CURRENCIES, CURRENCY_CODES, type CurrencyCode } from '@/domain/currency';
import { formatMoney, toMinor } from '@/domain/money';
import type { Profile, ProfileUpdate } from '@/domain/profile';
import { t, type TranslationKey } from '@/i18n';
import { colors, spacing } from '@/theme';

import {
  profileFormSchema,
  toProfileFormValues,
  WEEK_START_CHOICES,
  type ProfileFormValues,
} from '../schema';

export interface ProfileFormProps {
  profile: Profile;
  /** Throws on failure. */
  onSave: (update: ProfileUpdate) => Promise<void>;
}

const WEEKDAY_KEYS: Record<(typeof WEEK_START_CHOICES)[number], TranslationKey> = {
  6: 'weekday.6',
  0: 'weekday.0',
  1: 'weekday.1',
};

/** Asks before switching currency, because amounts are not converted. */
function confirmCurrencyChange(to: CurrencyCode): Promise<boolean> {
  const example = formatMoney(toMinor(100000), { currency: to });
  return new Promise((resolve) => {
    Alert.alert(t('profile.currencyChangeTitle'), t('profile.currencyChangeMessage', { example }), [
      { text: t('editTransaction.deleteCancel'), style: 'cancel', onPress: () => resolve(false) },
      { text: t('profile.currencyChangeConfirm'), onPress: () => resolve(true) },
    ]);
  });
}

export function ProfileForm({ profile, onSave }: ProfileFormProps) {
  const insets = useSafeAreaInsets();
  const [failed, setFailed] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues, unknown, ProfileUpdate>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: toProfileFormValues(profile),
  });

  const save = handleSubmit(async (update) => {
    setFailed(false);
    if (update.currency && update.currency !== profile.currency) {
      if (!(await confirmCurrencyChange(update.currency))) {
        return;
      }
    }
    try {
      await onSave(update);
    } catch {
      setFailed(true);
    }
  });

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Controller
          control={control}
          name="displayName"
          render={({ field }) => (
            <TextField
              testID="name-input"
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
              <AppText variant="label" color="textSecondary" style={styles.label}>
                {t('profile.currency')}
              </AppText>
              <View
                style={styles.chips}
                accessibilityRole="radiogroup"
                accessibilityLabel={t('profile.currency')}>
                {CURRENCY_CODES.map((code) => (
                  <Chip
                    key={code}
                    testID={`currency-${code}`}
                    label={`${CURRENCIES[code].symbol} ${code}`}
                    selected={field.value === code}
                    onPress={() => field.onChange(code)}
                  />
                ))}
              </View>
            </View>
          )}
        />

        <View style={styles.group}>
          <Controller
            control={control}
            name="openingBalance"
            render={({ field }) => (
              <TextField
                testID="opening-balance-input"
                label={t('profile.openingBalance')}
                placeholder="0"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                keyboardType="numbers-and-punctuation"
                error={errors.openingBalance?.message}
              />
            )}
          />
          <AppText variant="caption" color="textSecondary">
            {t('profile.openingBalanceHint')}
          </AppText>
        </View>

        <Controller
          control={control}
          name="weekStartsOn"
          render={({ field }) => (
            <View>
              <AppText variant="label" color="textSecondary" style={styles.label}>
                {t('profile.weekStartsOn')}
              </AppText>
              <View
                style={styles.chips}
                accessibilityRole="radiogroup"
                accessibilityLabel={t('profile.weekStartsOn')}>
                {WEEK_START_CHOICES.map((day) => (
                  <Chip
                    key={day}
                    label={t(WEEKDAY_KEYS[day])}
                    selected={field.value === day}
                    onPress={() => field.onChange(day)}
                  />
                ))}
              </View>
            </View>
          )}
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: spacing.lg + insets.bottom }]}>
        {failed ? (
          <AppText color="danger" align="center" accessibilityRole="alert" style={styles.error}>
            {t('profile.saveError')}
          </AppText>
        ) : null}
        <Button
          testID="save-profile"
          label={isSubmitting ? t('common.saving') : t('common.save')}
          onPress={save}
          loading={isSubmitting}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  label: {
    marginBottom: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  group: {
    gap: spacing.xs,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  error: {
    marginBottom: spacing.sm,
  },
});
