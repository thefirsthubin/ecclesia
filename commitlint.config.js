/**
 * Conventional Commits enforcement (Blueprint Ch.7 §14.5).
 *
 * Every commit message is validated against this config by the
 * `commit-msg` Husky hook. Scopes are restricted to the module inventory
 * defined in the Technical Blueprint (Ch.1 §4.2) plus a small set of
 * cross-cutting infrastructure scopes, so that `git log --grep` and
 * changelog generation stay meaningfully searchable by bounded context
 * as the codebase grows over years of maintenance.
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        // Bounded contexts / modules (Blueprint Ch.1 §4.2)
        'people',
        'pastoral-care',
        'ministry',
        'gatherings',
        'stewardship',
        'insights',
        'platform',
        // Applications
        'api',
        'worker',
        'mobile',
        'web-admin',
        // Cross-cutting
        'contracts',
        'rbac',
        'config',
        'testing',
        'infra',
        'db',
        'ci',
        'deps',
        'repo',
      ],
    ],
    'body-max-line-length': [0, 'always'],
  },
};
