import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, spacing, type ColorToken } from '@/theme';

/** Whether a change is good or bad news for the user (decides the delta colour). */
export type DeltaTone = 'good' | 'bad' | 'neutral';

const TONE_COLOR: Record<DeltaTone, ColorToken> = {
  good: 'income',
  bad: 'danger',
  neutral: 'textSecondary',
};

export interface StatTileProps {
  label: string;
  value: string;
  /** e.g. "▲ 12% vs Oct". The arrow carries direction, so colour is never the only cue. */
  delta?: string;
  deltaTone?: DeltaTone;
  testID?: string;
}

/** A headline number with an optional change vs the previous period. */
export function StatTile({ label, value, delta, deltaTone = 'neutral', testID }: StatTileProps) {
  return (
    <View
      style={styles.tile}
      accessible
      accessibilityLabel={[label, value, delta].filter(Boolean).join(', ')}
      testID={testID}>
      <AppText variant="caption" color="textSecondary">
        {label}
      </AppText>
      <AppText variant="heading" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
      {delta ? (
        <AppText variant="caption" color={TONE_COLOR[deltaTone]} numberOfLines={1}>
          {delta}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: 2,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
