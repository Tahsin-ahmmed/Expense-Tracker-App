/**
 * English strings. Every user-facing string goes through `t()` so a Bangla
 * dictionary (`bn.ts`) can be added later with the same keys.
 */
export const en = {
  'app.name': 'HisabBondhu',

  'common.retry': 'Try again',
  'common.save': 'Save',
  'common.saving': 'Saving…',
  'common.loading': 'Loading…',
  'common.today': 'Today',
  'common.yesterday': 'Yesterday',

  'tabs.dashboard': 'Dashboard',
  'tabs.transactions': 'Transactions',
  'tabs.budgets': 'Budgets',
  'tabs.settings': 'Settings',

  'greeting.morning': 'Good morning',
  'greeting.afternoon': 'Good afternoon',
  'greeting.evening': 'Good evening',

  'month.1': 'January',
  'month.2': 'February',
  'month.3': 'March',
  'month.4': 'April',
  'month.5': 'May',
  'month.6': 'June',
  'month.7': 'July',
  'month.8': 'August',
  'month.9': 'September',
  'month.10': 'October',
  'month.11': 'November',
  'month.12': 'December',

  'transactionType.expense': 'Expense',
  'transactionType.income': 'Income',

  'category.food': 'Food & Dining',
  'category.transport': 'Transport',
  'category.rent': 'Rent',
  'category.bills': 'Bills & Utilities',
  'category.mobile_recharge': 'Mobile Recharge',
  'category.shopping': 'Shopping',
  'category.health': 'Health',
  'category.education': 'Education',
  'category.family': 'Family',
  'category.entertainment': 'Entertainment',
  'category.other_expense': 'Other',
  'category.salary': 'Salary',
  'category.business': 'Business',
  'category.freelance': 'Freelance',
  'category.gift': 'Gift',
  'category.other_income': 'Other',

  'paymentMethod.cash': 'Cash',
  'paymentMethod.bkash': 'bKash',
  'paymentMethod.nagad': 'Nagad',
  'paymentMethod.bank': 'Bank',
  'paymentMethod.card': 'Card',

  'dashboard.loadError': 'Could not load your transactions.',
  'dashboard.balanceThisMonth': 'Balance this month',
  'dashboard.income': 'Income',
  'dashboard.expense': 'Expense',
  'dashboard.addExpense': 'Add expense',
  'dashboard.addIncome': 'Add income',
  'dashboard.spendingByCategory': 'Spending by category',
  'dashboard.spendingEmpty': 'No expenses this month yet.',
  'dashboard.budget': 'Monthly budget',
  'dashboard.budgetEmpty': 'Budgets arrive soon. You will be able to set monthly limits here.',
  'dashboard.recentTransactions': 'Recent transactions',
  'dashboard.recentEmpty.title': 'No transactions yet',
  'dashboard.recentEmpty.message': 'Add your first income or expense to see it here.',

  'addTransaction.title': 'Add transaction',
  'addTransaction.type': 'Type',
  'addTransaction.amount': 'Amount',
  'addTransaction.amountPlaceholder': '0.00',
  'addTransaction.category': 'Category',
  'addTransaction.paymentMethod': 'Paid with',
  'addTransaction.receivedIn': 'Received in',
  'addTransaction.date': 'Date',
  'addTransaction.pickDate': 'Pick date',
  'addTransaction.note': 'Note (optional)',
  'addTransaction.notePlaceholder': 'e.g. Lunch with team',
  'addTransaction.saveError': 'Could not save. Please try again.',

  'validation.amountRequired': 'Enter an amount.',
  'validation.amountInvalid': 'Enter a valid amount, e.g. 250 or 1,250.50.',
  'validation.amountPositive': 'Amount must be more than ৳0.',
  'validation.categoryRequired': 'Choose a category.',
  'validation.dateInvalid': 'Choose a valid date.',
  'validation.dateFuture': 'Date cannot be in the future.',
  'validation.noteTooLong': 'Note must be 140 characters or fewer.',

  'transactions.empty.title': 'Full history coming soon',
  'transactions.empty.message':
    'Your recent transactions are on the Dashboard. Search, filters and editing arrive here next.',

  'budgets.empty.title': 'No budgets yet',
  'budgets.empty.message': 'Set monthly limits for your spending categories here.',

  'settings.empty.title': 'Settings',
  'settings.empty.message': 'Profile, language and app preferences will be available here.',
} as const;

export type TranslationKey = keyof typeof en;
export type Dictionary = Record<TranslationKey, string>;
