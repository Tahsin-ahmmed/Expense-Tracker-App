// Global Jest mocks for native modules that have no JavaScript implementation in tests.

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

// Icons are decorative; render nothing so tests do not depend on native symbol rendering.
jest.mock('expo-symbols', () => ({ SymbolView: () => null }));

// The real module opens a native SQLite database. Unit tests use fake repositories instead.
jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));

jest.mock('expo-crypto', () => ({ randomUUID: () => 'test-uuid' }));
