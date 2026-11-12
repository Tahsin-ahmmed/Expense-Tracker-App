import { SectionList, StyleSheet, View } from 'react-native';

import {
  AppText,
  EmptyState,
  SegmentedControl,
  TextField,
  type SegmentOption,
} from '@/components/ui';
import type { IsoDate } from '@/domain/date';
import { formatTaka, toPoisha } from '@/domain/money';
import type { Transaction } from '@/domain/transaction';
import { t } from '@/i18n';
import { formatDateLabel } from '@/i18n/format';
import { colors, radius, spacing } from '@/theme';

import type { DaySection, HistoryFilter, MonthTotals, TypeFilter } from '../history';
import { MonthSwitcher } from './MonthSwitcher';
import { TransactionRow } from './TransactionRow';

export interface TransactionHistoryViewProps {
  filter: HistoryFilter;
  onChangeFilter: (filter: HistoryFilter) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  canGoNext: boolean;
  sections: readonly DaySection[];
  totals: MonthTotals;
  /** True if the month has any transactions before type/search filters. */
  monthHasTransactions: boolean;
  today: IsoDate;
  onPressTransaction: (transaction: Transaction) => void;
}

const TYPE_OPTIONS: readonly SegmentOption<TypeFilter>[] = [
  { value: 'all', label: t('transactions.filterAll') },
  { value: 'expense', label: t('transactionType.expense') },
  { value: 'income', label: t('transactionType.income') },
];

/** Month-by-month transaction history with type filter and search. Presentational only. */
export function TransactionHistoryView({
  filter,
  onChangeFilter,
  onPreviousMonth,
  onNextMonth,
  canGoNext,
  sections,
  totals,
  monthHasTransactions,
  today,
  onPressTransaction,
}: TransactionHistoryViewProps) {
  const header = (
    <View style={styles.header}>
      <MonthSwitcher
        month={filter.month}
        onPrevious={onPreviousMonth}
        onNext={onNextMonth}
        canGoNext={canGoNext}
      />

      <View style={styles.totals}>
        <View style={styles.total}>
          <AppText variant="caption" color="textSecondary">
            {t('transactions.monthIncome')}
          </AppText>
          <AppText variant="label" color="income" testID="month-income">
            {formatTaka(totals.income)}
          </AppText>
        </View>
        <View style={styles.total}>
          <AppText variant="caption" color="textSecondary">
            {t('transactions.monthExpense')}
          </AppText>
          <AppText variant="label" color="expense" testID="month-expense">
            {formatTaka(totals.expense)}
          </AppText>
        </View>
      </View>

      <SegmentedControl
        options={TYPE_OPTIONS}
        value={filter.type}
        onChange={(type) => onChangeFilter({ ...filter, type })}
        accessibilityLabel={t('transactions.filter')}
      />

      <TextField
        testID="search-input"
        label={t('transactions.search')}
        value={filter.query}
        onChangeText={(query) => onChangeFilter({ ...filter, query })}
        placeholder={t('transactions.searchPlaceholder')}
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
    </View>
  );

  const empty = monthHasTransactions ? (
    <EmptyState
      title={t('transactions.noMatches.title')}
      message={t('transactions.noMatches.message')}
    />
  ) : (
    <EmptyState title={t('transactions.empty.title')} message={t('transactions.empty.message')} />
  );

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      keyboardShouldPersistTaps="handled"
      stickySectionHeadersEnabled={false}
      contentContainerStyle={styles.content}
      renderSectionHeader={({ section }) => (
        <View style={styles.dayHeader} accessibilityRole="header">
          <AppText variant="label" color="textSecondary">
            {formatDateLabel(section.date, today)}
          </AppText>
          <AppText variant="caption" color={section.net < 0 ? 'expense' : 'income'}>
            {`${section.net < 0 ? '−' : '+'}${formatTaka(toPoisha(Math.abs(section.net)))}`}
          </AppText>
        </View>
      )}
      renderItem={({ item, index, section }) => (
        <View
          style={[
            styles.item,
            index === 0 && styles.itemFirst,
            index === section.data.length - 1 && styles.itemLast,
            index > 0 && styles.itemSeparated,
          ]}>
          <TransactionRow
            transaction={item}
            today={today}
            showDate={false}
            onPress={onPressTransaction}
          />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  header: {
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  totals: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  total: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  item: {
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  itemFirst: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  itemLast: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  itemSeparated: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
