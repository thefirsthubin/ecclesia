const nxPreset = require('@nx/jest/preset').default;

/**
 * Shared @swc/jest transform config consumed by every non-mobile project's
 * jest.config.ts (Sprint 0 repair, see docs/engineering-principles.md
 * "Architecture Before Convenience" - one source of truth for the SWC
 * target instead of each project guessing).
 *
 * `jsc.target` is pinned explicitly to "es2022" (matching
 * tsconfig.base.json's `compilerOptions.target`) instead of being left for
 * @swc/jest to auto-detect from the running Node version. Auto-detection is
 * what produced the "Unknown ES version: es2023" failure: newer @swc/jest
 * releases map the host Node version to an ES target string, and the
 * installed @swc/core release did not recognise "es2023" as a valid value.
 * Pinning the target removes the guesswork entirely rather than papering
 * over the symptom.
 *
 * `swcrc: false` means this object is the *complete* config handed to swc
 * for test transforms - it will not also merge with the root `.swcrc`
 * (which exists separately for @nx/webpack's swc compiler, used by the
 * web-admin production build). Two independent, explicit configs is
 * simpler to reason about than one implicit merge.
 *
 * Decorator support (`decorators`, `legacyDecorator`, `decoratorMetadata`)
 * is enabled workspace-wide because `tsconfig.base.json` sets
 * `experimentalDecorators`/`emitDecoratorMetadata: true` for NestJS
 * (Blueprint ADR-001) - every project's test transform must honour that,
 * not just apps/api.
 */
const swcJestConfig = {
  jsc: {
    target: 'es2022',
    parser: {
      syntax: 'typescript',
      tsx: true,
      decorators: true,
      dynamicImport: true,
    },
    transform: {
      legacyDecorator: true,
      decoratorMetadata: true,
      react: {
        // web-admin's components use the modern automatic JSX runtime (no
        // manual `import React from 'react'` in every file, per React
        // 18 convention). Without this, swc defaults to the classic
        // runtime, which compiles JSX to bare `React.createElement(...)`
        // calls and fails at test time with "ReferenceError: React is not
        // defined".
        runtime: 'automatic',
      },
    },
    keepClassNames: true,
    // externalHelpers is deliberately NOT enabled: it requires @swc/helpers
    // to be resolvable at runtime from every transformed file, which broke
    // web-admin's production build ("Can't resolve
    // '@swc/helpers/_/_interop_require_wildcard'") because that package was
    // never added as a dependency. Inlining helpers (the default) is a
    // negligible size cost at this scale and needs no extra dependency.
  },
  module: {
    type: 'commonjs',
  },
  sourceMaps: true,
  swcrc: false,
};

/**
 * Shared Jest preset consumed by every project's jest.config.ts (Blueprint
 * Ch.7 §14.2). Keeping this at the root means a change to coverage
 * thresholds or module-name mapping is a one-file change, not a per-project
 * edit across a growing number of libraries and apps.
 */
module.exports = { ...nxPreset, swcJestConfig };
