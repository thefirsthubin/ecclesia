import { swcJestConfig } from '../../../jest.preset.js';

export default {
  displayName: 'ui-tokens',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: { '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig] },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/ui/tokens',
};
