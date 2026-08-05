import type * as cdk from 'aws-cdk-lib';
import type { Construct } from 'constructs';

import { EcclesiaStack } from '../common/ecclesia-stack';
import { writeParameter } from '../common/parameters';
import type { EnvironmentConfig } from '../common/types';
import { EngagementSignalBus } from '../../modules/engagement-signal-bus.construct';

/**
 * EventBridge + SQS - Blueprint §10.1/§10.2. Thin stack wrapper around the
 * reusable `EngagementSignalBus` construct (`infra/modules/`, that
 * directory's own README's stated purpose) - this stack's own job is
 * environment wiring (passing this environment's `EnvironmentConfig`
 * in) and publishing the resulting resource identifiers (SSM parameters +
 * `CfnOutput`s) other stacks and, eventually, `apps/api`/`apps/worker`'s
 * ECS task definitions need.
 */
export class EventingStack extends EcclesiaStack {
  public readonly bus: EngagementSignalBus;

  constructor(scope: Construct, id: string, config: EnvironmentConfig, props?: cdk.StackProps) {
    super(scope, id, config, props);

    this.bus = new EngagementSignalBus(this, 'EngagementSignalBus', {
      envName: config.envName,
      eventing: config.eventing,
      removalPolicy: config.removalPolicy,
    });

    // SSM parameters - the shared naming-source-of-truth mechanism
    // (naming.ts's own doc comment). A future apps/api/apps/worker
    // config-module milestone reads these instead of the app's own
    // hardcoded/defaulted env var values (env.schema.ts's
    // EVENTBRIDGE_BUS_NAME default, SQS_*_QUEUE_URL - see
    // engagement-signal-bus.construct.ts's own [Known limitation] note on
    // why the bus name specifically cannot rely on that default).
    writeParameter(this, 'BusNameParam', config.envName, 'eventing', 'bus-name', this.bus.eventBus.eventBusName);
    writeParameter(this, 'BusArnParam', config.envName, 'eventing', 'bus-arn', this.bus.eventBus.eventBusArn);
    writeParameter(this, 'InsightsQueueUrlParam', config.envName, 'eventing', 'insights-queue-url', this.bus.insightsQueue.queueUrl);
    writeParameter(this, 'NotificationQueueUrlParam', config.envName, 'eventing', 'notification-queue-url', this.bus.notificationQueue.queueUrl);
    writeParameter(this, 'AuditQueueUrlParam', config.envName, 'eventing', 'audit-queue-url', this.bus.auditQueue.queueUrl);

    this.exportValue(this.bus.eventBus.eventBusName, { name: this.resourceName('eventbridge-bus-name') });
    this.exportValue(this.bus.insightsQueue.queueArn, { name: this.resourceName('insights-queue-arn') });
    this.exportValue(this.bus.notificationQueue.queueArn, { name: this.resourceName('notification-queue-arn') });
    this.exportValue(this.bus.auditQueue.queueArn, { name: this.resourceName('audit-queue-arn') });
  }
}
