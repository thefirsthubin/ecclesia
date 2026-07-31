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
            {
              // Applications sit at the top of the graph and may depend on
              // any library, per Blueprint Ch.1 §4.3 rule 4 (an app's
              // module layer is where cross-domain orchestration happens).
              sourceTag: 'scope:app',
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
  eslintConfigPrettier,
);
