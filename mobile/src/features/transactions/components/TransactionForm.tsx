import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppText,
  Button,
  Chip,
  Icon,
  SegmentedControl,
  TextField,
  type SegmentOption,
} from '@/components/ui';
import { categoriesFor, isCategoryForType, isCategoryId } from '@/domain/category';
import type { IsoDate } from '@/domain/date';
import { TAKA_SYMBOL } from '@/domain/money';
import {
  NOTE_MAX_LENGTH,
  PAYMENT_METHODS,
  type NewTransaction,
  type TransactionType,
} from '@/domain/transaction';
import { t } from '@/i18n';
import { colors, spacing } from '@/theme';

import { CATEGORY_APPEARANCE, PAYMENT_METHOD_LABEL_KEYS } from '../categoryAppearance';
import { createTransactionFormSchema, type TransactionFormValues } from '../schema';
import { DateField } from './DateField';

export interface TransactionFormProps {
  initialType: TransactionType;
  today: IsoDate;
  /** Persists the transaction. Throw to show a save error. */
  onSubmit: (input: NewTransaction) => Promise<void>;
}

const TYPE_OPTIONS: readonly SegmentOption<TransactionType>[] = [
  { value: 'expense', label: t('transactionType.expense') },
  { value: 'income', label: t('transactionType.income') },
];

/** Form for adding an income or expense. Validation lives in `schema.ts`. */
export function TransactionForm({ initialType, today, onSubmit }: TransactionFormProps) {
  const insets = useSafeAreaInsets();
  const [saveFailed, setSaveFailed] = useState(false);
  const schema = useMemo(() => createTransactionFormSchema(today), [today]);

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues, unknown, NewTransaction>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: initialType,
      amount: '',
      categoryId: '',
      paymentMethod: 'cash',
      occurredOn: today,
      note: '',
    },
  });

  const type = useWatch({ control, name: 'type' });

  const changeType = (next: TransactionType) => {
    setValue('type', next);
    const categoryId = getValues('categoryId');
    if (isCategoryId(categoryId) && !isCategoryForType(categoryId, next)) {
      setValue('categoryId', '');
    }
  };

  const submit = handleSubmit(async (input) => {
    setSaveFailed(false);
    try {
      await onSubmit(input);
    } catch {
      setSaveFailed(true);
    }
  });

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SegmentedControl
          options={TYPE_OPTIONS}
          value={type}
          onChange={changeType}
          accessibilityLabel={t('addTransaction.type')}
        />

        <Controller
          control={control}
          name="amount"
          render={({ field }) => (
            <TextField
              testID="amount-input"
              label={t('addTransaction.amount')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder={t('addTransaction.amountPlaceholder')}
              keyboardType="decimal-pad"
              autoFocus
              large
              error={errors.amount?.message}
              prefix={
                <AppText variant="title" color="textSecondary">
                  {TAKA_SYMBOL}
                </AppText>
              }
            />
          )}
        />

        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <View>
              <AppText variant="label" color="textSecondary" style={styles.label}>
                {t('addTransaction.category')}
              </AppText>
              <View
                style={styles.chips}
                accessibilityRole="radiogroup"
                accessibilityLabel={t('addTransaction.category')}>
                {categoriesFor(type).map((categoryId) => {
                  const appearance = CATEGORY_APPEARANCE[categoryId];
                  const selected = field.value === categoryId;
                  return (
                    <Chip
                      key={categoryId}
                      testID={`category-${categoryId}`}
                      label={t(appearance.labelKey)}
                      selected={selected}
                      onPress={() => field.onChange(categoryId)}
                      leading={
                        <Icon
                          name={appearance.icon}
                          size={16}
                          color={selected ? colors.onPrimary : appearance.color}
                        />
                      }
                    />
                  );
                })}
              </View>
              {errors.categoryId?.message ? (
                <AppText variant="caption" color="danger" style={styles.error}>
                  {errors.categoryId.message}
                </AppText>
              ) : null}
            </View>
          )}
        />

        <Controller
          control={control}
          name="paymentMethod"
          render={({ field }) => {
            const label =
              type === 'expense'
                ? t('addTransaction.paymentMethod')
                : t('addTransaction.receivedIn');
            return (
              <View>
                <AppText variant="label" color="textSecondary" style={styles.label}>
                  {label}
                </AppText>
                <View
                  style={styles.chips}
                  accessibilityRole="radiogroup"
                  accessibilityLabel={label}>
                  {PAYMENT_METHODS.map((method) => (
                    <Chip
                      key={method}
                      label={t(PAYMENT_METHOD_LABEL_KEYS[method])}
                      selected={field.value === method}
                      onPress={() => field.onChange(method)}
                    />
                  ))}
                </View>
              </View>
            );
          }}
        />

        <Controller
          control={control}
          name="occurredOn"
          render={({ field }) => (
            <DateField
              label={t('addTransaction.date')}
              value={field.value}
              onChange={field.onChange}
              today={today}
              error={errors.occurredOn?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="note"
          render={({ field }) => (
            <TextField
              testID="note-input"
              label={t('addTransaction.note')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder={t('addTransaction.notePlaceholder')}
              maxLength={NOTE_MAX_LENGTH}
              error={errors.note?.message}
            />
          )}
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: spacing.lg + insets.bottom }]}>
        {saveFailed ? (
          <AppText color="danger" align="center" accessibilityRole="alert" style={styles.saveError}>
            {t('addTransaction.saveError')}
          </AppText>
        ) : null}
        <Button
          testID="save-transaction"
          label={isSubmitting ? t('common.saving') : t('common.save')}
          onPress={submit}
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
  error: {
    marginTop: spacing.xs,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  saveError: {
    marginBottom: spacing.sm,
  },
});
