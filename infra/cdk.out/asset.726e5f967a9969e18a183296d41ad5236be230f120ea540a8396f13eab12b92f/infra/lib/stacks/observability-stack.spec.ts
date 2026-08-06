import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

import type { EnvironmentConfig } from '../common/types';
import { getEnvironmentConfig } from '../../environments';
import { EventingStack } from './eventing-stack';
import { ObservabilityStack } from './observability-stack';

describe('ObservabilityStack', () => {
  function synth(config: EnvironmentConfig) {
    const app = new cdk.App();
    const env = { account: '111111111111', region: 'eu-west-1' };
    const eventing = new EventingStack(app, 'TestEventingStack', config, { env });
    const stack = new ObservabilityStack(app, 'TestObservabilityStack', config, { env, eventing });
    return Template.fromStack(stack);
  }

  it('creates one alert SNS topic and no email subscription when no address is configured (dev today)', () => {
    const template = synth(getEnvironmentConfig('dev'));
    template.resourceCountIs('AWS::SNS::Topic', 1);
    template.resourceCountIs('AWS::SNS::Subscription', 0);
  });

  it('subscribes the configured email once alerting.email is set', () => {
    const configWithEmail: EnvironmentConfig = {
      ...getEnvironmentConfig('dev'),
      alerting: { email: 'oncall@ecclesia.example' },
    };
    const template = synth(configWithEmail);
    template.resourceCountIs('AWS::SNS::Subscription', 1);
    template.hasResourceProperties('AWS::SNS::Subscription', { Protocol: 'email', Endpoint: 'oncall@ecclesia.example' });
  });

  it('creates six alarms (queue-depth + DLQ-depth for each of the three consumer queues) and one dashboard', () => {
    const template = synth(getEnvironmentConfig('dev'));
    template.resourceCountIs('AWS::CloudWatch::Alarm', 6);
    template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
  });
});
