import { swcJestConfig } from '../../../jest.preset.js';

export default {
  displayName: 'domain-gatherings',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: { '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig] },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/domain/gatherings',
};
