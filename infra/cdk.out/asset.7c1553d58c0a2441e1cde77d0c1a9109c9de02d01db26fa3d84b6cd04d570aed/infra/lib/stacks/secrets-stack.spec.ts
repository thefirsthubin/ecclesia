import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

import { getEnvironmentConfig } from '../../environments';
import { SecretsStack } from './secrets-stack';

describe('SecretsStack', () => {
  function synth() {
    const app = new cdk.App();
    const stack = new SecretsStack(app, 'TestSecretsStack', getEnvironmentConfig('dev'), {
      env: { account: '111111111111', region: 'eu-west-1' },
    });
    return Template.fromStack(stack);
  }

  it('creates exactly three secrets - database credentials, Mobile Money, SMS gateway', () => {
    const template = synth();
    template.resourceCountIs('AWS::SecretsManager::Secret', 3);
  });

  it('generates a real random password for database credentials, never a hardcoded value', () => {
    const template = synth();
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'ecclesia-dev-database-credentials',
      GenerateSecretString: { GenerateStringKey: 'password' },
    });
  });
});
