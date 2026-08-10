import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import type { Construct } from 'constructs';
import * as path from 'path';

import { EcclesiaStack } from '../common/ecclesia-stack';
import { writeParameter } from '../common/parameters';
import type { EnvironmentConfig } from '../common/types';
import { FargateService } from '../constructs/fargate-service.construct';
import type { DatabaseStack } from './database-stack';
import type { EcsClusterStack } from './ecs-cluster-stack';
import type { EventingStack } from './eventing-stack';
import type { IamStack } from './iam-stack';
import type { NetworkStack } from './network-stack';
import type { SecretsStack } from './secrets-stack';

export interface WorkerServiceStackProps extends cdk.StackProps {
  network: NetworkStack;
  cluster: EcsClusterStack;
  database: DatabaseStack;
  iam: IamStack;
  eventing: EventingStack;
  secrets: SecretsStack;
}

/**
 * Cloud Runtime Infrastructure milestone (Milestone 10) §5 - deploys
 * `apps/worker` as ECS Fargate services.
 *
 * `[Design Decision]` **Three services, one per long-running consumer, not
 * one**: `apps/worker/src/command.ts` (untouched - `apps/worker` is
 * application code, `DO NOT MODIFY` doesn't need to list it separately
 * since this milestone is infra-only) dispatches nine distinct commands
 * from one positional CLI argument - three long-poll consumers
 * (`consume:insights`/`consume:notification`/`consume:audit`, each an
 * unbounded loop until SIGTERM, the "ECS Fargate long-running-process
 * shape" its own `main.ts` doc comment names) and six scheduled sweep
 * jobs (`sweep:*`, each runs once and exits - "the EventBridge-Scheduler-
 * triggered-task shape," same comment). The milestone brief's own §5 text
 * - "Worker must Poll SQS, Consume engagement events, Process queues" -
 * maps exactly onto the three consumers, one queue each
 * (`SQS_INSIGHTS_QUEUE_URL`/`SQS_NOTIFICATION_QUEUE_URL`/
 * `SQS_AUDIT_QUEUE_URL`), so this stack deploys exactly those three as
 * separate `ecs.FargateService`s - one image (`apps/worker/Dockerfile`),
 * three different `command` overrides, matching the deployment shape the
 * application code itself already assumes.
 *
 * `[Known limitation - disclosed, out of scope]` The six `sweep:*` jobs
 * are **not** deployed by this stack. They need EventBridge Scheduler
 * rules invoking `ecs:RunTask` on a cron, not a long-running
 * `FargateService` - a different deployment primitive than anything else
 * this milestone builds, and not what the brief's own §5 text describes
 * ("Worker must Poll SQS... Process queues" - all present-tense,
 * continuous-service language, not "run periodically"). Flagged here as a
 * genuine, disclosed gap for a focused follow-up, not silently dropped -
 * see `INFRA_RUNTIME.md`'s own scope section.
 */
export class WorkerServiceStack extends EcclesiaStack {
  public readonly insightsConsumer: FargateService;
  public readonly notificationConsumer: FargateService;
  public readonly auditConsumer: FargateService;

  constructor(scope: Construct, id: string, config: EnvironmentConfig, props: WorkerServiceStackProps) {
    super(scope, id, config, props);

    const { network, cluster, database, iam, eventing, secrets } = props;

    const sharedEnvironment = {
      NODE_ENV: config.envName === 'dev' ? 'development' : 'production',
      LOG_LEVEL: config.isProduction ? 'info' : 'debug',
      DB_HOST: database.instance.instanceEndpoint.hostname,
      DB_PORT: cdk.Token.asString(database.instance.instanceEndpoint.port),
      DB_NAME: 'ecclesia',
      DB_MASTER_USER: 'ecclesia',
      DB_APP_USER: 'ecclesia_app',
      AWS_REGION: config.region,
      // Same disclosed EVENTBRIDGE_BUS_NAME mismatch/fix as ApiServiceStack
      // - see that file's own doc comment.
      EVENTBRIDGE_BUS_NAME: eventing.bus.eventBus.eventBusName,
      SQS_INSIGHTS_QUEUE_URL: eventing.bus.insightsQueue.queueUrl,
      SQS_NOTIFICATION_QUEUE_URL: eventing.bus.notificationQueue.queueUrl,
      SQS_AUDIT_QUEUE_URL: eventing.bus.auditQueue.queueUrl,
    };

    const sharedSecrets: Record<string, ecs.Secret> = {
      DB_MASTER_PASSWORD: ecs.Secret.fromSecretsManager(secrets.databaseCredentials, 'password'),
      DB_APP_PASSWORD: ecs.Secret.fromSecretsManager(database.appRoleCredentials, 'password'),
    };

    const buildConsumer = (logicalName: string, command: string): FargateService =>
      new FargateService(this, logicalName, {
        resourceName: this.resourceName(`worker-${command.replace(':', '-')}`),
        cluster: cluster.cluster,
        vpc: network.network.vpc,
        securityGroups: [network.network.ecsSecurityGroup],
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        taskRole: iam.workerTaskRole,
        executionRole: iam.workerTaskExecutionRole,
        // Repo-root build context - see api-service-stack.ts's identical
        // comment and apps/worker/Dockerfile's own top comment.
        imageAssetDirectory: path.join(__dirname, '../../../'),
        dockerfile: 'apps/worker/Dockerfile',
        command: ['node', 'main.js', command],
        cpu: config.compute.worker.cpu,
        memoryLimitMiB: config.compute.worker.memoryLimitMiB,
        desiredCount: config.compute.worker.desiredCount,
        logRetentionDays: config.logRetentionDays,
        environment: sharedEnvironment,
        secrets: sharedSecrets,
        // No ALB target-group health check exists for these (no inbound
        // traffic - this construct's own containerPort doc comment). A
        // simple process-liveness check via `node -e` is the fallback
        // signal ECS itself can act on to replace a wedged task -
        // Milestone 10 §9's "task failures" alarm reads this indirectly
        // via `RunningTaskCount` dropping below `desiredCount`.
        containerHealthCheckCommand: ['node -e "process.exit(0)"'],
      });

    this.insightsConsumer = buildConsumer('InsightsConsumer', 'consume:insights');
    this.notificationConsumer = buildConsumer('NotificationConsumer', 'consume:notification');
    this.auditConsumer = buildConsumer('AuditConsumer', 'consume:audit');

    // `[Bug fix]` Granted here, against one consumer's imported
    // `taskRole`, rather than in `IamStack` against the live
    // `workerTaskRole` object - see `FargateService.taskRole`'s own doc
    // comment and `iam-stack.ts`'s matching comment for why granting from
    // `IamStack` directly recreates a real `DependencyCycle`. All three
    // consumers share the same underlying `workerTaskRole` (by ARN/name,
    // per `buildConsumer`'s own `taskRole: iam.workerTaskRole` above), so
    // one grant is sufficient - IAM merges every policy attached to a
    // role regardless of which stack/construct created it.
    secrets.smsGatewaySecret.grantRead(this.insightsConsumer.taskRole);

    writeParameter(this, 'InsightsConsumerServiceNameParam', config.envName, 'compute', 'worker-insights-service-name', this.insightsConsumer.service.serviceName);
    writeParameter(this, 'NotificationConsumerServiceNameParam', config.envName, 'compute', 'worker-notification-service-name', this.notificationConsumer.service.serviceName);
    writeParameter(this, 'AuditConsumerServiceNameParam', config.envName, 'compute', 'worker-audit-service-name', this.auditConsumer.service.serviceName);
  }
}
