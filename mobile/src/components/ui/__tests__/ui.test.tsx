import { render, screen } from '@testing-library/react-native';

import { EmptyState } from '../EmptyState';
import { Screen } from '../Screen';

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { SafeAreaView: View };
});

describe('EmptyState', () => {
  it('shows the title and message', async () => {
    await render(<EmptyState title="No transactions yet" message="Add one to get started." />);

    expect(screen.getByText('No transactions yet')).toBeOnTheScreen();
    expect(screen.getByText('Add one to get started.')).toBeOnTheScreen();
  });
});

describe('Screen', () => {
  it('renders the title as an accessible header with its content', async () => {
    await render(
      <Screen title="Dashboard">
        <EmptyState title="Empty" message="Nothing here" />
      </Screen>,
    );

    expect(screen.getByRole('header', { name: 'Dashboard' })).toBeOnTheScreen();
    expect(screen.getByText('Nothing here')).toBeOnTheScreen();
  });
});
