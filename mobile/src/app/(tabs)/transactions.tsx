import { useMemo, useState } from 'react';

import { ErrorState, IconButton, LoadingState, Screen } from '@/components/ui';
import { monthStart } from '@/domain/balance';
import { addMonths, monthOf, type MonthKey } from '@/domain/date';
import { useProfileStore } from '@/features/profile/useProfileStore';
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
import { useAppData } from '@/hooks/useAppData';
import { useToday } from '@/hooks/useToday';
import { t } from '@/i18n';

export default function TransactionsScreen() {
  const { today } = useToday();
  const currentMonth = monthOf(today);
  const transactions = useTransactionsStore((state) => state.transactions);
  const profile = useProfileStore((state) => state.profile);
  const { status, retry } = useAppData();

  const [filter, setFilter] = useState<HistoryFilter>({
    month: currentMonth,
    type: 'all',
    query: '',
  });

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
  const start = useMemo(
    () => monthStart(transactions, profile, filter.month),
    [transactions, profile, filter.month],
  );

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
        <ErrorState message={t('transactions.loadError')} onRetry={retry} />
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
          monthStart={start}
          today={today}
          onPressTransaction={openEditTransaction}
        />
      )}
    </Screen>
  );
}
