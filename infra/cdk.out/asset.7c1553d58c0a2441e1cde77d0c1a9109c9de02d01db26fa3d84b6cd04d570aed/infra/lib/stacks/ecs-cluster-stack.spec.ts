import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

import { getEnvironmentConfig } from '../../environments';
import { EcsClusterStack } from './ecs-cluster-stack';
import { NetworkStack } from './network-stack';

describe('EcsClusterStack', () => {
  function synth() {
    const app = new cdk.App();
    const config = getEnvironmentConfig('dev');
    const env = { account: '111111111111', region: 'eu-west-1' };
    const network = new NetworkStack(app, 'TestNetworkStack', config, { env });
    const stack = new EcsClusterStack(app, 'TestEcsClusterStack', config, { env, network });
    return { stack, template: Template.fromStack(stack) };
  }

  it('creates exactly one ECS cluster with Container Insights enabled (Milestone 10 §9)', () => {
    const { template } = synth();
    template.resourceCountIs('AWS::ECS::Cluster', 1);
    template.hasResourceProperties('AWS::ECS::Cluster', {
      ClusterSettings: [{ Name: 'containerInsights', Value: 'enabled' }],
    });
  });

  it('registers FARGATE and FARGATE_SPOT as capacity providers', () => {
    const { template } = synth();
    template.hasResourceProperties('AWS::ECS::ClusterCapacityProviderAssociations', {
      CapacityProviders: ['FARGATE', 'FARGATE_SPOT'],
    });
  });
});
