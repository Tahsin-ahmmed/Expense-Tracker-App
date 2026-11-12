import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Card } from '@/components/ui';
import { formatTaka, type Poisha } from '@/domain/money';
import { t } from '@/i18n';
import { colors, radius, spacing } from '@/theme';

export interface RankedBarItem {
  key: string;
  label: string;
  amount: Poisha;
  sharePercent: number;
  /** Identity marker beside the name (e.g. category icon); the bar itself stays one hue. */
  leading?: ReactNode;
}

export interface RankedBarsProps {
  /** Largest first. */
  items: readonly RankedBarItem[];
  emptyText: string;
}

/**
 * Ranked horizontal bars in one hue (a "meter list"): name and amount on
 * one line, a bar scaled to the largest item below. Bars share one baseline,
 * so parts compare more exactly than in a pie or donut.
 */
export function RankedBars({ items, emptyText }: RankedBarsProps) {
  if (items.length === 0) {
    return (
      <Card>
        <AppText color="textSecondary">{emptyText}</AppText>
      </Card>
    );
  }

  const largest = Math.max(...items.map((item) => item.amount));

  return (
    <Card style={styles.list}>
      {items.map((item) => {
        const amount = formatTaka(item.amount);
        const share = t('reports.shareOfSpending', { percent: item.sharePercent });
        const width = largest > 0 ? (item.amount / largest) * 100 : 0;
        return (
          <View
            key={item.key}
            style={styles.row}
            accessible
            accessibilityLabel={`${item.label}, ${amount}, ${share}`}
            testID={`ranked-${item.key}`}>
            <View style={styles.line}>
              {item.leading}
              <AppText variant="label" numberOfLines={1} style={styles.name}>
                {item.label}
              </AppText>
              <AppText variant="label">{amount}</AppText>
            </View>
            <View style={styles.line}>
              <View style={styles.barTrack}>
                <View style={[styles.bar, { width: `${Math.max(width, 1)}%` }]} />
              </View>
              <AppText variant="caption" color="textSecondary" style={styles.percent}>
                {`${item.sharePercent}%`}
              </AppText>
            </View>
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.lg,
  },
  row: {
    gap: spacing.xs,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    flex: 1,
  },
  barTrack: {
    flex: 1,
    height: 8,
  },
  bar: {
    height: 8,
    // Square at the baseline (left), 4px rounded at the data end.
    borderTopRightRadius: radius.sm / 2,
    borderBottomRightRadius: radius.sm / 2,
    backgroundColor: colors.primary,
  },
  percent: {
    minWidth: 36,
    textAlign: 'right',
  },
});
