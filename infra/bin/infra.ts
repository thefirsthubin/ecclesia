#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';

import { ENVIRONMENT_NAMES, getEnvironmentConfig } from '../environments';
import { stackId } from '../lib/common/naming';
import { CognitoStack } from '../lib/stacks/cognito-stack';
import { EventingStack } from '../lib/stacks/eventing-stack';
import { IamStack } from '../lib/stacks/iam-stack';
import { ObservabilityStack } from '../lib/stacks/observability-stack';
import { SecretsStack } from '../lib/stacks/secrets-stack';
import { SesStack } from '../lib/stacks/ses-stack';

/**
 * Production Infrastructure Foundation milestone - CDK app entrypoint.
 *
 * Instantiates every stack, for every environment (`dev`, `staging`,
 * `production` - `types.ts`'s `ENVIRONMENT_NAMES`), inside one `cdk.App`.
 * `cdk synth` (no stack argument - this project's `build`/`synth` Nx
 * targets, `infra/project.json`) therefore synthesizes all eighteen
 * stacks (six stacks × three environments) in a single pass - directly
 * satisfying the milestone's own validation bullet "all stacks
 * synthesize successfully" without needing a `--context environment=X`
 * flag to pick just one. `[Bug fix, found via a real run]` `cdk synth
 * --all` (this project's original assumption) is not a recognized
 * `synth` flag - only `deploy`/`destroy`/`diff` accept `--all`; `synth`
 * with no stack selector already means "every stack."
 *
 * `[Design Decision]` No stack here performs a live AWS context lookup
 * (no `ec2.Vpc.fromLookup`, no availability-zone discovery, nothing that
 * needs real AWS credentials just to synthesize) - this is deliberate,
 * not incidental: it is exactly what makes `cdk synth` fully
 * deterministic and runnable with **no** AWS credentials configured at
 * all, which matters given this milestone's own "Do NOT... run cdk
 * bootstrap... Do NOT deploy" constraint. See
 * `INFRASTRUCTURE_DESIGN_NOTES.md` §3 for why no VPC/network stack exists
 * yet - the same reason applies here.
 */
const app = new cdk.App();

for (const envName of ENVIRONMENT_NAMES) {
  const config = getEnvironmentConfig(envName);
  const env: cdk.Environment = { account: config.account, region: config.region };
  const description = (stackName: string): string => `Ecclesia ${envName} - ${stackName} (Production Infrastructure Foundation milestone)`;

  // Cognito has no dependents in this milestone (its outputs aren't
  // consumed by IamStack/ObservabilityStack below) - constructed for its
  // side effect of registering with `app`, matching the same
  // no-captured-variable pattern `EngagementSignalBus`'s own
  // `new events.Rule(...)` calls use for the same reason.
  new CognitoStack(app, stackId(envName, 'Cognito'), config, {
    env,
    description: description('Cognito'),
  });

  const eventing = new EventingStack(app, stackId(envName, 'Eventing'), config, {
    env,
    description: description('EventBridge + SQS'),
  });

  const ses = new SesStack(app, stackId(envName, 'Ses'), config, {
    env,
    description: description('SES'),
  });

  const secrets = new SecretsStack(app, stackId(envName, 'Secrets'), config, {
    env,
    description: description('Secrets Manager'),
  });

  // Cognito, Eventing, Ses, and Secrets have no dependencies on each
  // other and CDK will happily deploy them in parallel; Iam and
  // Observability both take direct construct references (secrets/ses/
  // eventing), which CDK already turns into real stack dependencies
  // automatically - no explicit `addDependency()` needed here beyond the
  // one already declared inside `IamStack` itself (`iam-stack.ts`'s own
  // comment on why the SES dependency specifically needed to be
  // explicit).
  new IamStack(app, stackId(envName, 'Iam'), config, {
    env,
    description: description('IAM'),
    eventing,
    secrets,
    ses,
  });

  new ObservabilityStack(app, stackId(envName, 'Observability'), config, {
    env,
    description: description('CloudWatch'),
    eventing,
  });
}
