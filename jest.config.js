/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Mirror the tsconfig "@/*" path alias so imports resolve under Jest.
  // The more specific @/assets rule must come first.
  // First match wins — keep the .css stub above the "@/" alias so an import
  // like "@/global.css" is stubbed rather than resolved to the real file.
  moduleNameMapper: {
    '\\.css$': '<rootDir>/jest/cssMock.js',
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // jest-expo ships a sensible default; we extend it so the few ESM-only
  // node_modules this app uses are also transpiled.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|zustand|@supabase/.*))',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/lib/types/**',
  ],
};
