const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

/**
 * Webpack config for the API service (Blueprint Ch.11 §11.1: this is what
 * eventually runs inside the ECS Fargate task defined in the CDK
 * infrastructure milestone). `optimization: false` and no bundling of
 * node_modules keep local `nx serve api` fast; the production
 * configuration (see project.json) is what CI builds for the container
 * image.
 */
module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/api'),
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
