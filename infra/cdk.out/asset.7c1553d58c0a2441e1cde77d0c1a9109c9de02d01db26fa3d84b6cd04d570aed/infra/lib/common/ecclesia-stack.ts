import * as cdk from 'aws-cdk-lib';
import type { Construct } from 'constructs';

import type { EnvironmentConfig } from './types';
import { resourceName } from './naming';

/**
 * Base class every stack in this app extends, instead of `cdk.Stack`
 * directly - the "common construct" the milestone brief asks for
 * (architecture requirement: "Reusable constructs"). Centralizes the
 * three things every stack would otherwise have to repeat by hand:
 *
 * 1. **Standard tags** (`Project`, `Environment`, `ManagedBy`) applied to
 *    every resource in the stack via `cdk.Tags.of(this)` - satisfies
 *    Blueprint §13.5's cost-stewardship principle ("reviewed... against
 *    actual utilization") by making per-environment cost attribution
 *    possible in Cost Explorer/Billing from day one, not retrofitted
 *    later once cost review actually starts.
 * 2. **Termination protection**, from `config.terminationProtection`
 *    (`types.ts`'s own doc comment - `true` in production only).
 * 3. **`resourceName()`**, a thin wrapper around
 *    `naming.ts`'s free function so stack code can write
 *    `this.resourceName('user-pool')` instead of importing and calling
 *    `resourceName(this.config.envName, 'user-pool')` at every call site.
 */
export abstract class EcclesiaStack extends cdk.Stack {
  protected readonly config: EnvironmentConfig;

  constructor(scope: Construct, id: string, config: EnvironmentConfig, props?: cdk.StackProps) {
    super(scope, id, {
      ...props,
      terminationProtection: config.terminationProtection,
    });
    this.config = config;

    cdk.Tags.of(this).add('Project', 'Ecclesia');
    cdk.Tags.of(this).add('Environment', config.envName);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    for (const [key, value] of Object.entries(config.extraTags ?? {})) {
      cdk.Tags.of(this).add(key, value);
    }
  }

  protected resourceName(logicalName: string): string {
    return resourceName(this.config.envName, logicalName);
  }
}
