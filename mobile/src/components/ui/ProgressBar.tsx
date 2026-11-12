import { View } from 'react-native';

import { createStyles, radius, useColors } from '@/theme';

export interface ProgressBarProps {
  /** 0–100. Values outside the range are clamped. */
  percent: number;
  color?: string;
  accessibilityLabel: string;
}

/** Thin horizontal bar showing a share or progress. */
export function ProgressBar({ percent, color, accessibilityLabel }: ProgressBarProps) {
  const styles = useStyles();
  const colors = useColors();
  const fillColor = color ?? colors.primary;
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}>
      <View style={[styles.fill, { width: `${clamped}%`, backgroundColor: fillColor }]} />
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
}));
