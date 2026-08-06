import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';

import { getEnvironmentConfig } from '../../environments';
import { AlbStack } from './alb-stack';
import { ApiServiceStack } from './api-service-stack';
import { CognitoStack } from './cognito-stack';
import { DatabaseStack } from './database-stack';
import { EcsClusterStack } from './ecs-cluster-stack';
import { EventingStack } from './eventing-stack';
import { IamStack } from './iam-stack';
import { NetworkStack } from './network-stack';
import { SecretsStack } from './secrets-stack';
import { SesStack } from './ses-stack';

describe('ApiServiceStack', () => {
  function synth() {
    const app = new cdk.App();
    const config = getEnvironmentConfig('dev');
    const env = { account: '111111111111', region: 'eu-west-1' };
    const network = new NetworkStack(app, 'TestNetworkStack', config, { env });
    const eventing = new EventingStack(app, 'TestEventingStack', config, { env });
    const secrets = new SecretsStack(app, 'TestSecretsStack', config, { env });
    const ses = new SesStack(app, 'TestSesStack', config, { env });
    const cognito = new CognitoStack(app, 'TestCognitoStack', config, { env });
    const iam = new IamStack(app, 'TestIamStack', config, { env, eventing, secrets, ses });
    const database = new DatabaseStack(app, 'TestDatabaseStack', config, { env, network, secrets });
    const cluster = new EcsClusterStack(app, 'TestEcsClusterStack', config, { env, network });
    const alb = new AlbStack(app, 'TestAlbStack', config, { env, network });
    const stack = new ApiServiceStack(app, 'TestApiServiceStack', config, {
      env,
      network,
      cluster,
      alb,
      database,
      iam,
      cognito,
      eventing,
      secrets,
    });
    return { stack, alb, template: Template.fromStack(stack) };
  }

  it('creates exactly one Fargate service and task definition', () => {
    const { template } = synth();
    template.resourceCountIs('AWS::ECS::Service', 1);
    template.resourceCountIs('AWS::ECS::TaskDefinition', 1);
    template.hasResourceProperties('AWS::ECS::TaskDefinition', { RequiresCompatibilities: ['FARGATE'] });
  });

  it('injects DB_MASTER_PASSWORD/DB_APP_PASSWORD via ECS secrets, not plaintext environment', () => {
    const { template } = synth();
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Secrets: Match.arrayWith([Match.objectLike({ Name: 'DB_MASTER_PASSWORD' }), Match.objectLike({ Name: 'DB_APP_PASSWORD' })]),
        }),
      ]),
    });
  });

  it('does not put DB passwords in plaintext Environment', () => {
    const { template } = synth();
    const taskDefs = template.findResources('AWS::ECS::TaskDefinition');
    const [def] = Object.values(taskDefs);
    const container = (def as { Properties: { ContainerDefinitions: Array<{ Environment?: Array<{ Name: string }> }> } }).Properties.ContainerDefinitions[0];
    const envNames = (container.Environment ?? []).map((e) => e.Name);
    expect(envNames).not.toContain('DB_MASTER_PASSWORD');
    expect(envNames).not.toContain('DB_APP_PASSWORD');
  });

  it('registers a target group attached to the ALB listener with a /health health check', () => {
    // `listener.addTargets()` (attachToAlb(), fargate-service.construct.ts)
    // creates the target group as a child of the *listener's own* scope -
    // AlbStack, not this stack - so the resource is asserted against
    // AlbStack's template, confirmed by inspecting a real synthesized
    // template rather than assumed.
    const { alb } = synth();
    const albTemplate = Template.fromStack(alb);
    albTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      HealthCheckPath: '/health',
      Port: 3000,
    });
  });
});
