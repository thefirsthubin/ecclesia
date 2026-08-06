import type { EnvironmentName } from './types';

/**
 * One naming convention, used everywhere a resource needs an explicit
 * physical name (queue names, bus names, secret names, SSM parameter
 * paths) - `ecclesia-{env}-{logicalName}`. Kept as a single small module
 * rather than repeating the template string per stack so environment
 * isolation within the single shared AWS account (`types.ts`'s own doc
 * comment on `EnvironmentConfig.account`) is a name-collision-proof fact
 * enforced in one place, not a convention every stack author has to
 * remember to follow correctly by hand.
 */
export function resourceName(envName: EnvironmentName, logicalName: string): string {
  return `ecclesia-${envName}-${logicalName}`;
}

/** CloudFormation stack ID convention - `Ecclesia-{Env}-{StackName}`,
 * e.g. `Ecclesia-Dev-Cognito`. Distinct from `resourceName()` (which
 * names the AWS *resources* a stack creates) because CloudFormation stack
 * IDs conventionally use PascalCase, not the lowercase-hyphenated style
 * most AWS resource names expect/prefer. */
export function stackId(envName: EnvironmentName, stackName: string): string {
  const capitalizedEnv = envName.charAt(0).toUpperCase() + envName.slice(1);
  return `Ecclesia-${capitalizedEnv}-${stackName}`;
}

/** SSM Parameter Store path convention -
 * `/ecclesia/{env}/{category}/{key}`. Exists specifically to give
 * `apps/api`/`apps/worker`'s future configuration modules one documented,
 * predictable place to read resource identifiers (bus name, queue URLs,
 * User Pool ID) from at deploy time, instead of the two systems (infra
 * code and application config) independently hardcoding the same name
 * and silently drifting apart - directly the risk Blueprint §11.4's
 * ADR-008 names as CDK-in-TypeScript's own rationale ("the infra team
 * named the queue one thing, the app expects another"). See
 * `parameters.ts`'s `writeParameter()` for the write side of this
 * convention; wiring `apps/api`'s config module to *read* these SSM
 * parameters at deploy/boot time is a future application-layer milestone,
 * not built here (`INFRASTRUCTURE_DESIGN_NOTES.md` §8). */
export function parameterPath(envName: EnvironmentName, category: string, key: string): string {
  return `/ecclesia/${envName}/${category}/${key}`;
}
