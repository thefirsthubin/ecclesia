import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

import type { EnvironmentName, NetworkingEnvironmentConfig } from '../common/types';

export interface NetworkProps {
  envName: EnvironmentName;
  networking: NetworkingEnvironmentConfig;
  /** The environment's AWS region (`EnvironmentConfig.region`) - used to
   * derive explicit availability zone names below. See this class's own
   * doc comment on why. */
  region: string;
}

/**
 * Cloud Runtime Infrastructure milestone (Milestone 10) - the reusable VPC
 * construct `NetworkStack` wraps. A "reusable construct" per the
 * milestone's own architecture requirement: all environment-specific
 * behavior comes in through `NetworkProps`, nothing is hardcoded here.
 *
 * Three subnet tiers, matching the milestone's architecture diagram
 * (`Internet -> ALB -> ECS -> RDS`) and Blueprint §11.3's network
 * architecture:
 *
 * 1. **Public** - the ALB only. Has a route to the Internet Gateway.
 * 2. **Private (with egress)** - ECS Fargate tasks. No direct inbound
 *    route from the internet (the ALB is the only path in), but routed
 *    through a NAT Gateway for outbound calls Fargate tasks genuinely
 *    need: pulling container images from ECR, calling Cognito/
 *    EventBridge/SQS/Secrets Manager/CloudWatch APIs (none of which have
 *    interface VPC endpoints provisioned in this milestone - see the
 *    "Optional VPC Endpoints" note below).
 * 3. **Private (isolated)** - RDS only. No route to the internet at all,
 *    in either direction - the most restrictive tier CDK offers, matching
 *    the milestone's "Private Database Subnets" requirement literally
 *    (`SUBNET_ISOLATED`, not merely "private with a NAT it happens not to
 *    use").
 *
 * `[Design Decision]` **VPC Endpoints**: the milestone brief lists these as
 * "Optional." Only the S3 gateway endpoint is provisioned here - it is
 * free (gateway endpoints, unlike interface endpoints, carry no hourly or
 * per-GB charge) and directly reduces NAT Gateway data-transfer cost for
 * ECR image layer pulls (ECR backs onto S3 for layer storage). Interface
 * endpoints for ECR/Secrets Manager/CloudWatch Logs/EventBridge would
 * remove the NAT Gateway as a dependency entirely (tighter network
 * isolation - Fargate tasks could then reach every AWS API they need
 * without any internet path), but each interface endpoint costs a hard
 * per-AZ-per-hour charge regardless of usage - a real, disclosed cost
 * trade-off deferred to a future pass once real traffic volumes justify
 * it, not silently assumed unnecessary. See `INFRA_RUNTIME.md`'s
 * networking section.
 */
export class Network extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly albSecurityGroup: ec2.SecurityGroup;
  public readonly ecsSecurityGroup: ec2.SecurityGroup;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkProps) {
    super(scope, id);

    const { envName, networking, region } = props;

    // `[Bug fix, found via a real cdk synth]` `maxAzs` alone does *not*
    // guarantee 3 AZs: with no concrete AWS account in scope at synth
    // time (`EnvironmentConfig.account` is `undefined` in every
    // environment today - Production Infrastructure Foundation's own
    // disclosed placeholder), CDK cannot look up how many AZs a region
    // really has, and silently falls back to a safe default of 2 -
    // confirmed by inspecting a real synthesized template, which produced
    // 6 subnets (2 AZs x 3 tiers), not the 9 this construct's own
    // subnetConfiguration implies (3 AZs x 3 tiers). Explicit
    // `availabilityZones` sidesteps the lookup entirely and guarantees
    // exactly `networking.maxAzs` AZs regardless of account context -
    // derived from `region` (already per-environment configuration, not a
    // new hardcoded value) rather than a literal AZ list, so this stays
    // correct if `region` ever changes.
    const availabilityZones = Array.from({ length: networking.maxAzs }, (_, i) => `${region}${String.fromCharCode(97 + i)}`);

    this.vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: `ecclesia-${envName}-vpc`,
      availabilityZones,
      natGateways: networking.natGateways,
      subnetConfiguration: [
        { name: 'public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
        { name: 'private-app', subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, cidrMask: 24 },
        { name: 'private-db', subnetType: ec2.SubnetType.PRIVATE_ISOLATED, cidrMask: 24 },
      ],
    });

    // Free gateway endpoint - see this class's own doc comment.
    this.vpc.addGatewayEndpoint('S3Endpoint', { service: ec2.GatewayVpcEndpointAwsService.S3 });

    this.albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `ecclesia-${envName}-alb-sg`,
      description: 'Application Load Balancer - allows inbound HTTP/HTTPS from the internet, per Milestone 10 §6/§7.',
      allowAllOutbound: true,
    });
    this.albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'HTTP from the internet');
    this.albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'HTTPS from the internet (once a certificate is configured)');

    this.ecsSecurityGroup = new ec2.SecurityGroup(this, 'EcsSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `ecclesia-${envName}-ecs-sg`,
      description: 'ECS Fargate tasks (apps/api, apps/worker) - inbound only from the ALB, per Milestone 10 §7 (least privilege).',
      allowAllOutbound: true, // Fargate tasks need outbound to ECR/Cognito/EventBridge/SQS/Secrets Manager/RDS - see this construct's own doc comment on why those aren't endpoint-scoped yet.
    });

    this.databaseSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `ecclesia-${envName}-db-sg`,
      description: 'RDS PostgreSQL - inbound only from the ECS security group on 5432, per Milestone 10 §7 (private database, least privilege).',
      allowAllOutbound: false,
    });
    this.databaseSecurityGroup.addIngressRule(this.ecsSecurityGroup, ec2.Port.tcp(5432), 'PostgreSQL from ECS Fargate tasks only');

    // apps/api's ALB target group listens on the container port (3000,
    // env.schema.ts's own PORT default) - the ALB reaches ECS tasks on
    // that port, nothing else.
    this.ecsSecurityGroup.addIngressRule(this.albSecurityGroup, ec2.Port.tcp(3000), 'API container port from the ALB only');

    cdk.Tags.of(this.vpc).add('Name', `ecclesia-${envName}-vpc`);
  }
}
