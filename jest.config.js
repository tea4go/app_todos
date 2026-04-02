module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|react-clone-referenced-element|@react-native-community|expo|@expo|@unimodules|unimodules|@react-navigation|uuid|@react-native-async-storage)',
  ],
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
};
