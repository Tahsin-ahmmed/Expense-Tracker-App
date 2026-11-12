import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { AppText, Chip, Icon } from '@/components/ui';
import { addDays, fromPickerDate, isIsoDate, toPickerDate, type IsoDate } from '@/domain/date';
import { t } from '@/i18n';
import { formatDateLabel } from '@/i18n/format';
import { colors, spacing } from '@/theme';

export interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: IsoDate) => void;
  today: IsoDate;
  error?: string;
}

/** Date choice: quick "Today" / "Yesterday" chips plus the native date picker. */
export function DateField({ label, value, onChange, today, error }: DateFieldProps) {
  const [showIosPicker, setShowIosPicker] = useState(false);
  const yesterday = addDays(today, -1);
  const isOther = isIsoDate(value) && value !== today && value !== yesterday;
  const current = isIsoDate(value) ? value : today;

  const openPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        mode: 'date',
        value: toPickerDate(current),
        maximumDate: toPickerDate(today),
        onChange: (event, date) => {
          if (event.type === 'set' && date) {
            onChange(fromPickerDate(date));
          }
        },
      });
    } else {
      setShowIosPicker((visible) => !visible);
    }
  };

  return (
    <View>
      <AppText variant="label" color="textSecondary" style={styles.label}>
        {label}
      </AppText>
      <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={label}>
        <Chip
          label={t('common.today')}
          selected={value === today}
          onPress={() => onChange(today)}
        />
        <Chip
          label={t('common.yesterday')}
          selected={value === yesterday}
          onPress={() => onChange(yesterday)}
        />
        <Chip
          label={isOther ? formatDateLabel(current, today) : t('addTransaction.pickDate')}
          selected={isOther}
          onPress={openPicker}
          testID="pick-date"
          leading={
            <Icon
              name={{ ios: 'calendar', android: 'calendar_today' }}
              size={16}
              color={isOther ? colors.onPrimary : colors.textSecondary}
            />
          }
        />
      </View>
      {Platform.OS === 'ios' && showIosPicker ? (
        <DateTimePicker
          mode="date"
          display="inline"
          value={toPickerDate(current)}
          maximumDate={toPickerDate(today)}
          onChange={(event, date) => {
            if (event.type === 'set' && date) {
              onChange(fromPickerDate(date));
            }
          }}
        />
      ) : null}
      {error ? (
        <AppText variant="caption" color="danger" style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  error: {
    marginTop: spacing.xs,
  },
});
