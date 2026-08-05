import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

import type { EnvironmentConfig } from '../common/types';
import { getEnvironmentConfig } from '../../environments';
import { SesStack } from './ses-stack';

describe('SesStack', () => {
  it('creates a configuration set even when no sending identity is configured (dev today)', () => {
    const app = new cdk.App();
    const stack = new SesStack(app, 'TestSesStack', getEnvironmentConfig('dev'), {
      env: { account: '111111111111', region: 'eu-west-1' },
    });
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::SES::ConfigurationSet', 1);
    template.resourceCountIs('AWS::SES::EmailIdentity', 0);
    expect(stack.emailIdentity).toBeUndefined();
  });

  it('creates an EmailIdentity once emailIdentity is configured', () => {
    const app = new cdk.App();
    const configWithIdentity: EnvironmentConfig = {
      ...getEnvironmentConfig('dev'),
      ses: { emailIdentity: 'noreply@dev.ecclesia.example' },
    };
    const stack = new SesStack(app, 'TestSesStackWithIdentity', configWithIdentity, {
      env: { account: '111111111111', region: 'eu-west-1' },
    });
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::SES::EmailIdentity', 1);
    expect(stack.emailIdentity).toBeDefined();
  });
});
