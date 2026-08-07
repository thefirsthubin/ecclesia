import * as cdk from 'aws-cdk-lib';
import type * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface FargateServiceProps {
  /** Short logical name, e.g. `'api'`, `'worker-insights'` - used to build
   * the service/task-definition/log-group names via `resourceName()`-style
   * prefixing by the caller (this construct itself takes the already-full
   * resource name, so it stays environment-naming-convention-agnostic). */
  resourceName: string;
  cluster: ecs.ICluster;
  vpc: ec2.IVpc;
  securityGroups: ec2.ISecurityGroup[];
  vpcSubnets: ec2.SubnetSelection;
  taskRole: iam.IRole;
  executionRole: iam.IRole;
  /** Directory containing the service's `Dockerfile` - built via
   * `ecs.ContainerImage.fromAsset()`. `[Verified via a real cdk synth]`
   * Contrary to this construct's own original assumption, `cdk synth`
   * does **not** need a running Docker daemon: it stages the build
   * context (respecting `.dockerignore`) into `cdk.out/asset.<hash>/` and
   * computes the asset hash from that staged source tree, deferring the
   * actual `docker build`/`docker push` to `cdk deploy`'s separate asset-
   * publishing step. Confirmed by inspecting this sandbox's own
   * `cdk.out` output after a successful synth with no Docker installed at
   * all - see `INFRA_RUNTIME.md`'s verification section. Docker is still
   * required for `cdk deploy` to actually work. */
  imageAssetDirectory: string;
  dockerfile?: string;
  /** Container command override - lets one image serve multiple services
   * (`WorkerServiceStack`'s own doc comment: the same worker image, three
   * different `command:*` invocations, matching
   * `apps/worker/src/command.ts`'s own container-per-command deployment
   * shape). `undefined` uses the image's own `CMD`/`ENTRYPOINT`. */
  command?: string[];
  /** Container port. When set, `attachToAlb()` can register this
   * service's tasks with an ALB target group. `undefined` for services
   * with no inbound traffic at all (the Worker's consumer services -
   * outbound-only: SQS long-polling, EventBridge publishing). */
  containerPort?: number;
  environment: Record<string, string>;
  secrets?: Record<string, ecs.Secret>;
  cpu: number;
  memoryLimitMiB: number;
  desiredCount: number;
  logRetentionDays: number;
  /** Container-level health check (Docker `HEALTHCHECK` equivalent, via
   * ECS's own `healthCheck` task-definition property) - required for
   * services with no ALB target-group health check to fall back on (the
   * milestone brief's own §9 "task failures" alarm needs *some* signal
   * ECS can act on to replace a stuck-but-still-"running" task). Exactly
   * one element - the full shell command as a single string - which this
   * construct prefixes with `CMD-SHELL` (ECS's shell-form health check
   * convention, matching Docker's own `HEALTHCHECK CMD-SHELL "..."`). */
  containerHealthCheckCommand?: string[];
}

/**
 * Cloud Runtime Infrastructure milestone (Milestone 10) - the reusable
 * Fargate-service construct `ApiServiceStack` and `WorkerServiceStack`
 * both build on (architecture requirement: "Reusable constructs"). One
 * task definition + one container + one CloudWatch log group + one
 * `ecs.FargateService`, parameterized entirely through `FargateServiceProps`
 * - nothing environment- or service-specific is hardcoded here.
 *
 * "Automatic Restart" (milestone brief §4/§5's own explicit requirement)
 * is not a setting this construct turns on - it is `ecs.FargateService`'s
 * *default* behavior: the ECS service scheduler continuously reconciles
 * running task count against `desiredCount`, replacing any task that
 * stops (whether from a crash, an OOM kill, or a failed health check)
 * without any further configuration. Documented here so that behavior is
 * traceable to an explicit requirement, not assumed silently.
 */
export class FargateService extends Construct {
  public readonly taskDefinition: ecs.FargateTaskDefinition;
  public readonly service: ecs.FargateService;
  public readonly logGroup: logs.LogGroup;
  public readonly container: ecs.ContainerDefinition;

