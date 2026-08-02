// @ts-check
const nxEslintPlugin = require('@nx/eslint-plugin');
const eslintConfigPrettier = require('eslint-config-prettier');
const tseslint = require('typescript-eslint');

/**
 * Root ESLint flat config for the Ecclesia monorepo.
 *
 * This file is `.cjs`, not `.mjs` (Sprint 0 repair). @nx/eslint:lint's
 * auto-discovery of a project's nearest flat config did not recognise the
 * `.mjs` extension in the installed Nx 20.1.0 release, reporting "No
 * ESLint configuration found" even though eslint.config.mjs existed at
 * exactly the directory it was checking. `.cjs` is unambiguous CommonJS
 * regardless of the workspace's package.json `type` field and is reliably
 * discovered.
 *
 * Two concerns are enforced here, both traced directly to the Technical
 * Blueprint (PTB v2.0):
 *
 *   1. General TypeScript code-quality rules (Blueprint Ch.7 §14.1) -
 *      strict typing, no unchecked `any`, consistent import style.
 *
 *   2. Module-boundary enforcement between bounded contexts (Blueprint
 *      Ch.1 §4.3 and Ch.4 §5). Each library/app is tagged by scope; the
 *      `depConstraints` below encode exactly which scopes may depend on
 *      which, so a violation fails `nx lint` in CI rather than surviving
 *      as a code-review-only convention.
 *
 * Tags referenced below (`scope:*`) are assigned per-project in each
 * project's `project.json` `tags` array.
 */
