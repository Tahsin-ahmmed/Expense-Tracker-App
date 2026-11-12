import { useEffect, useMemo, useState } from 'react';

import { ErrorState, IconButton, LoadingState, Screen } from '@/components/ui';
import { addMonths, monthOf, type MonthKey } from '@/domain/date';
import {
  filterTransactions,
  groupByDay,
  totalsFor,
  type HistoryFilter,
} from '@/features/transactions/history';
import { TransactionHistoryView } from '@/features/transactions/components/TransactionHistoryView';
import { openAddTransaction, openEditTransaction } from '@/features/transactions/navigation';
import { transactionSearchText } from '@/features/transactions/searchText';
import { useTransactionsStore } from '@/features/transactions/useTransactionsStore';
import { useToday } from '@/hooks/useToday';
import { t } from '@/i18n';

export default function TransactionsScreen() {
  const { today } = useToday();
  const currentMonth = monthOf(today);
  const transactions = useTransactionsStore((state) => state.transactions);
  const status = useTransactionsStore((state) => state.status);
  const load = useTransactionsStore((state) => state.load);

  const [filter, setFilter] = useState<HistoryFilter>({
    month: currentMonth,
    type: 'all',
    query: '',
  });

  useEffect(() => {
    if (status === 'idle') {
      void load();
    }
  }, [status, load]);

  const monthTransactions = useMemo(
    () =>
      filterTransactions(
        transactions,
        { ...filter, type: 'all', query: '' },
        transactionSearchText,
      ),
    [transactions, filter],
  );
  const visible = useMemo(
    () => filterTransactions(transactions, filter, transactionSearchText),
    [transactions, filter],
  );
  const sections = useMemo(() => groupByDay(visible), [visible]);
  const totals = useMemo(() => totalsFor(monthTransactions), [monthTransactions]);

  const changeMonth = (month: MonthKey) => setFilter((current) => ({ ...current, month }));

  return (
    <Screen
      title={t('tabs.transactions')}
      scrollable={false}
      action={
        <IconButton
          icon={{ ios: 'plus', android: 'add' }}
          accessibilityLabel={t('transactions.add')}
          onPress={() => openAddTransaction(filter.type === 'income' ? 'income' : 'expense')}
          testID="add-transaction"
        />
      }>
      {status === 'error' ? (
        <ErrorState message={t('transactions.loadError')} onRetry={() => void load()} />
      ) : status !== 'ready' ? (
        <LoadingState />
      ) : (
        <TransactionHistoryView
          filter={filter}
          onChangeFilter={setFilter}
          onPreviousMonth={() => changeMonth(addMonths(filter.month, -1))}
          onNextMonth={() => changeMonth(addMonths(filter.month, 1))}
          canGoNext={filter.month < currentMonth}
          sections={sections}
          totals={totals}
          monthHasTransactions={monthTransactions.length > 0}
          today={today}
          onPressTransaction={openEditTransaction}
        />
      )}
    </Screen>
  );
}
