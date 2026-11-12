import { router, useLocalSearchParams } from 'expo-router';

import { isTransactionType, type NewTransaction } from '@/domain/transaction';
import { TransactionForm } from '@/features/transactions/components/TransactionForm';
import { useTransactionsStore } from '@/features/transactions/useTransactionsStore';
import { useToday } from '@/hooks/useToday';

/** Modal screen for adding an income or expense. `?type=income|expense` preselects the type. */
export default function AddTransactionScreen() {
  const { type } = useLocalSearchParams<{ type?: string }>();
  const { today } = useToday();
  const add = useTransactionsStore((state) => state.add);

  const handleSubmit = async (input: NewTransaction) => {
    await add(input);
    router.back();
  };

  return (
    <TransactionForm
      initialType={isTransactionType(type) ? type : 'expense'}
      today={today}
      onSubmit={handleSubmit}
    />
  );
}
