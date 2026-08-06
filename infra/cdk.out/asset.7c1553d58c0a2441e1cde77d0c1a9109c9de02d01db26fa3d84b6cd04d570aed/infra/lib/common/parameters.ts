import * as ssm from 'aws-cdk-lib/aws-ssm';
import type { Construct } from 'constructs';

import type { EnvironmentName } from './types';
import { parameterPath } from './naming';

/**
 * Writes one SSM `String` parameter under the `/ecclesia/{env}/...`
 * convention (`naming.ts`'s `parameterPath()`) - the shared-naming-source-
 * of-truth mechanism described in that file's doc comment. Every stack
 * that creates a resource a future application-layer config module will
 * need to discover (a queue URL, a User Pool ID, an Event Bus name) calls
 * this once per value, rather than each stack inventing its own ad hoc
 * `CfnOutput`-only convention.
 *
 * `CfnOutput` is still used alongside this for values a human operator
 * reads directly off a `cdk deploy`/console (see each stack's own
 * outputs) - the two aren't redundant: `CfnOutput` is for people running
 * `cdk deploy`, SSM parameters are for a running application resolving
 * its own configuration.
 */
export function writeParameter(scope: Construct, id: string, envName: EnvironmentName, category: string, key: string, value: string): ssm.StringParameter {
  return new ssm.StringParameter(scope, id, {
    parameterName: parameterPath(envName, category, key),
    stringValue: value,
    description: `Ecclesia ${envName} - ${category}/${key} (written by the infra CDK app, see infra/lib/common/parameters.ts)`,
  });
}
