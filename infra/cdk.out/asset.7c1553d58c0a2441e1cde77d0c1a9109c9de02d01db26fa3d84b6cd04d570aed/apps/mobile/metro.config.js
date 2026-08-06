const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNxMetro } = require('@nx/react-native');

/**
 * @type {import('metro-config').MetroConfig}
 */
const config = {};

// withNxMetro (Sprint 0 repair) is required, not optional, in this
// workspace: plain getDefaultConfig/mergeConfig assumes react-native and
// its siblings live in a flat node_modules next to the app. Inside this
// Nx/pnpm monorepo they live in the workspace root's node_modules (via
// pnpm's .pnpm store), which Metro's default resolver never looks at
// without this wiring - hence "Unable to resolve module react-native",
// even though the package is installed and every other tool can find it.
// withNxMetro adds the correct watchFolders/node_modules search paths for
// an Nx workspace.
module.exports = withNxMetro(mergeConfig(getDefaultConfig(__dirname), config), {
  debug: false,
  extensions: [],
  watchFolders: [],
});
