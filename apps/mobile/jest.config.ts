/**
 * React Native's Jest integration needs its own preset (transforms JSX
 * and RN's own ESM-ish node_modules correctly) rather than the plain
 * root jest.preset.js used by the API/Worker/web-admin projects - this is
 * a deliberate divergence, not an inconsistency, driven by how the RN
 * ecosystem ships its packages.
 */
export default {
  displayName: 'mobile',
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation)/)',
  ],
  coverageDirectory: '../../coverage/apps/mobile',
};
