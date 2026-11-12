// Global Jest mocks for native modules that have no JavaScript implementation in tests.

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

// Icons are decorative; render nothing so tests do not depend on native symbol rendering.
jest.mock('expo-symbols', () => ({ SymbolView: () => null }));

jest.mock('expo-crypto', () => ({ randomUUID: () => 'test-uuid' }));

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));
