import { swcJestConfig } from '../../../jest.preset.js';

export default {
  displayName: 'domain-insights',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: { '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig] },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/domain/insights',
};
