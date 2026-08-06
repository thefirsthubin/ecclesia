import { swcJestConfig } from '../../../jest.preset.js';

export default {
  displayName: 'ui-web',
  preset: '../../../jest.preset.js',
  testEnvironment: 'jsdom',
  transform: { '^.+\\.[tj]sx?$': ['@swc/jest', swcJestConfig] },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../../coverage/libs/ui/web',
};
