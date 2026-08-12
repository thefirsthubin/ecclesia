import { swcJestConfig } from '../jest.preset.js';

/**
 * `[infra project-boundary fix]` `@nx/jest/preset`'s own `testMatch`
 * (`**\/?(*.)+(spec|test).[jt]s?(x)`) has no directory scoping and no
 * `testPathIgnorePatterns` beyond Jest's own default (`/node_modules/`) -
 * so without an explicit exclusion here, Jest happily discovers and runs
 * every `.spec.ts` inside `infra/cdk.out/asset.<hash>/**`, the Lambda-
 * bundling asset copies `cdk synth`/`cdk.out`-producing test runs write to
 * disk (full copies of `apps/mobile`/`apps/web-admin`/`libs/*` source,
 * `tsconfig.json` included - see `.gitignore`'s own `cdk.out/` comment for
 * the sibling problem this already caused for Nx's project-graph
 * discovery). Those copies have no JSX/DOM-aware transform in this
 * project's own Node-only jest config, so they fail with `SyntaxError:
 * Cannot use import statement outside a module` - a `cdk.out` artifact
 * problem, not a real regression in the projects being copied. `.gitignore`
 * excluding `cdk.out/` does not help here: Jest's `testMatch`/
 * `testPathIgnorePatterns` never consult `.gitignore`, unlike Nx's own
 * project-graph file-walker.
 */
export default {
  displayName: 'infra',
  preset: '../jest.preset.js',
  testEnvironment: 'node',
  transform: { '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig] },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../coverage/infra',
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/cdk.out/'],
};
