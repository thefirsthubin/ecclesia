import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import type { Construct } from 'constructs';

import { EcclesiaStack } from '../common/ecclesia-stack';
import { writeParameter } from '../common/parameters';
import type { EnvironmentConfig } from '../common/types';
import type { NetworkStack } from './network-stack';

export interface EcsClusterStackProps extends cdk.StackProps {
  network: NetworkStack;
}

/**
 * Cloud Runtime Infrastructure milestone (Milestone 10) §3 - the shared
 * ECS Fargate cluster `ApiServiceStack`/`WorkerServiceStack` deploy their
 * services onto. One cluster per environment (matches every other stack's
 * environment-scoping convention), holding all four Fargate services this
 * milestone creates (1 API + 3 Worker consumers).
 *
 * `containerInsights: true` - the milestone's own §9 Monitoring
 * requirement ("Container Insights").
 *
 * Capacity providers: `FARGATE` and `FARGATE_SPOT`, both enabled, with a
 * default capacity provider strategy weighted entirely to on-demand
 * `FARGATE` (weight 1) and zero `FARGATE_SPOT` - Spot capacity is
 * available to any service that opts in with its own strategy override
 * later (a real cost-saving lever for the Worker's queue-consumer
 * services, which can tolerate an occasional Spot interruption far better
 * than the API's user-facing service can), but nothing defaults onto Spot
 * silently in this milestone.
 */
export class EcsClusterStack extends EcclesiaStack {
  public readonly cluster: ecs.Cluster;

  constructor(scope: Construct, id: string, config: EnvironmentConfig, props: EcsClusterStackProps) {
    super(scope, id, config, props);

    this.cluster = new ecs.Cluster(this, 'Cluster', {
      clusterName: this.resourceName('cluster'),
      vpc: props.network.network.vpc,
      containerInsightsV2: ecs.ContainerInsights.ENABLED,
      // Registers FARGATE/FARGATE_SPOT as usable capacity providers on
      // this cluster - required before addDefaultCapacityProviderStrategy()
      // below can reference them (confirmed via a real cdk synth: without
      // this, CDK throws MustBeCapacityProviderAdded).
      enableFargateCapacityProviders: true,
    });

    this.cluster.addDefaultCapacityProviderStrategy([{ capacityProvider: 'FARGATE', weight: 1 }, { capacityProvider: 'FARGATE_SPOT', weight: 0 }]);

    writeParameter(this, 'ClusterNameParam', config.envName, 'ecs', 'cluster-name', this.cluster.clusterName);

    new cdk.CfnOutput(this, 'ClusterNameOutput', { value: this.cluster.clusterName });
  }
}
