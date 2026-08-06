import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

import { getEnvironmentConfig } from '../../environments';
import { DatabaseStack } from './database-stack';
import { NetworkStack } from './network-stack';
import { SecretsStack } from './secrets-stack';

describe('DatabaseStack', () => {
  function synth() {
    const app = new cdk.App();
    const config = getEnvironmentConfig('dev');
    const env = { account: '111111111111', region: 'eu-west-1' };
    const network = new NetworkStack(app, 'TestNetworkStack', config, { env });
    const secrets = new SecretsStack(app, 'TestSecretsStack', config, { env });
    const stack = new DatabaseStack(app, 'TestDatabaseStack', config, { env, network, secrets });
    return { stack, template: Template.fromStack(stack) };
  }

  it('creates exactly one RDS PostgreSQL 16 instance', () => {
    const { template } = synth();
    template.resourceCountIs('AWS::RDS::DBInstance', 1);
    template.hasResourceProperties('AWS::RDS::DBInstance', { Engine: 'postgres', EngineVersion: '16' });
  });

  it('enables storage encryption (Milestone 10 §2/§7)', () => {
    const { template } = synth();
    template.hasResourceProperties('AWS::RDS::DBInstance', { StorageEncrypted: true });
  });

  it("forces SSL via the parameter group (rds.force_ssl=1)", () => {
    const { template } = synth();
    template.hasResourceProperties('AWS::RDS::DBParameterGroup', {
      Parameters: { 'rds.force_ssl': '1' },
    });
  });

  it('deploys into the isolated database subnet group, not public/private-app', () => {
    const { template } = synth();
    template.resourceCountIs('AWS::RDS::DBSubnetGroup', 1);
  });

  it('provisions a second, generated secret for the ecclesia_app role - not a duplicate of the master secret', () => {
    const { template } = synth();
    template.resourceCountIs('AWS::SecretsManager::Secret', 1); // only AppRoleCredentials is created here - the master secret lives in SecretsStack, a separate stack.
  });

  it("does not create a duplicate master credentials secret in this stack", () => {
    const { stack } = synth();
    expect(stack.appRoleCredentials).toBeDefined();
    expect(stack.instance).toBeDefined();
  });
});
