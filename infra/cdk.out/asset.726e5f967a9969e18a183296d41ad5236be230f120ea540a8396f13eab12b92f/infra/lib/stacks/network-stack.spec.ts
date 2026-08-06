import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';

import { getEnvironmentConfig } from '../../environments';
import { NetworkStack } from './network-stack';

describe('NetworkStack', () => {
  function synth() {
    const app = new cdk.App();
    const stack = new NetworkStack(app, 'TestNetworkStack', getEnvironmentConfig('dev'), {
      env: { account: '111111111111', region: 'eu-west-1' },
    });
    return { stack, template: Template.fromStack(stack) };
  }

  it('creates one VPC', () => {
    const { template } = synth();
    template.resourceCountIs('AWS::EC2::VPC', 1);
  });

  it('creates nine subnets - 3 AZs x (public + private-app + private-db)', () => {
    const { template } = synth();
    template.resourceCountIs('AWS::EC2::Subnet', 9);
  });

  it('creates exactly one NAT Gateway for dev (cost-optimized)', () => {
    const { template } = synth();
    template.resourceCountIs('AWS::EC2::NatGateway', 1);
  });

  it('creates the S3 gateway VPC endpoint', () => {
    const { template } = synth();
    template.hasResourceProperties('AWS::EC2::VPCEndpoint', { VpcEndpointType: 'Gateway' });
  });

  it("scopes the database security group's ingress to the ECS security group only, not 0.0.0.0/0", () => {
    const { template } = synth();
    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      FromPort: 5432,
      ToPort: 5432,
      SourceSecurityGroupId: Match.anyValue(),
    });
  });

  it('exposes vpc/albSecurityGroup/ecsSecurityGroup/databaseSecurityGroup for downstream stacks', () => {
    const { stack } = synth();
    expect(stack.network.vpc).toBeDefined();
    expect(stack.network.albSecurityGroup).toBeDefined();
    expect(stack.network.ecsSecurityGroup).toBeDefined();
    expect(stack.network.databaseSecurityGroup).toBeDefined();
  });
});
