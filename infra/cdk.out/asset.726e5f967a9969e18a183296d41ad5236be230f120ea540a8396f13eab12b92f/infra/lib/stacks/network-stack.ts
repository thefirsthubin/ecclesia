import type * as cdk from 'aws-cdk-lib';
import type { Construct } from 'constructs';

import { EcclesiaStack } from '../common/ecclesia-stack';
import { writeParameter } from '../common/parameters';
import type { EnvironmentConfig } from '../common/types';
import { Network } from '../constructs/network.construct';

/**
 * Cloud Runtime Infrastructure milestone (Milestone 10) §1. Thin stack
 * wrapper around the reusable `Network` construct (`infra/lib/constructs/`)
 * - mirrors `EventingStack`'s own relationship to `EngagementSignalBus`
 * (`eventing-stack.ts`'s doc comment): this stack's job is environment
 * wiring and publishing the VPC/subnet/security-group identifiers every
 * downstream stack (Database, EcsCluster, Alb, ApiService, WorkerService)
 * needs, not the network topology itself.
 */
export class NetworkStack extends EcclesiaStack {
  public readonly network: Network;

  constructor(scope: Construct, id: string, config: EnvironmentConfig, props?: cdk.StackProps) {
    super(scope, id, config, props);

    this.network = new Network(this, 'Network', {
      envName: config.envName,
      networking: config.networking,
      region: config.region,
    });

    writeParameter(this, 'VpcIdParam', config.envName, 'networking', 'vpc-id', this.network.vpc.vpcId);

    this.exportValue(this.network.vpc.vpcId, { name: this.resourceName('vpc-id') });
  }
}
