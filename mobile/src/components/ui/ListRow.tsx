import { Pressable, View } from 'react-native';

import { radius, spacing, createStyles } from '@/theme';

import { AppText } from './AppText';
import { Icon, type IconProps } from './Icon';

export interface ListRowProps {
  icon: IconProps['name'];
  label: string;
  /** Current value shown on the right, e.g. "BDT". */
  value?: string;
  /** Small text under the label, e.g. "Coming soon". */
  caption?: string;
  onPress?: () => void;
  /** Red text for destructive actions such as "Delete account". */
  destructive?: boolean;
  testID?: string;
}

/** A tappable settings-style row: icon, label, optional value and chevron. */
export function ListRow({
  icon,
  label,
  value,
  caption,
  onPress,
  destructive = false,
  testID,
}: ListRowProps) {
  const styles = useStyles();
  const disabled = !onPress;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={disabled ? undefined : 'button'}
      accessibilityLabel={[label, value, caption].filter(Boolean).join(', ')}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.iconBox, destructive && styles.iconBoxDanger]}>
        <Icon
          name={icon}
          size={20}
          color={destructive ? 'danger' : disabled ? 'textMuted' : 'primary'}
        />
      </View>
      <View style={styles.text}>
        <AppText
          variant="label"
          color={destructive ? 'danger' : disabled ? 'textSecondary' : 'text'}
          numberOfLines={1}>
          {label}
        </AppText>
        {caption ? (
          <AppText variant="caption" color="textMuted">
            {caption}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="label" color="textSecondary" numberOfLines={1} style={styles.value}>
          {value}
        </AppText>
      ) : null}
      {disabled ? null : (
        <Icon
          name={{ ios: 'chevron.right', android: 'chevron_right' }}
          size={18}
          color="textMuted"
        />
      )}
    </Pressable>
  );
}

const useStyles = createStyles((colors) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  iconBox: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
  },
  iconBoxDanger: {
    backgroundColor: colors.dangerSoft,
  },
  text: {
    flex: 1,
  },
  value: {
    maxWidth: '45%',
  },
}));
