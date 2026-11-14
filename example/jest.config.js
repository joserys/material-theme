module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  moduleNameMapper: { '\\.(ttf|otf)$': '<rootDir>/font-stub.js' },
  // The theme package ships TypeScript source, so Jest transforms it like the app's own code
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native-vector-icons|@helloworldstudio|@material|react-native-reanimated|react-native-worklets|react-native-safe-area-context)/)',
  ],
};
