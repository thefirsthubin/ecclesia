/**
 * `libs/ui/native` is the first *library* (as opposed to `apps/mobile`
 * itself) that needs the React Native Jest preset - every reasoning
 * behind these exact settings is inherited from
 * `apps/mobile/jest.config.ts` (Sprint 0's own hard-won fix, see that
 * file's extensive doc comment for the full pnpm/Flow-syntax story) and
 * is not re-litigated here:
 *
 * - `resolver: '@nx/jest/plugins/resolver'` for pnpm's nested node_modules layout.
 * - `transformIgnorePatterns: []` because an unanchored default RN pattern
 *   incorrectly excludes pnpm's `.pnpm/`-nested React Native internals.
 * - No custom `transform` override, for the same Flow-syntax-in-RN-polyfills reason.
 * - Also requires its own `babel.config.js` alongside this file (Babel
 *   resolves config from the nearest ancestor with a package.json, and
 *   this lib has its own since it's an Nx buildable-lib dependency - it
 *   won't find `apps/mobile/babel.config.js`, that's a different subtree).
 * - `moduleNameMapper` for `lucide-react-native`: same reasoning as
 *   `apps/mobile/jest.config.ts` - that package's `exports` map points
 *   Jest's RN-aware resolution at its ESM build, which the RN preset's
 *   transform never matches (`.mjs` isn't in its transform regex), so
 *   this redirects to the package's own CJS build via a literal
 *   filesystem path (bypassing `exports` resolution, since only ".",
 *   "./icons", and "./icons/*" are declared as importable subpaths).
 */
export default {
  displayName: 'ui-native',
  resolver: '@nx/jest/plugins/resolver',
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  transformIgnorePatterns: [],
  moduleNameMapper: {
    '^lucide-react-native$':
      '<rootDir>/../../../node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
  },
  coverageDirectory: '../../../coverage/libs/ui/native',
};
