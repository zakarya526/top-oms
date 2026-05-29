// Global test setup, loaded via setupFilesAfterEnv.

// expo-secure-store is a native module with no JS fallback under Node. The
// sound store reads it on import (to hydrate the mute preference), so stub it
// here once for every test rather than in each file. Individual tests can still
// override these with jest.spyOn / mockResolvedValue.
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));
