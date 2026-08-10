import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import type { Construct } from 'constructs';

import { EcclesiaStack } from '../common/ecclesia-stack';
import { writeParameter } from '../common/parameters';
import type { EnvironmentConfig } from '../common/types';
import type { EventingStack } from './eventing-stack';
import type { SecretsStack } from './secrets-stack';
import type { SesStack } from './ses-stack';

export interface IamStackProps extends cdk.StackProps {
  eventing: EventingStack;
  secrets: SecretsStack;
  ses: SesStack;
}

/**
 * IAM - least-privilege runtime roles for the two services Blueprint
 * §11.1 names (API, Worker on ECS Fargate). `[Known limitation]` No ECS
 * stack/task definition exists yet (`INFRASTRUCTURE_DESIGN_NOTES.md` §7),
 * so these roles are **scaffolding**: real, deployable IAM resources with
 * a trust policy scoped to `ecs-tasks.amazonaws.com` (so nothing but an
 * actual ECS task can ever assume them, even before one exists), ready
 * for a future Compute milestone's `ecs.FargateTaskDefinition` to
 * reference via `taskRole: iamStack.apiTaskRole`.
 *
 * Every permission grant below uses CDK's resource-scoped `.grant*()`
 * convenience methods (`queue.grantConsumeMessages`,
 * `eventBus.grantPutEventsTo`, `secret.grantRead`) rather than hand-written
 * `iam.PolicyStatement`s with broad `resources: ['*']` - this is the
 * concrete mechanism satisfying the milestone's "Principle of least
 * privilege for IAM" architecture requirement: each grant is scoped by
 * CDK itself to the exact ARN of the one resource being granted, not a
 * wildcard, and not a hand-copied ARN string that could drift from the
 * resource's real ARN.
 *
 * Two separate role *kinds* per service, matching standard ECS practice
 * (not yet wired to an actual task definition, but the distinction
 * matters once one exists): an **execution role** (pulls the container
 * image, writes to CloudWatch Logs - the standard AWS-managed
 * `AmazonECSTaskExecutionRolePolicy`) and a **task role** (the
 * application's own least-privilege permissions - EventBridge/SQS/
 * Secrets/SES access). Conflating the two would give the application's
 * own AWS SDK calls (inside the container) the same permissions ECS
 * itself needs merely to *start* the container - broader than the
 * "principle of least privilege" requirement allows.
 */
export class IamStack extends EcclesiaStack {
  public readonly apiTaskExecutionRole: iam.Role;
  public readonly apiTaskRole: iam.Role;
  public readonly workerTaskExecutionRole: iam.Role;
  public readonly workerTaskRole: iam.Role;

