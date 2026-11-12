import { useState } from 'react';
import { Alert, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  ListRow,
  SectionHeader,
  SegmentedControl,
  type SegmentOption,
} from '@/components/ui';
import { CURRENCIES } from '@/domain/currency';
import { formatMoney } from '@/domain/money';
import type { Profile, ThemePreference } from '@/domain/profile';
import { formatPhoneForDisplay } from '@/features/auth/identifier';
import type { AuthUser } from '@/features/auth/store';
import { t } from '@/i18n';
import { radius, spacing, createStyles } from '@/theme';

export interface SettingsViewProps {
  user: AuthUser;
  profile: Profile;
  appVersion: string;
  onOpenProfile: () => void;
  /** Saves the theme. Throws on failure. */
  onChangeTheme: (theme: ThemePreference) => Promise<void>;
  onChangePin: () => void;
  /** Throws on failure; the message is shown under the row. */
  onExport: () => Promise<void>;
  onDeleteAccount: () => void;
  /** Throws on failure. */
  onLogOut: () => Promise<void>;
}

const THEME_OPTIONS: readonly SegmentOption<ThemePreference>[] = [
  { value: 'system', label: t('settings.themeSystem') },
  { value: 'light', label: t('settings.themeLight') },
  { value: 'dark', label: t('settings.themeDark') },
];

/** Settings menu: account, preferences, data & privacy, help & about, log out. */
export function SettingsView({
  user,
  profile,
  appVersion,
  onOpenProfile,
  onChangeTheme,
  onChangePin,
  onExport,
  onDeleteAccount,
  onLogOut,
}: SettingsViewProps) {
  const styles = useStyles();
  const [message, setMessage] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const identity = user.email ?? (user.phone ? formatPhoneForDisplay(user.phone) : '');
  const name = profile.displayName ?? identity;
  const currency = CURRENCIES[profile.currency];

  const changeTheme = async (theme: ThemePreference) => {
    setMessage(null);
    try {
      await onChangeTheme(theme);
    } catch {
      setMessage(t('settings.themeError'));
    }
  };

  const exportCsv = async () => {
    setMessage(null);
    try {
      await onExport();
    } catch (error) {
      setMessage(
        error instanceof Error && error.message ? error.message : t('settings.export.error'),
      );
    }
  };

  const confirmLogOut = () => {
    Alert.alert(t('settings.logOutConfirmTitle'), t('settings.logOutConfirmMessage'), [
      { text: t('editTransaction.deleteCancel'), style: 'cancel' },
      {
        text: t('settings.logOut'),
        style: 'destructive',
        onPress: async () => {
          setMessage(null);
          setLoggingOut(true);
          try {
            await onLogOut();
          } catch {
            setMessage(t('settings.logOutError'));
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  return (
    <View>
      <Card style={styles.account}>
        <View style={styles.avatar}>
          <AppText variant="heading" style={styles.avatarText}>
            {name.slice(0, 1).toUpperCase()}
          </AppText>
        </View>
        <View style={styles.accountText}>
          <AppText variant="heading" numberOfLines={1} testID="account-name">
            {name}
          </AppText>
          {profile.displayName ? (
            <AppText color="textSecondary" numberOfLines={1} testID="signed-in-as">
              {identity}
            </AppText>
          ) : null}
        </View>
      </Card>

      <SectionHeader title={t('settings.sections.account')} />
      <Card style={styles.group}>
        <ListRow
          testID="open-profile"
          icon={{ ios: 'person.crop.circle', android: 'account_circle' }}
          label={t('settings.profile')}
          onPress={onOpenProfile}
        />
        <ListRow
          testID="change-pin"
          icon={{ ios: 'lock', android: 'lock' }}
          label={t('settings.changePin')}
          onPress={onChangePin}
        />
      </Card>

      <SectionHeader title={t('settings.sections.preferences')} />
      <Card style={styles.group}>
        <ListRow
          testID="row-currency"
          icon={{ ios: 'banknote', android: 'payments' }}
          label={t('settings.currency')}
          value={`${currency.code} (${currency.symbol})`}
          onPress={onOpenProfile}
        />
        <ListRow
          testID="row-opening-balance"
          icon={{ ios: 'wallet.pass', android: 'account_balance_wallet' }}
          label={t('settings.openingBalance')}
          value={formatMoney(profile.openingBalance, { decimals: 'auto' })}
          onPress={onOpenProfile}
        />
        <View style={styles.themeRow}>
          <AppText variant="label" style={styles.themeLabel}>
            {t('settings.theme')}
          </AppText>
          <SegmentedControl
            options={THEME_OPTIONS}
            value={profile.theme}
            onChange={(theme) => void changeTheme(theme)}
            accessibilityLabel={t('settings.theme')}
          />
        </View>
        <ListRow
          icon={{ ios: 'tag', android: 'sell' }}
          label={t('settings.categories')}
          caption={t('settings.comingSoon')}
        />
        <ListRow
          icon={{ ios: 'globe', android: 'language' }}
          label={t('settings.language')}
          value={t('settings.languageValue')}
          caption={t('settings.comingSoon')}
        />
      </Card>

      <SectionHeader title={t('settings.sections.data')} />
      <Card style={styles.group}>
        <ListRow
          testID="export-csv"
          icon={{ ios: 'square.and.arrow.up', android: 'download' }}
          label={t('settings.export')}
          onPress={() => void exportCsv()}
        />
        <ListRow
          testID="delete-account"
          icon={{ ios: 'trash', android: 'delete' }}
          label={t('settings.deleteAccount')}
          onPress={onDeleteAccount}
          destructive
        />
      </Card>
      <AppText variant="caption" color="textMuted" style={styles.note}>
        {t('settings.privacyNote')}
      </AppText>

      <SectionHeader title={t('settings.sections.help')} />
      <Card style={styles.group}>
        <ListRow
          icon={{ ios: 'info.circle', android: 'info' }}
          label={t('settings.version')}
          value={appVersion}
        />
      </Card>

      {message ? (
        <AppText color="danger" align="center" accessibilityRole="alert" style={styles.note}>
          {message}
        </AppText>
      ) : null}

      <View style={styles.logOut}>
        <Button
          testID="log-out"
          label={t('settings.logOut')}
          onPress={confirmLogOut}
          variant="danger"
          loading={loggingOut}
        />
      </View>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  themeRow: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  themeLabel: {
    marginLeft: spacing.xs,
  },
  account: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  avatarText: {
    color: colors.onPrimary,
  },
  accountText: {
    flex: 1,
  },
  group: {
    padding: 0,
    overflow: 'hidden',
  },
  note: {
    marginTop: spacing.sm,
  },
  logOut: {
    marginTop: spacing.xl,
  },
}));
