import { transactionRepository } from '@/data';

import { createTransactionsStore } from './store';

/** App-wide transactions store backed by local storage. */
export const useTransactionsStore = createTransactionsStore(transactionRepository);
