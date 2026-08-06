import { ENVIRONMENT_NAMES } from '../lib/common/types';
import type { EnvironmentConfig, EnvironmentName } from '../lib/common/types';
import { devConfig } from './dev/config';
import { stagingConfig } from './staging/config';
import { productionConfig } from './production/config';

const CONFIGS_BY_ENVIRONMENT: Record<EnvironmentName, EnvironmentConfig> = {
  dev: devConfig,
  staging: stagingConfig,
  production: productionConfig,
};

/** Resolves an `EnvironmentName` to its `EnvironmentConfig` - the one
 * place `bin/infra.ts` (and any test) goes to get a concrete
 * configuration object. Adding a new environment (see the `pilot`
 * disclosure in `production/config.ts`'s own doc comment) means adding
 * one file under `environments/<name>/config.ts` and one entry in
 * `CONFIGS_BY_ENVIRONMENT` above - nowhere else. */
export function getEnvironmentConfig(envName: EnvironmentName): EnvironmentConfig {
  return CONFIGS_BY_ENVIRONMENT[envName];
}

export { devConfig, stagingConfig, productionConfig, ENVIRONMENT_NAMES };
export type { EnvironmentConfig, EnvironmentName };
