/**
 * apps/mobile does not use @swc/jest (see jest.preset.js) - React Native's
 * own Metro/Babel toolchain, provided by the `react-native` Jest preset,
 * is the correct transform for RN code and its node_modules dependencies.
 *
 * `resolver` is overridden because the plain `react-native` preset assumes
 * a single top-level node_modules next to the project, which does not hold
 * once the project lives under apps/mobile inside a pnpm workspace;
 * `@nx/jest/plugins/resolver` is Nx's first-party fix for that.
 *
 * IMPORTANT: do not override `transform` here. React Native ships internal
 * polyfills (e.g. @react-native/js-polyfills) written in Flow, and the
 * preset's default transform already knows how to strip Flow syntax from
 * those files via @react-native/babel-preset. A prior repair attempt
 * replaced `transform` with a plain `babel-jest` + custom `configFile`
 * mapping and broke exactly that.
 *
 * `transformIgnorePatterns: []` (transform everything, including
 * node_modules) instead of the "standard" RN pattern
 * `node_modules/(?!(react-native|@react-native|...)/)`. That pattern only
 * works with npm/yarn's flat node_modules. Under pnpm, RN's own internals
 * resolve through node_modules/.pnpm/@react-native+js-polyfills@X/
 * node_modules/@react-native/js-polyfills/... - an unanchored regex tests
 * true at the FIRST "node_modules/" it finds (before ".pnpm/"), which is
 * not followed by "react-native/" etc., so the negative lookahead
 * incorrectly succeeds and the file gets wrongly excluded from
 * transformation. That is exactly what produced "SyntaxError: Unexpected
 * identifier 'ErrorHandler'" when Jest tried to run error-guard.js's Flow
 * syntax untransformed. This is a well-known pnpm + Jest + React Native
 * interaction, not something a smarter regex reliably fixes given pnpm's
 * package-name-to-directory encoding (scoped packages become
 * "@scope+name@version"). Transforming everything is the standard
 * workaround and is cheap at this project's current size.
 *
 * `moduleNameMapper` for `lucide-react-native`: that package's own
 * package.json declares an `exports` map where the `"react-native"`
 * condition (which Jest's RN-aware resolution honors, matching what
 * Metro does for the real app bundle) points at
 * `dist/esm/lucide-react-native.mjs` - raw ESM `export` syntax, which
 * Jest's CJS-style runtime cannot execute even with
 * `transformIgnorePatterns: []`, because the `.mjs` extension never
 * matches the RN preset's `transform` regex (`\.[jt]sx?$`) in the first
 * place - no transformer ever runs on it, so it's not a
 * transformIgnorePatterns problem at all. The package's `exports` map
 * only declares ".", "./icons", and "./icons/*" as importable subpaths
 * (confirmed from the installed package.json - no other deep path is
 * exported), so a bare-specifier redirect to a `dist/cjs/...` subpath
 * would itself be rejected by Node's exports enforcement. Redirecting
 * via a literal `<rootDir>`-relative filesystem path, as below, bypasses
 * `exports` resolution entirely (Jest treats a path value as a direct
 * file reference, not a specifier to re-resolve) and lands on the CJS
 * build the package publishes for exactly this "require" case.
 */
export default {
  displayName: 'mobile',
  resolver: '@nx/jest/plugins/resolver',
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  transformIgnorePatterns: [],
  moduleNameMapper: {
    '^lucide-react-native$':
      '<rootDir>/../../node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
  },
  coverageDirectory: '../../coverage/apps/mobile',
  // `[Bug fix, Mobile Personas sprint]` Jest's default 5000ms per-test
  // timeout was already marginal for this project (RN's Metro/Babel
  // transform - deliberately not swapped for @swc/jest, see the doc
  // comment above - is CPU-heavy relative to the rest of this
  // monorepo's @swc/jest-based projects). This sprint added nine new
  // screens (Ministry Leader/Finance Officer/Resident Pastor), each
  // mounting several `Skeleton`-driven loading states via
  // `CardAsyncBoundary`, which meaningfully increased this project's
  // total async-test surface. A real `pnpm test` run (18 projects'
  // worth of Jest workers contending for the same CPU cores, unlike
  // this sandbox's serial `--runInBand` runs) showed 11 tests across 9
  // suites failing with "Exceeded timeout of 5000 ms" - the same tests
  // pass in 1-2s when run in isolation, confirming this is CPU
  // contention under real parallel load, not a hang or a logic bug.
  // 20000ms gives real headroom without masking an actual hang (a
  // genuinely broken `waitFor` would still fail this comfortably).
  testTimeout: 20000,
};
