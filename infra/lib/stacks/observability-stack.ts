import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import type { Construct } from 'constructs';

import { EcclesiaStack } from '../common/ecclesia-stack';
import type { EnvironmentConfig } from '../common/types';
import type { EventingStack } from './eventing-stack';

export interface ObservabilityStackProps extends cdk.StackProps {
  eventing: EventingStack;
}

/**
 * CloudWatch - Blueprint §12 (Observability). This milestone builds the
 * two pieces that are real and useful *today*, given no ECS/RDS stack
 * exists yet (`INFRASTRUCTURE_DESIGN_NOTES.md` §7):
 *
 * 1. **The single on-call alert channel** (§12.7: "alerting is routed
 *    through a single on-call channel... rather than a multi-tier NOC
 *    structure") - one SNS topic per environment, with an email
 *    subscription if `config.alerting.email` is confirmed.
 * 2. **Real alarms on the SQS queues `EventingStack` actually creates**
 *    (§12.4's "SQS queue depth and age-of-oldest-message (Worker backlog
 *    indicator)") - these are genuine, deployable alarms against real
 *    resources, not placeholders, because the queues exist in this same
 *    milestone.
 *
 * `[Known limitation]` Explicitly **not** built here, and not faked as
 * placeholders: ECS/RDS-metric alarms and dashboard widgets (§12.4's SRE
 * dashboard, §12.5's SLOs) - none of those resources exist yet. Adding
 * them is a natural extension of *this* stack once the Compute & Data
 * Infrastructure milestone ships (no new stack needed, just more alarms/
 * widgets referencing that milestone's constructs) - see
 * `INFRASTRUCTURE_DESIGN_NOTES.md` §7.
 */
export class ObservabilityStack extends EcclesiaStack {
  public readonly alertTopic: sns.Topic;
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, config: EnvironmentConfig, props: ObservabilityStackProps) {
    super(scope, id, config, props);

    this.alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: this.resourceName('alerts'),
      displayName: `Ecclesia ${config.envName} alerts`,
    });

    if (config.alerting.email) {
      this.alertTopic.addSubscription(new subscriptions.EmailSubscription(config.alerting.email));
    }
    // [Known limitation] No email confirmed yet for any environment - see
    // this milestone's final summary "manual AWS steps still required."
    // The topic exists regardless, so `aws sns subscribe` (or setting
    // config.alerting.email and redeploying) is all a real on-call
    // address needs later - no stack change required.

    const { insightsQueue, notificationQueue, auditQueue } = props.eventing.bus;
    const namedQueues = [
      { name: 'Insights', queue: insightsQueue },
      { name: 'Notification', queue: notificationQueue },
      { name: 'Audit', queue: auditQueue },
    ];

    this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: this.resourceName('sre-dashboard'),
    });

    this.dashboard.addWidgets(
      new cloudwatch.TextWidget({
        markdown: [
          `# Ecclesia SRE Dashboard - ${config.envName}`,
          '',
          'Blueprint §12.4. **Only SQS widgets exist today** - ECS/RDS widgets',
          'are added once the Compute & Data Infrastructure milestone ships',
          '(`INFRASTRUCTURE_DESIGN_NOTES.md` §7). This is a disclosed, not',
          'silent, gap.',
        ].join('\n'),
        width: 24,
        height: 4,
      }),
    );

    for (const { name, queue } of namedQueues) {
      const depthAlarm = new cloudwatch.Alarm(this, `${name}QueueDepthAlarm`, {
        alarmName: this.resourceName(`${name.toLowerCase()}-queue-depth`),
        metric: queue.metricApproximateNumberOfMessagesVisible({ period: cdk.Duration.minutes(5), statistic: 'Maximum' }),
        threshold: 100,
        evaluationPeriods: 3,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: `Blueprint §12.4 Worker backlog indicator - ${name} queue depth sustained above threshold.`,
      });
      depthAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));

      const dlq = queue.deadLetterQueue!.queue;
      const dlqAlarm = new cloudwatch.Alarm(this, `${name}DlqDepthAlarm`, {
        alarmName: this.resourceName(`${name.toLowerCase()}-dlq-depth`),
        metric: dlq.metricApproximateNumberOfMessagesVisible({ period: cdk.Duration.minutes(5), statistic: 'Maximum' }),
        threshold: 0,
        evaluationPeriods: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: `Blueprint §10.5 - any message on the ${name} DLQ means a consumer failed repeatedly and needs investigation, not silent accumulation.`,
      });
      dlqAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));

      this.dashboard.addWidgets(
        new cloudwatch.GraphWidget({ title: `${name} queue depth`, left: [queue.metricApproximateNumberOfMessagesVisible()], width: 12, height: 6 }),
        new cloudwatch.GraphWidget({
          title: `${name} oldest message age (Blueprint §12.4 backlog indicator)`,
          left: [queue.metricApproximateAgeOfOldestMessage()],
          width: 12,
          height: 6,
        }),
      );
    }

    new cdk.CfnOutput(this, 'AlertTopicArnOutput', { value: this.alertTopic.topicArn });
  }
}
