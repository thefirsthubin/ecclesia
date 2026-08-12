const baseConfig = require('../eslint.config.cjs');

module.exports = [
  ...baseConfig,
  // `[infra project-boundary fix]` `cdk.out/` (generated CDK synth output,
  // gitignored - see `.gitignore`'s own `cdk.out/` comment) is infra-only,
  // so it isn't in the shared root config's `ignores` block above. A flat
  // config's top-level `ignores` entry makes ESLint skip these files
  // entirely during config resolution, before any parsing/type-aware
  // project setup happens - unlike `infra/project.json`'s own
  // `lintFilePatterns`, which only filters which *results* get reported
  // after ESLint has already tried to parse and type-check every
  // candidate file it discovered (confirmed by testing: a `lintFilePatterns`
  // negation alone silenced the resulting `@nx/enforce-module-boundaries`
  // errors but the underlying parse/type-check work on the excluded files
  // still ran and exhausted the Node heap).
  //
  // The pattern is `infra/cdk.out/**`, not `cdk.out/**` - `@nx/eslint`
  // invokes ESLint with the workspace root as its base path (the same
  // reason `infra/project.json`'s own `lintFilePatterns` is
  // `infra/**/*.ts`, not a bare `**/*.ts`), confirmed empirically: a bare
  // `cdk.out/**` pattern here matched nothing and left all 233
  // `@nx/enforce-module-boundaries` errors + the OOM crash unchanged.
  { ignores: ['infra/cdk.out/**'] },
];
