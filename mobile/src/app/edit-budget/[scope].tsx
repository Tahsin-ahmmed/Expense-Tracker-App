import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { isBudgetScope, resolveLimits } from '@/domain/budget';
import { monthOf } from '@/domain/date';
import type { Poisha } from '@/domain/money';
import { BudgetForm } from '@/features/budgets/components/BudgetForm';
import { scopeLabel } from '@/features/budgets/scopeLabel';
import { useBudgetsStore } from '@/features/budgets/useBudgetsStore';
import { useToday } from '@/hooks/useToday';
import { t } from '@/i18n';
import { spacing } from '@/theme';

/** Modal for setting, changing or removing one budget for the current month onward. */
export default function EditBudgetScreen() {
  const { scope } = useLocalSearchParams<{ scope: string }>();
  const { today } = useToday();
  const month = monthOf(today);
  const entries = useBudgetsStore((state) => state.entries);
  const status = useBudgetsStore((state) => state.status);
  const load = useBudgetsStore((state) => state.load);
  const setLimit = useBudgetsStore((state) => state.setLimit);

  useEffect(() => {
    if (status === 'idle') {
      void load();
    }
  }, [status, load]);

  if (!isBudgetScope(scope)) {
    return (
      <View style={styles.padded}>
        <EmptyState title={t('budgetForm.notFound')} message="" />
      </View>
    );
  }

  const title = <Stack.Screen options={{ title: scopeLabel(scope) }} />;

  if (status === 'error') {
    return (
      <>
        {title}
        <ErrorState message={t('budgets.loadError')} onRetry={() => void load()} />
      </>
    );
  }
  if (status !== 'ready') {
    return (
      <>
        {title}
        <LoadingState />
      </>
    );
  }

  const currentLimit = resolveLimits(entries, month).get(scope) ?? null;

  const handleSave = async (limit: Poisha) => {
    await setLimit(scope, month, limit);
    router.back();
  };

  const handleRemove = async () => {
    await setLimit(scope, month, null);
    router.back();
  };

  return (
    <>
      {title}
      <BudgetForm
        currentLimit={currentLimit}
        month={month}
        onSave={handleSave}
        onRemove={handleRemove}
      />
    </>
  );
}

const styles = StyleSheet.create({
  padded: {
    padding: spacing.lg,
  },
});
