import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

import { getEnvironmentConfig } from '../../environments';
import { EventingStack } from './eventing-stack';

describe('EventingStack', () => {
  function synth() {
    const app = new cdk.App();
    const stack = new EventingStack(app, 'TestEventingStack', getEnvironmentConfig('dev'), {
      env: { account: '111111111111', region: 'eu-west-1' },
    });
    return { stack, template: Template.fromStack(stack) };
  }

  it('creates exactly one custom Event Bus, environment-prefixed', () => {
    const { template } = synth();
    template.resourceCountIs('AWS::Events::EventBus', 1);
    template.hasResourceProperties('AWS::Events::EventBus', { Name: 'ecclesia-dev-engagement-signals' });
  });

  it('creates three consumer queues and three dead-letter queues (Blueprint §10.2/§10.5)', () => {
    const { template } = synth();
    template.resourceCountIs('AWS::SQS::Queue', 6);
  });

  it('creates three EventBridge Rules - all-to-insights, all-to-audit, alertable-to-notification', () => {
    const { template } = synth();
    template.resourceCountIs('AWS::Events::Rule', 3);
  });

  it('exposes the bus and all three queues on the stack for downstream stacks (IamStack, ObservabilityStack) to reference', () => {
    const { stack } = synth();
    expect(stack.bus.eventBus).toBeDefined();
    expect(stack.bus.insightsQueue).toBeDefined();
    expect(stack.bus.notificationQueue).toBeDefined();
    expect(stack.bus.auditQueue).toBeDefined();
  });
});
