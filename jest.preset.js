const nxPreset = require('@nx/jest/preset').default;

/**
 * Shared Jest preset consumed by every project's jest.config.ts (Blueprint
 * Ch.7 §14.2). Keeping this at the root means a change to coverage
 * thresholds or module-name mapping is a one-file change, not a per-project
 * edit across a growing number of libraries and apps.
 */
module.exports = { ...nxPreset };
