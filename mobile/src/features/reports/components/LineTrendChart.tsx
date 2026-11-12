import { useState } from 'react';
import { StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { AppText, Card, Chip, Icon, TextButton } from '@/components/ui';
import { formatMoney, formatMoneyCompact, toMinor, type MinorAmount } from '@/domain/money';
import { t, type TranslationKey } from '@/i18n';
import { radius, spacing, createStyles, useColors, type ColorToken } from '@/theme';

import { pointLabel, TREND_RANGES, type TrendRange, type TrendSeries } from '../series';
import { niceAxisMax } from '../axis';

export interface LineTrendChartProps {
  series: TrendSeries;
  onChangeRange: (range: TrendRange) => void;
  /** Month names (January…), for axis labels. */
  monthNames: string[];
}

const CHART_HEIGHT = 180;
const AXIS_WIDTH = 52;
const TOP_PAD = 8;
const BOTTOM_PAD = 4;
const LABEL_COUNT = 5;

/** Income and expense lines, validated together for colour-blind separation and contrast. */
const SERIES = [
  {
    key: 'income',
    labelKey: 'reports.income',
    tooltipKey: 'reports.tooltipIncome',
    color: 'income',
  },
  {
    key: 'expense',
    labelKey: 'reports.expense',
    tooltipKey: 'reports.tooltipExpense',
    color: 'expense',
  },
] as const satisfies readonly {
  key: 'income' | 'expense';
  labelKey: TranslationKey;
  tooltipKey: TranslationKey;
  color: ColorToken;
}[];

const AVERAGE_LABEL: Record<TrendSeries['granularity'], TranslationKey> = {
  day: 'reports.avgExpense.day',
  week: 'reports.avgExpense.week',
  month: 'reports.avgExpense.month',
};

/** "▲ ৳230 more than the previous 6 months": arrow + words, so colour is never the only cue. */
function describeAverageChange(series: TrendSeries): { text: string; good: boolean | null } {
  const period = t(`reports.period.${series.range}`);
  if (series.previousAverageExpense === null) {
    return { text: t('reports.avgNoPrevious', { period }), good: null };
  }
  const diff = series.averageExpense - series.previousAverageExpense;
  if (diff === 0) {
    return { text: t('reports.avgSame', { period }), good: null };
  }
  const amount = formatMoney(toMinor(Math.abs(diff)), { decimals: 'auto' });
  return diff > 0
    ? { text: t('reports.avgMore', { amount, period }), good: false }
    : { text: t('reports.avgLess', { amount, period }), good: true };
}

/**
 * Income vs expense as two thin lines with a touch crosshair and tooltip,
 * a headline average with its change, range buttons, and a table view.
 */
export function LineTrendChart({ series, onChangeRange, monthNames }: LineTrendChartProps) {
  const styles = useStyles();
  const colors = useColors();
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const { points, granularity } = series;
  const axisMax = niceAxisMax(Math.max(0, ...points.flatMap((p) => [p.income, p.expense])));
  const plotWidth = Math.max(0, width - AXIS_WIDTH);
  const plotHeight = CHART_HEIGHT - TOP_PAD - BOTTOM_PAD;
  const step = points.length > 1 ? plotWidth / (points.length - 1) : 0;

  const x = (index: number) => AXIS_WIDTH + index * step;
  const y = (amount: MinorAmount) =>
    TOP_PAD + (axisMax > 0 ? plotHeight - (amount / axisMax) * plotHeight : plotHeight);

  const pathFor = (key: 'income' | 'expense') =>
    points
      .map(
        (point, index) =>
          `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)},${y(point[key]).toFixed(1)}`,
      )
      .join(' ');

  const ticks = axisMax > 0 ? [axisMax, toMinor(axisMax / 2), toMinor(0)] : [toMinor(0)];

  const indexAt = (event: GestureResponderEvent) => {
    if (step === 0) return 0;
    const raw = Math.round((event.nativeEvent.locationX - AXIS_WIDTH) / step);
    return Math.min(points.length - 1, Math.max(0, raw));
  };

  const labelIndexes = Array.from(
    new Set(
      Array.from({ length: LABEL_COUNT }, (_, i) =>
        Math.round((i * (points.length - 1)) / (LABEL_COUNT - 1)),
      ),
    ),
  );

  const change = describeAverageChange(series);
  const maxPoint = points.reduce((best, p) => (p.expense > best.expense ? p : best), points[0]);
  const summary = t('reports.chartSummary', {
    range: series.range,
    average: formatMoney(series.averageExpense),
    max: formatMoney(maxPoint.expense),
    maxLabel: pointLabel(maxPoint, granularity, monthNames),
  });
  const activePoint = active === null ? null : points[active];

  return (
    <Card style={styles.card}>
      <View>
        <AppText variant="caption" color="textSecondary">
          {t(AVERAGE_LABEL[granularity])}
        </AppText>
        <AppText variant="title" testID="trend-average" numberOfLines={1} adjustsFontSizeToFit>
          {formatMoney(series.averageExpense)}
        </AppText>
        <View style={styles.changeRow}>
          {change.good !== null ? (
            <Icon
              name={
                change.good
                  ? { ios: 'arrow.down.right', android: 'south_east' }
                  : { ios: 'arrow.up.right', android: 'north_east' }
              }
              size={14}
              color={change.good ? 'income' : 'danger'}
            />
          ) : null}
          <AppText
            variant="caption"
            color={change.good === null ? 'textSecondary' : change.good ? 'income' : 'danger'}
            testID="trend-change">
            {change.text}
          </AppText>
        </View>
      </View>

      <View
        style={styles.legend}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants">
        {SERIES.map((s) => (
          <View key={s.key} style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: colors[s.color] }]} />
            <AppText variant="caption" color="textSecondary">
              {t(s.labelKey)}
            </AppText>
          </View>
        ))}
      </View>

      <View
        style={styles.chart}
        onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
        accessible
        accessibilityLabel={summary}
        testID="line-chart"
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event) => setActive(indexAt(event))}
        onResponderMove={(event) => setActive(indexAt(event))}
        onResponderTerminationRequest={() => true}>
        {width > 0 ? (
          <Svg width={width} height={CHART_HEIGHT}>
            {ticks.map((tick) => (
              <Line
                key={`grid-${tick}`}
                x1={AXIS_WIDTH}
                x2={width}
                y1={y(tick)}
                y2={y(tick)}
                stroke={colors.border}
                strokeWidth={1}
              />
            ))}
            {activePoint !== null && active !== null ? (
              <Line
                x1={x(active)}
                x2={x(active)}
                y1={TOP_PAD}
                y2={CHART_HEIGHT - BOTTOM_PAD}
                stroke={colors.textMuted}
                strokeWidth={1}
              />
            ) : null}
            {SERIES.map((s) => (
              <Path
                key={s.key}
                d={pathFor(s.key)}
                stroke={colors[s.color]}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                fill="none"
              />
            ))}
            {activePoint !== null && active !== null
              ? SERIES.map((s) => (
                  <Circle
                    key={`dot-${s.key}`}
                    cx={x(active)}
                    cy={y(activePoint[s.key])}
                    r={5}
                    fill={colors[s.color]}
                    stroke={colors.surface}
                    strokeWidth={2}
                  />
                ))
              : null}
          </Svg>
        ) : null}

        {/* Y-axis labels: compact, in text colours (never the series colour). */}
        <View style={styles.axisLabels} pointerEvents="none">
          {ticks.map((tick) => (
            <AppText
              key={`tick-${tick}`}
              variant="caption"
              color="textMuted"
              style={[styles.tickLabel, { top: y(tick) - 8 }]}>
              {formatMoneyCompact(tick)}
            </AppText>
          ))}
        </View>

        {activePoint !== null && active !== null && width > 0 ? (
          <View
            pointerEvents="none"
            testID="trend-tooltip"
            style={[
              styles.tooltip,
              x(active) > width / 2
                ? { right: width - x(active) + spacing.sm }
                : { left: x(active) + spacing.sm },
            ]}>
            <AppText variant="caption" color="textSecondary">
              {pointLabel(activePoint, granularity, monthNames)}
            </AppText>
            {SERIES.map((s) => (
              <View key={s.key} style={styles.legendItem}>
                <View style={[styles.swatch, { backgroundColor: colors[s.color] }]} />
                <AppText variant="caption">
                  {t(s.tooltipKey, { amount: formatMoney(activePoint[s.key]) })}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={[styles.xLabels, { marginLeft: AXIS_WIDTH }]}>
        {labelIndexes.map((index) => (
          <AppText key={index} variant="caption" color="textMuted">
            {pointLabel(points[index], granularity, monthNames)}
          </AppText>
        ))}
      </View>

      <View
        style={styles.ranges}
        accessibilityRole="radiogroup"
        accessibilityLabel={t('reports.range')}>
        {TREND_RANGES.map((range) => (
          <Chip
            key={range}
            testID={`range-${range}`}
            label={range}
            selected={series.range === range}
            onPress={() => {
              setActive(null);
              onChangeRange(range);
            }}
          />
        ))}
      </View>

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
            <AppText variant="caption" color="textSecondary" style={styles.tableLabel}>
              {t('reports.tableMonth')}
            </AppText>
            {SERIES.map((s) => (
              <AppText key={s.key} variant="caption" color="textSecondary" style={styles.tableCell}>
                {t(s.labelKey)}
              </AppText>
            ))}
          </View>
          {points.map((point) => (
            <View key={point.start} style={styles.tableRow}>
              <AppText variant="caption" style={styles.tableLabel}>
                {pointLabel(point, granularity, monthNames)}
              </AppText>
              {SERIES.map((s) => (
                <AppText key={s.key} variant="caption" style={styles.tableCell}>
                  {formatMoney(point[s.key], { decimals: 'auto' })}
                </AppText>
              ))}
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const useStyles = createStyles((colors) => ({
  card: {
    gap: spacing.md,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
  legendLine: {
    width: 14,
    height: 2,
    borderRadius: 1,
  },
  swatch: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chart: {
    height: CHART_HEIGHT,
  },
  axisLabels: {
    ...StyleSheet.absoluteFill,
    width: AXIS_WIDTH,
  },
  tickLabel: {
    position: 'absolute',
    left: 0,
  },
  tooltip: {
    position: 'absolute',
    top: TOP_PAD,
    gap: 2,
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  xLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ranges: {
    flexDirection: 'row',
    gap: spacing.sm,
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
  tableLabel: {
    width: 64,
  },
  tableCell: {
    flex: 1,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
}));
