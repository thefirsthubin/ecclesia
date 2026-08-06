import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

import { getEnvironmentConfig } from '../../environments';
import { DatabaseStack } from './database-stack';
import { EcsClusterStack } from './ecs-cluster-stack';
import { EventingStack } from './eventing-stack';
import { IamStack } from './iam-stack';
import { NetworkStack } from './network-stack';
import { SecretsStack } from './secrets-stack';
import { SesStack } from './ses-stack';
import { WorkerServiceStack } from './worker-service-stack';

describe('WorkerServiceStack', () => {
  function synth() {
    const app = new cdk.App();
    const config = getEnvironmentConfig('dev');
    const env = { account: '111111111111', region: 'eu-west-1' };
    const network = new NetworkStack(app, 'TestNetworkStack', config, { env });
    const eventing = new EventingStack(app, 'TestEventingStack', config, { env });
    const secrets = new SecretsStack(app, 'TestSecretsStack', config, { env });
    const ses = new SesStack(app, 'TestSesStack', config, { env });
    const iam = new IamStack(app, 'TestIamStack', config, { env, eventing, secrets, ses });
    const database = new DatabaseStack(app, 'TestDatabaseStack', config, { env, network, secrets });
    const cluster = new EcsClusterStack(app, 'TestEcsClusterStack', config, { env, network });
    const stack = new WorkerServiceStack(app, 'TestWorkerServiceStack', config, {
      env,
      network,
      cluster,
      database,
      iam,
      eventing,
      secrets,
    });
    return { stack, template: Template.fromStack(stack) };
  }

  it('creates exactly three Fargate services - one per SQS consumer', () => {
    const { template } = synth();
    template.resourceCountIs('AWS::ECS::Service', 3);
    template.resourceCountIs('AWS::ECS::TaskDefinition', 3);
  });

  it("each task definition's container command names the right worker subcommand", () => {
    const { template } = synth();
    const commands = Object.values(template.findResources('AWS::ECS::TaskDefinition')).map(
      (def) => (def as { Properties: { ContainerDefinitions: Array<{ Command: string[] }> } }).Properties.ContainerDefinitions[0].Command,
    );
    expect(commands).toContainEqual(['node', 'main.js', 'consume:insights']);
    expect(commands).toContainEqual(['node', 'main.js', 'consume:notification']);
    expect(commands).toContainEqual(['node', 'main.js', 'consume:audit']);
  });

  it('none of the three services has a load balancer target group (no inbound traffic)', () => {
    const { template } = synth();
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 0);
  });

  it('exposes all three consumer FargateService constructs', () => {
    const { stack } = synth();
    expect(stack.insightsConsumer).toBeDefined();
    expect(stack.notificationConsumer).toBeDefined();
    expect(stack.auditConsumer).toBeDefined();
  });
});
