import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';

import { getEnvironmentConfig } from '../../environments';
import { CognitoStack } from './cognito-stack';

describe('CognitoStack', () => {
  function synth() {
    const app = new cdk.App();
    const stack = new CognitoStack(app, 'TestCognitoStack', getEnvironmentConfig('dev'), {
      env: { account: '111111111111', region: 'eu-west-1' },
    });
    return Template.fromStack(stack);
  }

  it('creates exactly one User Pool, self sign-up disabled, both email and phone as sign-in aliases', () => {
    const template = synth();
    template.resourceCountIs('AWS::Cognito::UserPool', 1);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      AdminCreateUserConfig: { AllowAdminCreateUserOnly: true },
      AutoVerifiedAttributes: Match.arrayWith(['email', 'phone_number']),
    });
  });

  it('creates exactly two app clients (mobile, web-admin), neither generating a client secret', () => {
    const template = synth();
    template.resourceCountIs('AWS::Cognito::UserPoolClient', 2);
    template.allResourcesProperties('AWS::Cognito::UserPoolClient', {
      GenerateSecret: false,
    });
  });

  it('enables the custom auth flow on the mobile client (Blueprint §8.2 phone-OTP surface)', () => {
    const template = synth();
    template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
      ExplicitAuthFlows: Match.arrayWith(['ALLOW_CUSTOM_AUTH']),
    });
  });

  it('enables SRP (not plain USER_PASSWORD_AUTH) on the web-admin client', () => {
    const template = synth();
    template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
      ExplicitAuthFlows: Match.arrayWith(['ALLOW_USER_SRP_AUTH']),
    });
  });
});