  constructor(scope: Construct, id: string, config: EnvironmentConfig, props: IamStackProps) {
    super(scope, id, config, props);

    const { eventing, ses } = props;
    // No construct reference from `ses` is read directly below (the SES
    // identity ARN is built from `config.ses.emailIdentity` instead - see
    // the comment further down), so CDK would not infer a stack
    // dependency automatically the way it does for `eventing` (whose
    // resources ARE referenced directly). Declared explicitly so
    // `cdk deploy --all`'s dependency graph still deploys SesStack before
    // IamStack in any environment where an identity is configured.
    this.addDependency(ses);
    // `props.secrets` is intentionally not destructured/read here anymore
    // - see this constructor's own `[Bug fix]` comments below on why
    // every `secrets.*.grantRead(...)` call that used to live in this
    // stack was either dropped (unused) or moved to `ApiServiceStack`/
    // `WorkerServiceStack`. `secrets: SecretsStack` stays a required prop
    // on `IamStackProps` regardless - `bin/infra.ts`'s construction order
    // is unchanged, only what this stack's body does with it.

    this.apiTaskExecutionRole = this.buildExecutionRole('ApiTaskExecutionRole', 'api-task-execution-role');
    this.workerTaskExecutionRole = this.buildExecutionRole('WorkerTaskExecutionRole', 'worker-task-execution-role');

    this.apiTaskRole = new iam.Role(this, 'ApiTaskRole', {
      roleName: this.resourceName('api-task-role'),
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: "Least-privilege runtime role for apps/api's future ECS Fargate task (Blueprint §11.1).",
    });
    // apps/api publishes Engagement Signals (Engagement Signal Ingestion
    // Pipeline milestone's own EventBridgePublisherService) - PutEvents on
    // this environment's bus only, nothing else on EventBridge.
    eventing.bus.eventBus.grantPutEventsTo(this.apiTaskRole);
    // `[Bug fix]` No `secrets.*.grantRead(this.apiTaskRole)` calls here -
    // moved to `ApiServiceStack` (granted against `fargateService.taskRole`
    // instead), and `databaseCredentials` specifically dropped rather than
    // moved. Both are consequences of the same underlying CDK behavior:
    // `iam.Grant.addToPrincipalOrResource` can only skip its resource-policy
    // fallback when it can prove grantee and resource share an AWS account,
    // which it cannot for a role imported by ARN
    // (`fargate-service.construct.ts`'s own `[Bug fix]` comment on why the
    // role is imported at all) - so *any* grant here, from a role live in
    // this stack, to a secret live in `SecretsStack`, always also writes a
    // resource policy on that secret naming this stack's role, creating
    // `SecretsStack -> IamStack`. `SecretsStack -> IamStack` already exists
    // unavoidably (the *execution* role's automatic grant from
    // `ecs.TaskDefinition.addContainer()`'s `secrets` prop, load-bearing -
    // nothing else lets ECS inject `DB_MASTER_PASSWORD`/`DB_APP_PASSWORD`),
    // so adding `IamStack -> SecretsStack` on top, from *any* secret granted
    // here, is a real `DependencyCycle` CDK correctly refuses to synth
    // (confirmed via a real `nx run infra:test` failure across three specs).
    // Two different fixes for two different secrets:
    //   - `databaseCredentials`: dropped outright, not moved - a
    //     repository-wide search confirms neither `apps/api/src` nor
    //     `apps/worker/src` ever call the Secrets Manager SDK directly;
    //     `apps/api/entrypoint.sh` composes `DATABASE_URL`/`APP_DATABASE_URL`
    //     purely from env vars the execution role's grant already lets ECS
    //     inject. This grant was excess privilege the task role never used.
    //   - `mobileMoneyProviderSecret`/`smsGatewaySecret`: real, intended
    //     future runtime access (Horizon 2 - this file's own top doc
    //     comment), not unused - moved to `ApiServiceStack`/
    //     `WorkerServiceStack`, granted against `fargateService.taskRole`
    //     (also an ARN import, `fargate-service.construct.ts`), so the grant
    //     flows the same direction as the execution role's already-necessary
    //     one instead of the opposite one.
    // apps/api sends Cognito-adjacent transactional email once the SES
    // identity exists (ses-stack.ts's own [Known limitation] on why
    // Cognito isn't wired to it yet). aws-ses's EmailIdentity construct
    // has no CDK `.grant*()` convenience method (unlike SQS/EventBridge/
    // Secrets Manager above), so this is a hand-written, still
    // resource-scoped (not `resources: ['*']`) policy statement - added
    // only when an identity actually exists, so no dangling permission
    // references a non-existent resource.
    if (config.ses.emailIdentity) {
      // Built via cdk.Arn.format() rather than reading an ARN property
      // off the EmailIdentity construct, whose exact public surface for
      // this varies across aws-cdk-lib minor versions - the SES identity
      // ARN format itself (`arn:aws:ses:{region}:{account}:identity/{name}`)
      // is a stable AWS convention, not a CDK-version-dependent detail.
      const identityArn = cdk.Arn.format(
        { service: 'ses', resource: 'identity', resourceName: config.ses.emailIdentity },
        cdk.Stack.of(this),
      );
      this.apiTaskRole.addToPolicy(
        new iam.PolicyStatement({
          sid: 'SendTransactionalEmailViaVerifiedIdentity',
          actions: ['ses:SendEmail', 'ses:SendRawEmail'],
          resources: [identityArn],
        }),
      );
    }

    this.workerTaskRole = new iam.Role(this, 'WorkerTaskRole', {
      roleName: this.resourceName('worker-task-role'),
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: "Least-privilege runtime role for apps/worker's future ECS Fargate task (Blueprint §11.1).",
    });
    // apps/worker consumes all three SQS queues (its three real
    // consumers, WORKER_DESIGN_NOTES.md) - scoped to exactly these three
    // queues, not sqs:* or a wildcard ARN.
    eventing.bus.insightsQueue.grantConsumeMessages(this.workerTaskRole);
    eventing.bus.notificationQueue.grantConsumeMessages(this.workerTaskRole);
    eventing.bus.auditQueue.grantConsumeMessages(this.workerTaskRole);
    // apps/worker also *publishes* - its own EventBridgePublisherService
    // (Source: 'ecclesia.worker'), used by scheduled sweeps emitting
    // synthetic signals (Blueprint §10.8, e.g. silent-drift-sweep).
    eventing.bus.eventBus.grantPutEventsTo(this.workerTaskRole);
    // `[Bug fix]` No `secrets.*.grantRead(this.workerTaskRole)` calls here
    // either - same reasoning as `apiTaskRole` above. `smsGatewaySecret` is
    // granted in `WorkerServiceStack` instead; `databaseCredentials` is
    // dropped outright (unused - see above).

    writeParameter(this, 'ApiTaskRoleArnParam', config.envName, 'iam', 'api-task-role-arn', this.apiTaskRole.roleArn);
    writeParameter(this, 'WorkerTaskRoleArnParam', config.envName, 'iam', 'worker-task-role-arn', this.workerTaskRole.roleArn);
  }

  private buildExecutionRole(constructId: string, logicalName: string): iam.Role {
    return new iam.Role(this, constructId, {
      roleName: this.resourceName(logicalName),
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'ECS task execution role - pulls the container image and writes CloudWatch Logs. Distinct from the task role (this file\'s own doc comment).',
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')],
    });
  }
}
