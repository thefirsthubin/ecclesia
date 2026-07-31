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
 */
export default {
  displayName: 'mobile',
  resolver: '@nx/jest/plugins/resolver',
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  transformIgnorePatterns: [],
  coverageDirectory: '../../coverage/apps/mobile',
};