  constructor(scope: Construct, id: string, props: FargateServiceProps) {
    super(scope, id);

    this.logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: `/ecs/${props.resourceName}`,
      retention: daysToRetentionEnum(props.logRetentionDays),
      removalPolicy: cdk.RemovalPolicy.DESTROY, // log data itself is not the durable record - CloudWatch Logs retention days already governs how long it lives; removing the log group on stack teardown does not lose the audit trail (Blueprint §12.1's own audit-log-vs-operational-log distinction - this is operational).
    });

    // `[Bug fix, found via a real cdk synth]` `props.taskRole`/
    // `props.executionRole` come from `IamStack` - a *different* stack
    // than this one. Passing them through as live, mutable role objects
    // caused a real `DependencyCycle` at synth time: this construct's own
    // CloudWatch log group (created *here*, in the caller's stack) is
    // passed to `ecs.LogDrivers.awsLogs()`, which auto-grants
    // `logs:CreateLogStream`/`PutLogEvents` on the execution role by
    // attaching a policy statement *directly to that live Role
    // construct's own resource* - but that resource lives in `IamStack`,
    // so CDK tried to make `IamStack` depend on *this* stack's log group
    // ARN, while this stack already depends on `IamStack` for the role
    // itself. Re-importing both roles by ARN (`iam.Role.fromRoleArn`)
    // fixes that: an imported role is its own construct, scoped to
    // *this* stack, so any policy statement `.grant*()`/`addContainer()`
    // attaches to it becomes a new `iam.Policy` resource declared here,
    // not an edit to `IamStack`'s own role resource.
    //
    // `[Bug fix, this pass]` The imports were additionally made `mutable:
    // false`, which - per CDK's own documented `Grant.addToPrincipal`
    // behavior - makes `addToPrincipalPolicy()` a no-op instead of merely
    // "attach elsewhere," so every subsequent grant attempt falls back to
    // `Grant.addToPrincipalOrResource`'s *resource*-policy branch. For
    // `ecs.TaskDefinition.addContainer()`'s `secrets` prop (`ecs.Secret.
    // fromSecretsManager(...)`), that fallback calls the secret's own
    // `.addToResourcePolicy()` - a real CloudFormation resource policy on
    // the secret itself (`SecretsStack`/`DatabaseStack`, not this stack),
    // naming this execution role's ARN as `Principal`. That is a second,
    // *reverse* `DependencyCycle`, this time between `SecretsStack` and
    // `IamStack` (confirmed via a real `nx run infra:test` failure on
    // `runtime-observability-stack.spec.ts`: `IamStack` already depends on
    // `SecretsStack` for the *task* role's own direct grants in
    // `iam-stack.ts`, so the resource-policy fallback's reverse edge
    // completed the cycle). `mutable: true` (the default - simply omitting
    // the option) keeps every grant on the *identity* side: the new
    // `iam.Policy` this construct's own imported-role construct creates
    // lives in *this* stack (`ApiServiceStack`/`WorkerServiceStack`),
    // referencing the role by its already-cross-stack ARN (an edge to
    // `IamStack` that already exists - this stack receives the role via
    // props) and the secret by its ARN (an edge to `SecretsStack`/
    // `DatabaseStack` that already exists the same way) - never touching
    // `IamStack`'s or `SecretsStack`'s own template, so no reverse edge is
    // possible. `AmazonECSTaskExecutionRolePolicy` (attached in
    // `iam-stack.ts`'s own `buildExecutionRole()`) still makes the log
    // group grant specifically redundant (not load-bearing either way);
    // the secrets grant is the opposite - load-bearing, since nothing
    // else grants the execution role `secretsmanager:GetSecretValue` on
    // these secrets.
    const importedTaskRole = iam.Role.fromRoleArn(this, 'ImportedTaskRole', props.taskRole.roleArn);
    const importedExecutionRole = iam.Role.fromRoleArn(this, 'ImportedExecutionRole', props.executionRole.roleArn);

    this.taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDefinition', {
      family: props.resourceName,
      cpu: props.cpu,
      memoryLimitMiB: props.memoryLimitMiB,
      taskRole: importedTaskRole,
      executionRole: importedExecutionRole,
    });

    this.container = this.taskDefinition.addContainer('Container', {
      containerName: props.resourceName,
      image: ecs.ContainerImage.fromAsset(props.imageAssetDirectory, { file: props.dockerfile ?? 'Dockerfile' }),
      command: props.command,
      environment: props.environment,
      secrets: props.secrets,
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: props.resourceName, logGroup: this.logGroup }),
      portMappings: props.containerPort ? [{ containerPort: props.containerPort, protocol: ecs.Protocol.TCP }] : undefined,
      healthCheck: props.containerHealthCheckCommand
        ? {
            command: ['CMD-SHELL', ...props.containerHealthCheckCommand],
            interval: cdk.Duration.seconds(30),
            timeout: cdk.Duration.seconds(5),
            retries: 3,
            startPeriod: cdk.Duration.seconds(30),
          }
        : undefined,
    });

    this.service = new ecs.FargateService(this, 'Service', {
      serviceName: props.resourceName,
      cluster: props.cluster,
      taskDefinition: this.taskDefinition,
      desiredCount: props.desiredCount,
      securityGroups: props.securityGroups,
      vpcSubnets: props.vpcSubnets,
      assignPublicIp: false, // private-app subnets only - Milestone 10 §7 "Private Database" / least-privilege network posture applied equally to compute.
      circuitBreaker: { enable: true, rollback: true }, // ECS deployment circuit breaker - a task definition that never reaches a healthy state during a deployment is rolled back automatically rather than looping forever.
    });
  }

  /** Registers this service with an ALB listener's target group -
   * `ApiServiceStack`'s own call site, not used by `WorkerServiceStack`
   * (no inbound traffic - this construct's own `containerPort` doc
   * comment). */
  attachToAlb(listener: elbv2.ApplicationListener, healthCheckPath: string): elbv2.ApplicationTargetGroup {
    if (!this.container.containerPort) {
      throw new Error('attachToAlb() requires containerPort to have been set on this FargateService.');
    }
    return listener.addTargets('Targets', {
      port: this.container.containerPort,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [this.service],
      healthCheck: {
        path: healthCheckPath,
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });
  }
}

/** CloudWatch Logs retention only accepts a fixed enum of day counts, not
 * an arbitrary integer - snaps `days` up to the nearest supported value so
 * every `EnvironmentConfig.logRetentionDays` (14/30/365 - `types.ts`'s own
 * doc comment) maps onto a real, valid retention setting rather than
 * throwing at synth time on an unsupported number. */
function daysToRetentionEnum(days: number): logs.RetentionDays {
  const supported: Array<[number, logs.RetentionDays]> = [
    [14, logs.RetentionDays.TWO_WEEKS],
    [30, logs.RetentionDays.ONE_MONTH],
    [90, logs.RetentionDays.THREE_MONTHS],
    [180, logs.RetentionDays.SIX_MONTHS],
    [365, logs.RetentionDays.ONE_YEAR],
    [400, logs.RetentionDays.THIRTEEN_MONTHS],
  ];
  const match = supported.find(([threshold]) => days <= threshold);
  return match ? match[1] : logs.RetentionDays.ONE_YEAR;
}
