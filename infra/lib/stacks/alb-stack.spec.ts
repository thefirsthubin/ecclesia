import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

import { getEnvironmentConfig } from '../../environments';
import { AlbStack } from './alb-stack';
import { NetworkStack } from './network-stack';

describe('AlbStack', () => {
  function synth() {
    const app = new cdk.App();
    const config = getEnvironmentConfig('dev');
    const env = { account: '111111111111', region: 'eu-west-1' };
    const network = new NetworkStack(app, 'TestNetworkStack', config, { env });
    const stack = new AlbStack(app, 'TestAlbStack', config, { env, network });
    return { stack, template: Template.fromStack(stack) };
  }

  it('creates exactly one internet-facing Application Load Balancer', () => {
    const { template } = synth();
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', { Scheme: 'internet-facing', Type: 'application' });
  });

  it('creates only an HTTP listener when no certificate is configured (dev has none)', () => {
    const { template } = synth();
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 1);
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', { Port: 80, Protocol: 'HTTP' });
  });

  it('exposes httpListener but not httpsListener when no certificate is configured', () => {
    const { stack } = synth();
    expect(stack.httpListener).toBeDefined();
    expect(stack.httpsListener).toBeUndefined();
  });
});
