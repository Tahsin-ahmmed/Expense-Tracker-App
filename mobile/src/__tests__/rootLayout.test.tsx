import { Text } from 'react-native';
import { renderRouter, screen } from 'expo-router/testing-library';

import RootLayout from '@/app/_layout';

// Drive the real root layout with a fake auth state; screens are simple stand-ins.
const mockAuth = { status: 'signedOut' as 'signedOut' | 'signedIn' };

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(undefined),
  hideAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/features/auth/clearDataOnAccountChange', () => ({
  clearDataOnAccountChange: () => () => {},
}));

jest.mock('@/features/auth/instance', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ status: mockAuth.status, initialize: async () => {} }),
}));

jest.mock('@/features/profile/useProfileStore', () => ({
  useProfileStore: (selector: (state: unknown) => unknown) =>
    selector({ status: 'ready', load: async () => {} }),
}));

const Named = (name: string) =>
  function Stub() {
    return <Text>{name}</Text>;
  };

const routes = {
  _layout: RootLayout,
  '(tabs)/_layout': { default: require('expo-router').Slot },
  '(tabs)/index': Named('Dashboard'),
  '(auth)/_layout': { default: require('expo-router').Slot },
  '(auth)/sign-in': Named('Log in'),
  '(auth)/sign-up': Named('Create account'),
  'add-transaction': Named('Add'),
  'edit-transaction/[id]': Named('Edit'),
  'edit-budget/[scope]': Named('Budget'),
  'settings/profile': Named('Profile'),
  'settings/delete-account': Named('Delete'),
  welcome: Named('Welcome'),
  'reset-pin': Named('Reset PIN'),
};

describe('root layout routing', () => {
  it('sends a signed-out user opening the app home (fresh install) to Log in', async () => {
    mockAuth.status = 'signedOut';
    await renderRouter(routes, { initialUrl: '/' });

    expect(screen).toHavePathname('/sign-in');
    expect(screen.getByText('Log in')).toBeOnTheScreen();
    expect(screen.queryByText('Unmatched Route')).toBeNull();
  });

  it('sends a signed-in user to the dashboard, not the sign-in screen', async () => {
    mockAuth.status = 'signedIn';
    await renderRouter(routes, { initialUrl: '/sign-in' });

    expect(screen).toHavePathname('/');
    expect(screen.getByText('Dashboard')).toBeOnTheScreen();
  });
});
