import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, TextField } from '@/components/ui';
import type { MonthKey } from '@/domain/date';
import { currencySymbol, formatMoney, type MinorAmount } from '@/domain/money';
import { t } from '@/i18n';
import { formatMonthLabel } from '@/i18n/format';
import { colors, spacing } from '@/theme';

import { budgetFormSchema, type BudgetFormValues } from '../schema';

export interface BudgetFormProps {
  /** Limit currently in force, or null if none. */
  currentLimit: MinorAmount | null;
  /** Month from which the change applies. */
  month: MonthKey;
  /** Throw to show a save error. */
  onSave: (limit: MinorAmount) => Promise<void>;
  /** Throw to show a save error. Only offered when a limit exists. */
  onRemove: () => Promise<void>;
}

/** Form for setting, changing or removing a monthly limit. */
export function BudgetForm({ currentLimit, month, onSave, onRemove }: BudgetFormProps) {
  const insets = useSafeAreaInsets();
  const [failed, setFailed] = useState(false);
  const [removing, setRemoving] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormValues, unknown, MinorAmount>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      amount:
        currentLimit === null
          ? ''
          : formatMoney(currentLimit, { showSymbol: false, decimals: 'auto' }),
    },
  });

  const save = handleSubmit(async (limit) => {
    setFailed(false);
    try {
      await onSave(limit);
    } catch {
      setFailed(true);
    }
  });

  const confirmRemove = () => {
    Alert.alert(t('budgetForm.removeConfirmTitle'), t('budgetForm.removeConfirmMessage'), [
      { text: t('editTransaction.deleteCancel'), style: 'cancel' },
      {
        text: t('budgetForm.remove'),
        style: 'destructive',
        onPress: async () => {
          setFailed(false);
          setRemoving(true);
          try {
            await onRemove();
          } catch {
            setFailed(true);
          } finally {
            setRemoving(false);
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Controller
          control={control}
          name="amount"
          render={({ field }) => (
            <TextField
              testID="budget-amount-input"
              label={t('budgetForm.limit')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder={t('addTransaction.amountPlaceholder')}
              keyboardType="decimal-pad"
              autoFocus={currentLimit === null}
              large
              error={errors.amount?.message}
              prefix={
                <AppText variant="title" color="textSecondary">
                  {currencySymbol()}
                </AppText>
              }
            />
          )}
        />
        <AppText variant="caption" color="textSecondary">
          {t('budgetForm.appliesFrom', { month: formatMonthLabel(month) })}
        </AppText>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: spacing.lg + insets.bottom }]}>
        {failed ? (
          <AppText color="danger" align="center" accessibilityRole="alert" style={styles.error}>
            {t('budgetForm.saveError')}
          </AppText>
        ) : null}
        <View style={styles.actions}>
          {currentLimit !== null ? (
            <View style={styles.removeAction}>
              <Button
                testID="remove-budget"
                label={t('budgetForm.remove')}
                variant="danger"
                onPress={confirmRemove}
                loading={removing}
                disabled={isSubmitting}
              />
            </View>
          ) : null}
          <View style={styles.saveAction}>
            <Button
              testID="save-budget"
              label={isSubmitting ? t('common.saving') : t('common.save')}
              onPress={save}
              loading={isSubmitting}
              disabled={removing}
            />
          </View>
        </View>
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
    gap: spacing.md,
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
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  removeAction: {
    flex: 1,
  },
  saveAction: {
    flex: 2,
  },
});
