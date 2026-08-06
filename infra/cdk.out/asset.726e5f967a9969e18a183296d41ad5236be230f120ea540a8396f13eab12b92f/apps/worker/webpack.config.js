const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

/**
 * Webpack config for the Worker service (Blueprint ADR-007: this is what
 * eventually runs inside the ECS Fargate task defined in the CDK
 * infrastructure milestone). Mirrors `apps/api/webpack.config.js` exactly
 * - added this milestone (previously apps/worker built via `@nx/js:tsc`,
 * which worked fine for the Sprint 0 scaffold's zero-import `main.ts` but
 * fails with `TS6059 (rootDir)` once apps/worker imports `libs/contracts`/
 * `libs/domain/*` by TS path mapping the way every apps/api module already
 * does - `@nx/js:tsc`'s whole-program compilation requires every included
 * file to sit under one `rootDir`, which a cross-project path-mapped
 * import can't satisfy; webpack + `NxAppWebpackPlugin`'s own module
 * resolution doesn't have that restriction, the same reason apps/api's
 * build has never hit it despite importing the same libs. See
 * `apps/worker/WORKER_DESIGN_NOTES.md`.
 */
module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/worker'),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
    }),
  ],
};
