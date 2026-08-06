import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import type { Construct } from 'constructs';

import { EcclesiaStack } from '../common/ecclesia-stack';
import type { EnvironmentConfig } from '../common/types';
import type { ApiServiceStack } from './api-service-stack';
import type { DatabaseStack } from './database-stack';
import type { ObservabilityStack } from './observability-stack';
import type { WorkerServiceStack } from './worker-service-stack';

export interface RuntimeObservabilityStackProps extends cdk.StackProps {
  /** The Production Infrastructure Foundation milestone's own
   * `ObservabilityStack` - `DO NOT MODIFY` per this milestone's brief.
   * This stack only *reads* its already-public `alertTopic`, exactly the
   * way `IamStack` already reads `EventingStack`'s public `bus` - a
   * cross-stack reference, not an edit to that stack's own file. */
  observability: ObservabilityStack;
  database: DatabaseStack;
  apiService: ApiServiceStack;
  workerService: WorkerServiceStack;
}

/**
 * Cloud Runtime Infrastructure milestone (Milestone 10) §9 - the alarms
 * and dashboard this milestone's own compute/database resources need,
 * that the (protected, un-modified) `ObservabilityStack` could not have
 * created because none of these resources existed when that milestone
 * shipped - exactly the situation that stack's own doc comment predicted
 * ("a natural extension of *this* stack once the Compute & Data
 * Infrastructure milestone ships... just more alarms/widgets referencing
 * that milestone's constructs"). This is that extension, as a new stack
 * (since the existing one is `DO NOT MODIFY`) rather than an edit.
 *
 * **Queue depth alarms already exist** - `ObservabilityStack` already
 * alarms on all three SQS queues' depth and DLQ depth (milestone brief
 * §9's own "Queue depth" bullet) against real, deployed queues since the
 * Production Infrastructure Foundation milestone. Not duplicated here.
 */
export class RuntimeObservabilityStack extends EcclesiaStack {
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, config: EnvironmentConfig, props: RuntimeObservabilityStackProps) {
    super(scope, id, config, props);

    const { observability, database, apiService, workerService } = props;
    const alertTopic = observability.alertTopic;

    this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: this.resourceName('runtime-dashboard'),
    });

    this.dashboard.addWidgets(
      new cloudwatch.TextWidget({
        markdown: [`# Ecclesia Runtime Dashboard - ${config.envName}`, '', 'Milestone 10 (Cloud Runtime Infrastructure): ECS + RDS resources.'].join('\n'),
        width: 24,
        height: 3,
      }),
    );

    const ecsServices = [
      { name: 'Api', service: apiService.fargateService, desiredCount: config.compute.api.desiredCount },
      { name: 'WorkerInsights', service: workerService.insightsConsumer, desiredCount: config.compute.worker.desiredCount },
      { name: 'WorkerNotification', service: workerService.notificationConsumer, desiredCount: config.compute.worker.desiredCount },
      { name: 'WorkerAudit', service: workerService.auditConsumer, desiredCount: config.compute.worker.desiredCount },
    ];

    for (const { name, service, desiredCount } of ecsServices) {
      const cpuMetric = service.service.metricCpuUtilization({ period: cdk.Duration.minutes(5) });
      const memoryMetric = service.service.metricMemoryUtilization({ period: cdk.Duration.minutes(5) });

      const cpuAlarm = new cloudwatch.Alarm(this, `${name}CpuAlarm`, {
        alarmName: this.resourceName(`${name.toLowerCase()}-cpu-high`),
        metric: cpuMetric,
        threshold: 85,
        evaluationPeriods: 3,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: `Milestone 10 §9 - ${name} ECS service CPU sustained above 85%.`,
      });
      cpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

      const memoryAlarm = new cloudwatch.Alarm(this, `${name}MemoryAlarm`, {
        alarmName: this.resourceName(`${name.toLowerCase()}-memory-high`),
        metric: memoryMetric,
        threshold: 85,
        evaluationPeriods: 3,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: `Milestone 10 §9 - ${name} ECS service memory sustained above 85% (apps/api's own HealthController RSS ceiling is a related, application-level signal - see INFRA_RUNTIME.md's sizing note).`,
      });
      memoryAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

      // "Task failures" (milestone brief §9's own bullet): a service
      // running fewer tasks than desired for a sustained period means
      // tasks are failing to start or failing health checks repeatedly -
      // the ECS deployment circuit breaker (`FargateService`'s own
      // `circuitBreaker` setting) handles rolling back a bad deployment,
      // this alarm is the human-visible signal something is still wrong.
      const runningTaskCountAlarm = new cloudwatch.Alarm(this, `${name}RunningTaskCountAlarm`, {
        alarmName: this.resourceName(`${name.toLowerCase()}-running-task-count-low`),
        metric: service.service.metric('RunningTaskCount', { period: cdk.Duration.minutes(5), statistic: 'Minimum' }),
        threshold: desiredCount,
        evaluationPeriods: 3,
        comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
        alarmDescription: `Milestone 10 §9 - ${name} ECS service running fewer tasks than desired (${desiredCount}) for a sustained period - task failures.`,
      });
      runningTaskCountAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

      this.dashboard.addWidgets(
        new cloudwatch.GraphWidget({ title: `${name} CPU / Memory`, left: [cpuMetric, memoryMetric], width: 12, height: 6 }),
      );
    }

    // RDS health (milestone brief §9's own "Database health" bullet).
    const dbCpuAlarm = new cloudwatch.Alarm(this, 'DatabaseCpuAlarm', {
      alarmName: this.resourceName('database-cpu-high'),
      metric: database.instance.metricCPUUtilization({ period: cdk.Duration.minutes(5) }),
      threshold: 85,
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Milestone 10 §9 - RDS CPU sustained above 85%.',
    });
    dbCpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    const dbStorageAlarm = new cloudwatch.Alarm(this, 'DatabaseFreeStorageAlarm', {
      alarmName: this.resourceName('database-free-storage-low'),
      metric: database.instance.metricFreeStorageSpace({ period: cdk.Duration.minutes(5) }),
      threshold: 2 * 1024 * 1024 * 1024, // 2 GiB
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Milestone 10 §9 - RDS free storage below 2 GiB - storage autoscaling (maxAllocatedStorageGb) should absorb this, but a sustained breach means it is not keeping up.',
    });
    dbStorageAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    const dbConnectionsAlarm = new cloudwatch.Alarm(this, 'DatabaseConnectionsAlarm', {
      alarmName: this.resourceName('database-connections-high'),
      metric: database.instance.metricDatabaseConnections({ period: cdk.Duration.minutes(5) }),
      threshold: 80,
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `Milestone 10 §9 - RDS connection count sustained above 80 - approaching ${config.database.instanceType}'s max_connections ceiling.`,
    });
    dbConnectionsAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    const dbFreeableMemoryAlarm = new cloudwatch.Alarm(this, 'DatabaseFreeableMemoryAlarm', {
      alarmName: this.resourceName('database-freeable-memory-low'),
      metric: database.instance.metricFreeableMemory({ period: cdk.Duration.minutes(5), statistic: 'Minimum' }),
      threshold: 256 * 1024 * 1024, // 256 MiB
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Milestone 10 §9 - RDS freeable memory below 256 MiB.',
    });
    dbFreeableMemoryAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'RDS CPU / Connections',
        left: [database.instance.metricCPUUtilization(), database.instance.metricDatabaseConnections()],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'RDS Free Storage / Freeable Memory',
        left: [database.instance.metricFreeStorageSpace(), database.instance.metricFreeableMemory()],
        width: 12,
        height: 6,
      }),
    );
  }
}
