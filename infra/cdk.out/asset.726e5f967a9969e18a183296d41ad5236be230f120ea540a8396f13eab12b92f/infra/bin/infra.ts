#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';

import { ENVIRONMENT_NAMES, getEnvironmentConfig } from '../environments';
import { stackId } from '../lib/common/naming';
import { AlbStack } from '../lib/stacks/alb-stack';
import { ApiServiceStack } from '../lib/stacks/api-service-stack';
import { CognitoStack } from '../lib/stacks/cognito-stack';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { EcsClusterStack } from '../lib/stacks/ecs-cluster-stack';
import { EventingStack } from '../lib/stacks/eventing-stack';
import { IamStack } from '../lib/stacks/iam-stack';
import { NetworkStack } from '../lib/stacks/network-stack';
import { ObservabilityStack } from '../lib/stacks/observability-stack';
import { RuntimeObservabilityStack } from '../lib/stacks/runtime-observability-stack';
import { SecretsStack } from '../lib/stacks/secrets-stack';
import { SesStack } from '../lib/stacks/ses-stack';
import { WorkerServiceStack } from '../lib/stacks/worker-service-stack';

/**
 * CDK app entrypoint. Started as the Production Infrastructure Foundation
 * milestone's six stacks; Cloud Runtime Infrastructure (Milestone 10)
 * added seven more (Network, Database, EcsCluster, Alb, ApiService,
 * WorkerService, RuntimeObservability) per environment (`dev`, `staging`,
 * `production` - `types.ts`'s `ENVIRONMENT_NAMES`), inside the same one
 * `cdk.App`. `cdk synth` (no stack argument - this project's `build`/
 * `synth` Nx targets, `infra/project.json`) therefore synthesizes all 39
 * stacks (13 × three environments) in a single pass. `[Bug fix, found via
 * a real run]` `cdk synth --all` (this project's original assumption) is
 * not a recognized `synth` flag - only `deploy`/`destroy`/`diff` accept
 * `--all`; `synth` with no stack selector already means "every stack."
 *
 * `[Design Decision]` The original six stacks perform no live AWS context
 * lookup, so `cdk synth` for them stays fully deterministic with zero AWS
 * credentials. `ApiServiceStack`/`WorkerServiceStack` build real Docker
 * image assets (`ecs.ContainerImage.fromAsset()`,
 * `infra/lib/constructs/fargate-service.construct.ts`) - `[Verified via a
 * real cdk synth]` this does **not** require a Docker daemon at `cdk
 * synth` time either: CDK stages the build context into
 * `cdk.out/asset.<hash>/` and hashes that source tree, deferring the
 * actual `docker build`/push to `cdk deploy`'s separate asset-publishing
 * step. Confirmed by a full, successful 39-stack synth in a sandbox with
 * no Docker installed at all. Docker is still required for `cdk deploy`
 * to actually work on these two stacks - see `INFRA_RUNTIME.md`'s
 * verification section.
 */
const app = new cdk.App();

for (const envName of ENVIRONMENT_NAMES) {
  const config = getEnvironmentConfig(envName);
  const env: cdk.Environment = { account: config.account, region: config.region };
  const description = (stackName: string, milestone = 'Production Infrastructure Foundation milestone'): string => `Ecclesia ${envName} - ${stackName} (${milestone})`;

  const cognito = new CognitoStack(app, stackId(envName, 'Cognito'), config, {
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
  const iam = new IamStack(app, stackId(envName, 'Iam'), config, {
    env,
    description: description('IAM'),
    eventing,
    secrets,
    ses,
  });

  const observability = new ObservabilityStack(app, stackId(envName, 'Observability'), config, {
    env,
    description: description('CloudWatch'),
    eventing,
  });

  // --- Cloud Runtime Infrastructure milestone (Milestone 10) ---
  const runtimeMilestone = 'Cloud Runtime Infrastructure milestone';

  const network = new NetworkStack(app, stackId(envName, 'Network'), config, {
    env,
    description: description('VPC/Networking', runtimeMilestone),
  });

  const database = new DatabaseStack(app, stackId(envName, 'Database'), config, {
    env,
    description: description('RDS PostgreSQL', runtimeMilestone),
    network,
    secrets,
  });

  const cluster = new EcsClusterStack(app, stackId(envName, 'EcsCluster'), config, {
    env,
    description: description('ECS Fargate Cluster', runtimeMilestone),
    network,
  });

  const alb = new AlbStack(app, stackId(envName, 'Alb'), config, {
    env,
    description: description('Application Load Balancer', runtimeMilestone),
    network,
  });

  const apiService = new ApiServiceStack(app, stackId(envName, 'ApiService'), config, {
    env,
    description: description('apps/api Fargate service', runtimeMilestone),
    network,
    cluster,
    alb,
    database,
    iam,
    cognito,
    eventing,
    secrets,
  });

  const workerService = new WorkerServiceStack(app, stackId(envName, 'WorkerService'), config, {
    env,
    description: description('apps/worker Fargate services', runtimeMilestone),
    network,
    cluster,
    database,
    iam,
    eventing,
    secrets,
  });

  new RuntimeObservabilityStack(app, stackId(envName, 'RuntimeObservability'), config, {
    env,
    description: description('ECS/RDS CloudWatch alarms + dashboard', runtimeMilestone),
    observability,
    database,
    apiService,
    workerService,
  });
}
