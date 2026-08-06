import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

import type { EnvironmentName, EventingEnvironmentConfig } from '../lib/common/types';
import { resourceName } from '../lib/common/naming';

/**
 * The reusable "EventBridge bus" construct `infra/modules/README.md`
 * already promised before this milestone existed as code
 * ("Reusable CDK constructs... shared across environments"). Implements
 * Blueprint §10.1/§10.2 exactly: one custom Event Bus, three per-consumer
 * SQS queues (`insights-consumer`, `notification-consumer`,
 * `audit-consumer`) subscribed via EventBridge Rules, each queue with its
 * own dead-letter queue for the at-least-once-delivery/idempotent-consumer
 * model §10.5 describes.
 *
 * `[Design Decision]` The "all events" rules match on `source: ['ecclesia.api',
 * 'ecclesia.worker']` - the exact two `Source` values the real, already-
 * built producers use today (`apps/api/src/platform/events/eventbridge-publisher.service.ts`,
 * `apps/worker/src/platform/events/eventbridge-publisher.service.ts` -
 * confirmed by reading both files directly, not assumed), rather than an
 * unconditional catch-all pattern. A new producer service would need a
 * third `source` value added to this list to be picked up - documented
 * here as the one coupling point between this infra construct and the
 * application code's own `Source` string choices.
 */
export interface EngagementSignalBusProps {
  envName: EnvironmentName;
  eventing: EventingEnvironmentConfig;
  removalPolicy: cdk.RemovalPolicy;
}

/** Known EventBridge `Source` values used by real, already-built
 * producers (see this file's own doc comment) - not every module named in
 * Blueprint §10.2's diagram publishes through a distinct source; both
 * `apps/api` and `apps/worker` share one `Source` per app, regardless of
 * which of the six domain modules within that app actually called
 * `publish()`. */
export const KNOWN_EVENT_SOURCES = ['ecclesia.api', 'ecclesia.worker'];

/** Alertable event types the `notification-consumer` queue subscribes to
 * - Blueprint §10.7's own named list. `[Design Decision]` Event-type
 * strings for signals whose exact `DetailType` isn't pinned down verbatim
 * anywhere in the Blueprint text itself (e.g. the Church Pulse decline
 * alert, §10.9) are written here matching this codebase's existing
 * `eventType` naming convention (`libs/contracts/src/lib/event-bus.schemas.ts`'s
 * dot-namespaced style) - flagged as needing reconciliation against the
 * real emitted `eventType` values once `apps/worker`'s alert-emitting
 * sweeps are extended to actually publish them (see
 * `INFRASTRUCTURE_DESIGN_NOTES.md` §5.2 for the full disclosure). Getting
 * one of these strings wrong only means that specific alert type silently
 * never reaches `notification-consumer` (a missed-notification bug to
 * catch via the Blueprint §12.6 synthetic canary once built) - it cannot
 * cause a wrong-recipient or data-leak class of failure, since the
 * `insights-consumer`/`audit-consumer` rules below already receive every
 * event regardless of this list's accuracy. */
export const ALERTABLE_DETAIL_TYPES = [
  'follow_up.sla_breached',
  'pastoral_care.silent_drift_flagged',
  'insights.pulse_decline_alert',
  'ministry.staffing_gap_flagged',
  'stewardship.verification_needed',
  'stewardship.expense_approval_needed',
];

export class EngagementSignalBus extends Construct {
  public readonly eventBus: events.EventBus;
  public readonly insightsQueue: sqs.Queue;
  public readonly notificationQueue: sqs.Queue;
  public readonly auditQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props: EngagementSignalBusProps) {
    super(scope, id);

    this.eventBus = new events.EventBus(this, 'Bus', {
      eventBusName: resourceName(props.envName, 'engagement-signals'),
    });
    // [Known limitation] The default `EVENTBRIDGE_BUS_NAME` baked into
    // apps/worker's env schema ('ecclesia-engagement-signals', no
    // environment prefix) does not match this per-environment, prefixed
    // name - by design, since one bus per environment is the whole point
    // of this stack being environment-parameterized. A future Compute
    // milestone's ECS task definition MUST set EVENTBRIDGE_BUS_NAME
    // explicitly per environment (from this construct's `eventBus.eventBusName`,
    // exposed as a stack output/SSM parameter by `eventing-stack.ts`) -
    // it cannot rely on the application-side default. Documented again,
    // prominently, in DEPLOYMENT.md's manual steps.

    const insights = this.buildQueuePair('Insights', 'insights-consumer', props);
    const notification = this.buildQueuePair('Notification', 'notification-consumer', props);
    const audit = this.buildQueuePair('Audit', 'audit-consumer', props);
    this.insightsQueue = insights.queue;
    this.notificationQueue = notification.queue;
    this.auditQueue = audit.queue;

    new events.Rule(this, 'AllEventsToInsights', {
      eventBus: this.eventBus,
      ruleName: resourceName(props.envName, 'all-events-to-insights'),
      description: 'Blueprint §10.2 - every Engagement Signal, unconditionally, to the Church Pulse computation consumer.',
      eventPattern: { source: KNOWN_EVENT_SOURCES },
      targets: [new targets.SqsQueue(this.insightsQueue)],
    });

    new events.Rule(this, 'AllEventsToAudit', {
      eventBus: this.eventBus,
      ruleName: resourceName(props.envName, 'all-events-to-audit'),
      description: 'Blueprint §10.2 - every Engagement Signal, unconditionally, for compliance-retention audit logging.',
      eventPattern: { source: KNOWN_EVENT_SOURCES },
      targets: [new targets.SqsQueue(this.auditQueue)],
    });

    new events.Rule(this, 'AlertableEventsToNotification', {
      eventBus: this.eventBus,
      ruleName: resourceName(props.envName, 'alertable-events-to-notification'),
      description: 'Blueprint §10.7 - the curated alertable-event subset only, for notification fan-out.',
      eventPattern: { source: KNOWN_EVENT_SOURCES, detailType: ALERTABLE_DETAIL_TYPES },
      targets: [new targets.SqsQueue(this.notificationQueue)],
    });
  }

  private buildQueuePair(logicalName: string, physicalSuffix: string, props: EngagementSignalBusProps): { queue: sqs.Queue; dlq: sqs.Queue } {
    const dlq = new sqs.Queue(this, `${logicalName}Dlq`, {
      queueName: resourceName(props.envName, `${physicalSuffix}-dlq`),
      retentionPeriod: cdk.Duration.days(14),
      removalPolicy: props.removalPolicy,
      enforceSSL: true,
    });

    const queue = new sqs.Queue(this, `${logicalName}Queue`, {
      queueName: resourceName(props.envName, physicalSuffix),
      visibilityTimeout: cdk.Duration.seconds(props.eventing.visibilityTimeoutSeconds),
      removalPolicy: props.removalPolicy,
      enforceSSL: true,
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: props.eventing.maxReceiveCount,
      },
    });

    return { queue, dlq };
  }
}
