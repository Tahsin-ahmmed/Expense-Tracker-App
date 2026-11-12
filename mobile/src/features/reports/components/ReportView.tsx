import { StyleSheet, View } from 'react-native';

import { AppText, Card, EmptyState, SectionHeader } from '@/components/ui';
import type { MonthKey } from '@/domain/date';
import { formatMoney } from '@/domain/money';
import { BudgetCard } from '@/features/budgets/components/BudgetCard';
import {
  CATEGORY_APPEARANCE,
  PAYMENT_METHOD_LABEL_KEYS,
} from '@/features/transactions/categoryAppearance';
import { CategoryBadge } from '@/features/transactions/components/CategoryBadge';
import { MonthSwitcher } from '@/features/transactions/components/MonthSwitcher';
import { t } from '@/i18n';
import { formatMonthLabel } from '@/i18n/format';
import { spacing } from '@/theme';

import type { MonthReport, MonthTotals } from '../report';
import { RankedBars } from './RankedBars';
import { StatTile, type DeltaTone } from './StatTile';
import { TrendChart } from './TrendChart';

export interface ReportViewProps {
  month: MonthKey;
  report: MonthReport;
  trend: readonly MonthTotals[];
  canGoNext: boolean;
  onChangeMonth: (month: MonthKey) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

/**
 * "▲ 12% vs Oct" with a tone: for expenses going up is bad, for income it is good.
 * The arrow and words carry the direction, so colour is never the only cue.
 */
function describeChange(
  percent: number | null,
  previousMonth: MonthKey,
  upIsGood: boolean,
): { text: string; tone: DeltaTone } {
  const month = formatMonthLabel(previousMonth).slice(0, 3);
  if (percent === null) {
    return { text: t('reports.changeNone', { month }), tone: 'neutral' };
  }
  if (percent === 0) {
    return { text: t('reports.changeSame', { month }), tone: 'neutral' };
  }
  const up = percent > 0;
  return {
    text: t(up ? 'reports.changeUp' : 'reports.changeDown', { percent: Math.abs(percent), month }),
    tone: up === upIsGood ? 'good' : 'bad',
  };
}

/** The Reports screen body for one month (presentational: no data access). */
export function ReportView({
  month,
  report,
  trend,
  canGoNext,
  onChangeMonth,
  onPreviousMonth,
  onNextMonth,
}: ReportViewProps) {
  const income = describeChange(report.incomeChangePercent, report.previous.month, true);
  const expense = describeChange(report.expenseChangePercent, report.previous.month, false);
  const { totals } = report;

  return (
    <View>
      <MonthSwitcher
        month={month}
        onPrevious={onPreviousMonth}
        onNext={onNextMonth}
        canGoNext={canGoNext}
      />

      <View style={styles.tiles}>
        <StatTile
          testID="tile-income"
          label={t('reports.income')}
          value={formatMoney(totals.income)}
          delta={income.text}
          deltaTone={income.tone}
        />
        <StatTile
          testID="tile-expense"
          label={t('reports.expense')}
          value={formatMoney(totals.expense)}
          delta={expense.text}
          deltaTone={expense.tone}
        />
        <StatTile
          testID="tile-net"
          label={t('reports.net')}
          value={formatMoney(totals.net)}
          deltaTone={totals.net < 0 ? 'bad' : 'neutral'}
        />
        <StatTile
          testID="tile-savings-rate"
          label={t('reports.savingsRate')}
          value={
            report.savingsRatePercent === null
              ? t('reports.savingsRateNone')
              : `${report.savingsRatePercent}%`
          }
        />
      </View>

      {report.transactionCount === 0 ? (
        <View style={styles.empty}>
          <EmptyState title={t('reports.empty.title')} message={t('reports.empty.message')} />
        </View>
      ) : (
        <>
          <SectionHeader title={t('reports.highlights')} />
          <Card style={styles.highlights}>
            <Highlight
              label={t('reports.dailyAverage')}
              value={formatMoney(report.dailyAverageExpense)}
            />
            <Highlight
              label={t('reports.largestExpense')}
              value={
                report.largestExpense
                  ? `${formatMoney(report.largestExpense.amount)} · ${t(
                      CATEGORY_APPEARANCE[report.largestExpense.categoryId].labelKey,
                    )}`
                  : t('reports.none')
              }
            />
            <Highlight
              label={t('reports.transactionCount')}
              value={String(report.transactionCount)}
            />
          </Card>
        </>
      )}

      <SectionHeader title={t('reports.trend')} />
      <TrendChart data={trend} selectedMonth={month} onSelectMonth={onChangeMonth} />

      <SectionHeader title={t('reports.byCategory')} />
      <RankedBars
        emptyText={t('reports.noExpenses')}
        items={report.categories.map((item) => ({
          key: item.key,
          label: t(CATEGORY_APPEARANCE[item.key].labelKey),
          amount: item.amount,
          sharePercent: item.sharePercent,
          leading: <CategoryBadge categoryId={item.key} size={24} />,
        }))}
      />

      <SectionHeader title={t('reports.byPaymentMethod')} />
      <RankedBars
        emptyText={t('reports.noExpenses')}
        items={report.paymentMethods.map((item) => ({
          key: item.key,
          label: t(PAYMENT_METHOD_LABEL_KEYS[item.key]),
          amount: item.amount,
          sharePercent: item.sharePercent,
        }))}
      />

      <SectionHeader title={t('reports.budgets')} />
      {report.budgets.overall || report.budgets.categories.length > 0 ? (
        <View style={styles.budgets}>
          {report.budgets.overall ? <BudgetCard progress={report.budgets.overall} /> : null}
          {report.budgets.categories.map((progress) => (
            <BudgetCard key={progress.scope} progress={progress} />
          ))}
        </View>
      ) : (
        <Card>
          <AppText color="textSecondary">{t('reports.noBudgets')}</AppText>
        </Card>
      )}
    </View>
  );
}

function Highlight({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.highlight} accessible accessibilityLabel={`${label}, ${value}`}>
      <AppText color="textSecondary" style={styles.highlightLabel}>
        {label}
      </AppText>
      <AppText variant="label" numberOfLines={1} style={styles.highlightValue}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  empty: {
    marginTop: spacing.lg,
  },
  highlights: {
    gap: spacing.md,
  },
  highlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  highlightLabel: {
    flexShrink: 0,
  },
  highlightValue: {
    flexShrink: 1,
    textAlign: 'right',
  },
  budgets: {
    gap: spacing.md,
  },
});
