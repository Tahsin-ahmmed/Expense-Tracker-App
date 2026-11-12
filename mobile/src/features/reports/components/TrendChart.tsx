import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card, TextButton } from '@/components/ui';
import type { MonthKey } from '@/domain/date';
import { formatTaka, formatTakaCompact, toPoisha, type Poisha } from '@/domain/money';
import { t } from '@/i18n';
import { formatMonthLabel } from '@/i18n/format';
import { colors, radius, spacing } from '@/theme';

import type { MonthTotals } from '../report';

export interface TrendChartProps {
  /** Oldest first. */
  data: readonly MonthTotals[];
  selectedMonth: MonthKey;
  onSelectMonth: (month: MonthKey) => void;
}

const PLOT_HEIGHT = 140;
const BAR_WIDTH = 12;
const AXIS_WIDTH = 48;

/** Series colours (validated together for colour-blind separation and contrast). */
const SERIES = [
  { key: 'income', labelKey: 'reports.income', color: colors.income },
  { key: 'expense', labelKey: 'reports.expense', color: colors.expense },
] as const;

/** Rounds up to a clean axis maximum: 1, 2, 2.5 or 5 × 10ⁿ Taka, split in two. */
export function niceAxisMax(maxPoisha: number): Poisha {
  if (maxPoisha <= 0) {
    return toPoisha(0);
  }
  const taka = maxPoisha / 100;
  const half = taka / 2;
  const magnitude = 10 ** Math.floor(Math.log10(half));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= half) ?? half;
  return toPoisha(Math.round(step * 2 * 100));
}

function shortMonth(month: MonthKey): string {
  return formatMonthLabel(month).slice(0, 3);
}

/**
 * Income vs expense per month as grouped columns. Tap a month to select it;
 * the selected month's exact values show below the plot (the mobile stand-in
 * for a hover tooltip), and a table view lists every value.
 */
export function TrendChart({ data, selectedMonth, onSelectMonth }: TrendChartProps) {
  const [showTable, setShowTable] = useState(false);
  const axisMax = niceAxisMax(Math.max(0, ...data.flatMap((d) => [d.income, d.expense])));
  const ticks = axisMax > 0 ? [axisMax, toPoisha(axisMax / 2), toPoisha(0)] : [toPoisha(0)];
  const selected = data.find((d) => d.month === selectedMonth);

  const heightFor = (amount: Poisha) => {
    if (axisMax === 0 || amount === 0) {
      return 0;
    }
    return Math.max(2, (amount / axisMax) * PLOT_HEIGHT);
  };

  return (
    <Card style={styles.card}>
      <View
        style={styles.legend}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants">
        {SERIES.map((series) => (
          <View key={series.key} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: series.color }]} />
            <AppText variant="caption" color="textSecondary">
              {t(series.labelKey)}
            </AppText>
          </View>
        ))}
      </View>

      <View style={styles.chart}>
        <View style={styles.axis}>
          {ticks.map((tick) => (
            <AppText key={tick} variant="caption" color="textMuted" style={styles.tickLabel}>
              {formatTakaCompact(tick)}
            </AppText>
          ))}
        </View>

        <View style={styles.plotArea}>
          <View style={styles.gridlines} pointerEvents="none">
            {ticks.map((tick) => (
              <View key={tick} style={styles.gridline} />
            ))}
          </View>

          <View style={styles.columns}>
            {data.map((d) => {
              const isSelected = d.month === selectedMonth;
              const label = t('reports.trendMonth', {
                month: formatMonthLabel(d.month),
                income: formatTaka(d.income),
                expense: formatTaka(d.expense),
              });
              return (
                <Pressable
                  key={d.month}
                  testID={`trend-${d.month}`}
                  onPress={() => onSelectMonth(d.month)}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  accessibilityState={{ selected: isSelected }}
                  hitSlop={4}
                  style={[styles.group, isSelected && styles.groupSelected]}>
                  <View style={styles.bars}>
                    {SERIES.map((series) => (
                      <View
                        key={series.key}
                        style={[
                          styles.bar,
                          { height: heightFor(d[series.key]), backgroundColor: series.color },
                        ]}
                      />
                    ))}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.monthLabels}>
        {data.map((d) => (
          <AppText
            key={d.month}
            variant="caption"
            color={d.month === selectedMonth ? 'text' : 'textSecondary'}
            style={[styles.monthLabel, d.month === selectedMonth && styles.monthLabelSelected]}>
            {shortMonth(d.month)}
          </AppText>
        ))}
      </View>

      {selected ? (
        <View style={styles.readout} testID="trend-readout">
          <AppText variant="label">{formatMonthLabel(selected.month)}</AppText>
          {SERIES.map((series) => (
            <View key={series.key} style={styles.legendItem}>
              <View style={[styles.swatch, { backgroundColor: series.color }]} />
              <AppText variant="caption" color="textSecondary">
                {`${t(series.labelKey)} ${formatTaka(selected[series.key])}`}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}

      <AppText variant="caption" color="textMuted">
        {t('reports.trendHint')}
      </AppText>

      <TextButton
        testID="toggle-trend-table"
        label={showTable ? t('reports.hideTable') : t('reports.showTable')}
        onPress={() => setShowTable((shown) => !shown)}
      />

      {showTable ? (
        <View style={styles.table} testID="trend-table">
          <View style={[styles.tableRow, styles.tableHeader]}>
            <AppText variant="caption" color="textSecondary" style={styles.tableMonth}>
              {t('reports.tableMonth')}
            </AppText>
            {(['reports.income', 'reports.expense', 'reports.net'] as const).map((key) => (
              <AppText key={key} variant="caption" color="textSecondary" style={styles.tableCell}>
                {t(key)}
              </AppText>
            ))}
          </View>
          {data.map((d) => (
            <View key={d.month} style={styles.tableRow}>
              <AppText variant="caption" style={styles.tableMonth}>
                {shortMonth(d.month)}
              </AppText>
              {[d.income, d.expense, d.net].map((value, index) => (
                <AppText key={index} variant="caption" style={styles.tableCell}>
                  {formatTaka(value, { decimals: 'auto' })}
                </AppText>
              ))}
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  chart: {
    flexDirection: 'row',
    height: PLOT_HEIGHT,
  },
  axis: {
    width: AXIS_WIDTH,
    justifyContent: 'space-between',
  },
  tickLabel: {
    // Centre each label on its gridline.
    marginVertical: -8,
  },
  plotArea: {
    flex: 1,
  },
  gridlines: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
  },
  gridline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  columns: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  group: {
    height: '100%',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  groupSelected: {
    backgroundColor: colors.primarySoft,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    // 2px surface gap between adjacent bars.
    gap: 2,
  },
  bar: {
    width: BAR_WIDTH,
    // 4px rounded data end, square at the baseline.
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  monthLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: AXIS_WIDTH,
  },
  monthLabel: {
    textAlign: 'center',
    minWidth: 32,
  },
  monthLabelSelected: {
    fontWeight: '600',
  },
  readout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: spacing.md,
    rowGap: spacing.xs,
  },
  table: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
  },
  tableHeader: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  tableMonth: {
    width: 44,
  },
  tableCell: {
    flex: 1,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