module.exports = tseslint.config(
  {
    ignores: ['**/dist', '**/node_modules', '**/.nx', 'coverage/**'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [...tseslint.configs.recommended],
    plugins: {
      '@nx': nxEslintPlugin,
    },
    // Sprint 1.1 fix: '@typescript-eslint/no-floating-promises' and
    // 'no-misused-promises' below are type-aware rules - they require an
    // actual TypeScript program, not just a syntax tree, to know which
    // expressions are Promises. Without `parserOptions` telling the
    // parser how to build that program, ESLint throws
    // "you don't have parserOptions set to generate type information"
    // the moment either rule runs, rather than silently skipping it.
    // `projectService: true` is typescript-eslint v8's recommended
    // mechanism for this in a monorepo: it finds the nearest tsconfig.json
    // to each linted file automatically (e.g. libs/rbac/tsconfig.json,
    // which already references tsconfig.lib.json/tsconfig.spec.json),
    // rather than needing one hand-maintained project list here.
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            // Pure domain logic (libs/domain/*) may depend only on the
            // shared contracts library - never on another domain's pure
            // logic, and never on rbac/config directly. Cross-domain
            // orchestration happens one layer up, in apps/api's modules.
            {
              sourceTag: 'scope:domain-people',
              onlyDependOnLibsWithTags: ['scope:contracts'],
            },
            {
              sourceTag: 'scope:domain-pastoral-care',
              onlyDependOnLibsWithTags: ['scope:contracts'],
            },
            {
              sourceTag: 'scope:domain-ministry',
              onlyDependOnLibsWithTags: ['scope:contracts'],
            },
            {
              sourceTag: 'scope:domain-gatherings',
              onlyDependOnLibsWithTags: ['scope:contracts'],
            },
            {
              sourceTag: 'scope:domain-stewardship',
              onlyDependOnLibsWithTags: ['scope:contracts'],
            },
            {
              // Insights may depend only on contracts too - it must never
              // reach directly into another domain's repositories or
              // tables (Blueprint Ch.4 §5, Ch.1 §4.3 rule 3). It consumes
              // the Engagement Signal stream, whose shape lives in
              // libs/contracts, exactly like every other domain.
              sourceTag: 'scope:domain-insights',
              onlyDependOnLibsWithTags: ['scope:contracts'],
            },
            {
              // libs/contracts is a leaf: shared DTOs/Zod schemas depend on
              // nothing else in the workspace.
              sourceTag: 'scope:contracts',
              onlyDependOnLibsWithTags: [],
            },
            {
              // libs/rbac (the permission matrix + guard primitives) may
              // reference the shared contracts but never a domain lib -
              // it is generic infrastructure, not domain logic.
              sourceTag: 'scope:rbac',
              onlyDependOnLibsWithTags: ['scope:contracts'],
            },
            {
              sourceTag: 'scope:config',
              onlyDependOnLibsWithTags: ['scope:contracts'],
            },
            {
              // Test fixtures/factories are allowed broad access since
              // they exist to support tests across the workspace.
              sourceTag: 'scope:testing',
              onlyDependOnLibsWithTags: [
                'scope:contracts',
                'scope:rbac',
                'scope:config',
                'scope:domain-people',
                'scope:domain-pastoral-care',
                'scope:domain-ministry',
                'scope:domain-gatherings',
                'scope:domain-stewardship',
                'scope:domain-insights',
              ],
            },
            // --- UI Foundation sprint additions below ---
            // `libs/ui/*` mirrors the same "leaf library" discipline as
            // `libs/domain/*`, but forms its own dependency chain instead
            // of a flat set of independent leaves, because a theme
            // genuinely is built FROM tokens, and a component genuinely
            // is built FROM theme/shared-types - collapsing that chain
            // into three unrelated leaves would let `ui-web` reach past
            // `ui-core` and hand-roll its own theme logic, which is
            // exactly the "built twice, inconsistently" failure the UI
            // Foundation exists to prevent (Design System v1.0 Part 1.1).
            {
              // Pure token data - the one leaf with zero workspace deps.
              sourceTag: 'scope:ui-tokens',
              onlyDependOnLibsWithTags: [],
            },
            {
              // Theme composition + shared types/icon registry - still
              // framework-agnostic (no React/React Native import), so it
              // depends on tokens only, never on ui-web or ui-native.
              sourceTag: 'scope:ui-core',
              onlyDependOnLibsWithTags: ['scope:ui-tokens'],
            },
            {
              // React DOM component implementations.
              sourceTag: 'scope:ui-web',
              onlyDependOnLibsWithTags: ['scope:ui-tokens', 'scope:ui-core'],
            },
            {
              // React Native component implementations. Never allowed to
              // depend on `scope:ui-web` (or vice versa) - the two
              // platform libraries are siblings, not layered on each
              // other, so a native screen can never accidentally pull in
              // a DOM-only component and fail at Metro-bundle time.
              sourceTag: 'scope:ui-native',
              onlyDependOnLibsWithTags: ['scope:ui-tokens', 'scope:ui-core'],
            },
            {
              // Backend applications (apps/api, apps/worker) - split out
              // of the former single `scope:app` specifically so a
              // NestJS service is structurally incapable of importing a
              // React or React Native UI library, a real bug class this
              // rule now catches at lint time instead of at bundle time
              // (UI Foundation sprint, see libs/ui/UI_DESIGN_NOTES.md).
              sourceTag: 'scope:app-backend',
              onlyDependOnLibsWithTags: [
                'scope:contracts',
                'scope:rbac',
                'scope:config',
                'scope:testing',
                'scope:domain-people',
                'scope:domain-pastoral-care',
                'scope:domain-ministry',
                'scope:domain-gatherings',
                'scope:domain-stewardship',
                'scope:domain-insights',
              ],
            },
            {
              // apps/web-admin - may depend on the shared UI foundation's
              // web implementation, but never on ui-native.
              sourceTag: 'scope:app-web',
              onlyDependOnLibsWithTags: [
                'scope:contracts',
                'scope:rbac',
                'scope:config',
                'scope:testing',
                'scope:domain-people',
                'scope:domain-pastoral-care',
                'scope:domain-ministry',
                'scope:domain-gatherings',
                'scope:domain-stewardship',
                'scope:domain-insights',
                'scope:ui-tokens',
                'scope:ui-core',
                'scope:ui-web',
              ],
            },
            {
              // apps/mobile - may depend on the shared UI foundation's
              // native implementation, but never on ui-web.
              sourceTag: 'scope:app-native',
              onlyDependOnLibsWithTags: [
                'scope:contracts',
                'scope:rbac',
                'scope:config',
                'scope:testing',
                'scope:domain-people',
                'scope:domain-pastoral-care',
                'scope:domain-ministry',
                'scope:domain-gatherings',
                'scope:domain-stewardship',
                'scope:domain-insights',
                'scope:ui-tokens',
                'scope:ui-core',
                'scope:ui-native',
              ],
            },
          ],
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    // Sprint 1.1 fix: every project's jest.config.ts imports
    // `swcJestConfig` from the root jest.preset.js (Sprint 0 repair - one
    // source of truth for the @swc/jest transform target instead of each
    // project guessing its own, see jest.preset.js's own doc comment).
    // jest.preset.js is a build-tooling file at the workspace root, not an
    // Nx library or app - it has no project tags and isn't part of the
    // dependency graph @nx/enforce-module-boundaries polices. The rule
    // still statically flags the relative import as "external resources
    // cannot be imported using a relative or absolute path", because from
    // its perspective a source file reached outside any known project.
    // This never surfaced before Sprint 1.1 because lint could not run at
    // all until then (see the two comments above). enforce-module-boundaries
    // exists to police source-code dependency direction between bounded
    // contexts (Blueprint §4.3/§5.2); it is not meant to apply to test
    // tooling configuration, so it is switched off specifically for
    // jest.config.ts rather than weakened workspace-wide.
    files: ['**/jest.config.ts'],
    rules: {
      '@nx/enforce-module-boundaries': 'off',
    },
  },
  eslintConfigPrettier,
);
