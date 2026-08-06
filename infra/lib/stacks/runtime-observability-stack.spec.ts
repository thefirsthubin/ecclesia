import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

import { getEnvironmentConfig } from '../../environments';
import { AlbStack } from './alb-stack';
import { ApiServiceStack } from './api-service-stack';
import { CognitoStack } from './cognito-stack';
import { DatabaseStack } from './database-stack';
import { EcsClusterStack } from './ecs-cluster-stack';
import { EventingStack } from './eventing-stack';
import { IamStack } from './iam-stack';
import { NetworkStack } from './network-stack';
import { ObservabilityStack } from './observability-stack';
import { RuntimeObservabilityStack } from './runtime-observability-stack';
import { SecretsStack } from './secrets-stack';
import { SesStack } from './ses-stack';
import { WorkerServiceStack } from './worker-service-stack';

describe('RuntimeObservabilityStack', () => {
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
    const observability = new ObservabilityStack(app, 'TestObservabilityStack', config, { env, eventing });
    const database = new DatabaseStack(app, 'TestDatabaseStack', config, { env, network, secrets });
    const cluster = new EcsClusterStack(app, 'TestEcsClusterStack', config, { env, network });
    const alb = new AlbStack(app, 'TestAlbStack', config, { env, network });
    const apiService = new ApiServiceStack(app, 'TestApiServiceStack', config, { env, network, cluster, alb, database, iam, cognito, eventing, secrets });
    const workerService = new WorkerServiceStack(app, 'TestWorkerServiceStack', config, { env, network, cluster, database, iam, eventing, secrets });
    const stack = new RuntimeObservabilityStack(app, 'TestRuntimeObservabilityStack', config, {
      env,
      observability,
      database,
      apiService,
      workerService,
    });
    return { stack, template: Template.fromStack(stack) };
  }

  it('creates 12 alarms - 3 per ECS service (CPU/memory/running-task-count) x 4 services', () => {
    const { template } = synth();
    const ecsAlarms = Object.values(template.findResources('AWS::CloudWatch::Alarm')).filter((alarm) => {
      const namespace = (alarm as { Properties: { Namespace?: string } }).Properties.Namespace;
      return namespace === 'AWS/ECS';
    });
    expect(ecsAlarms.length).toBe(12);
  });

  it('creates 4 RDS health alarms - CPU/storage/connections/freeable-memory', () => {
    const { template } = synth();
    const rdsAlarms = Object.values(template.findResources('AWS::CloudWatch::Alarm')).filter((alarm) => {
      const namespace = (alarm as { Properties: { Namespace?: string } }).Properties.Namespace;
      return namespace === 'AWS/RDS';
    });
    expect(rdsAlarms.length).toBe(4);
  });

  it('creates exactly one dashboard', () => {
    const { template } = synth();
    template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
  });
});
