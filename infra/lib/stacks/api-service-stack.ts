import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import type { Construct } from 'constructs';
import * as path from 'path';

import { EcclesiaStack } from '../common/ecclesia-stack';
import { writeParameter } from '../common/parameters';
import type { EnvironmentConfig } from '../common/types';
import { FargateService } from '../constructs/fargate-service.construct';
import type { AlbStack } from './alb-stack';
import type { CognitoStack } from './cognito-stack';
import type { DatabaseStack } from './database-stack';
import type { EcsClusterStack } from './ecs-cluster-stack';
import type { EventingStack } from './eventing-stack';
import type { IamStack } from './iam-stack';
import type { NetworkStack } from './network-stack';
import type { SecretsStack } from './secrets-stack';

export interface ApiServiceStackProps extends cdk.StackProps {
  network: NetworkStack;
  cluster: EcsClusterStack;
  alb: AlbStack;
  database: DatabaseStack;
  iam: IamStack;
  cognito: CognitoStack;
  eventing: EventingStack;
  secrets: SecretsStack;
}

/**
 * Cloud Runtime Infrastructure milestone (Milestone 10) §4 - deploys
 * `apps/api` as an ECS Fargate service behind `AlbStack`'s listener.
 *
 * `[Design Decision]` **Composing `DATABASE_URL`/`APP_DATABASE_URL` at
 * container start, not via ECS's native `secrets` field alone**:
 * `apps/api/src/platform/config/env.schema.ts` requires each of these as
 * *one* full `postgresql://user:pass@host:port/db` connection string, but
 * ECS `secrets` can only map one Secrets Manager JSON key to one whole
 * env var - it cannot template multiple fields (host from one place,
 * password from Secrets Manager) into a single composed value. This stack
 * injects the individual pieces (`DB_HOST`/`DB_PORT`/`DB_NAME`/
 * `DB_MASTER_USER`/`DB_APP_USER` as plain env vars - none of these are
 * secret by themselves; `DB_MASTER_PASSWORD`/`DB_APP_PASSWORD` via ECS
 * `secrets`, so the actual password values never appear in the task
 * definition or CloudFormation template in plaintext, satisfying the
 * milestone's own "No plaintext secrets" requirement) and
 * `apps/api/Dockerfile`'s `entrypoint.sh` composes the two full connection
 * strings immediately before `exec`-ing the real Node process - see that
 * file's own comment. This is standard practice for composing
 * multi-field secrets into a single env var ECS itself cannot template.
 *
 * `EVENTBRIDGE_BUS_NAME` is set explicitly from `eventing.bus.eventBus`,
 * not left to `env.schema.ts`'s own default (`'ecclesia-engagement-signals'`,
 * with no environment prefix) - a disclosed mismatch already noted in
 * `INFRASTRUCTURE_DESIGN_NOTES.md`: this stack's real, deployed bus is
 * named `ecclesia-{env}-engagement-signals`, and this is where that gap
 * closes for the deployed environment (application code is unchanged -
 * the default only matters when this env var is *not* set, which it now
 * always is here).
 */
export class ApiServiceStack extends EcclesiaStack {
  public readonly fargateService: FargateService;

  constructor(scope: Construct, id: string, config: EnvironmentConfig, props: ApiServiceStackProps) {
    super(scope, id, config, props);

    const { network, cluster, alb, database, iam, cognito, eventing, secrets } = props;

    this.fargateService = new FargateService(this, 'ApiService', {
      resourceName: this.resourceName('api'),
      cluster: cluster.cluster,
      vpc: network.network.vpc,
      securityGroups: [network.network.ecsSecurityGroup],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      taskRole: iam.apiTaskRole,
      executionRole: iam.apiTaskExecutionRole,
      // Build context is the repo root, not apps/api/ - Nx monorepo builds
      // need pnpm-lock.yaml, nx.json, tsconfig.base.json, libs/*, and
      // db/schema.prisma all reachable from the build context. See
      // apps/api/Dockerfile's own top comment.
      imageAssetDirectory: path.join(__dirname, '../../../'),
      dockerfile: 'apps/api/Dockerfile',
      containerPort: 3000, // env.schema.ts's own PORT default
      cpu: config.compute.api.cpu,
      memoryLimitMiB: config.compute.api.memoryLimitMiB,
      desiredCount: config.compute.api.desiredCount,
      logRetentionDays: config.logRetentionDays,
      environment: {
        // [Design Decision] 'dev' gets NODE_ENV=development (API docs on,
        // matches its own "internal testing convenience" purpose);
        // staging/production both get NODE_ENV=production - staging's own
        // stated purpose (Blueprint §11.2, "pre-production validation") is
        // to behave like production code-paths, not like a developer
        // laptop. See this stack's own doc comment.
        NODE_ENV: config.envName === 'dev' ? 'development' : 'production',
        // Every ECS-deployed environment uses the real Cognito User Pool
        // this milestone's predecessor (Production Infrastructure
        // Foundation) already provisioned - never the local dev-auth stub,
        // regardless of NODE_ENV. Set explicitly, not left to
        // computeAuthMode()'s own NODE_ENV-derived default.
        AUTH_MODE: 'cognito',
        PORT: '3000',
        LOG_LEVEL: config.isProduction ? 'info' : 'debug',
        API_DOCS_ENABLED: config.isProduction ? 'false' : 'true',
        DB_HOST: database.instance.instanceEndpoint.hostname,
        DB_PORT: cdk.Token.asString(database.instance.instanceEndpoint.port),
        DB_NAME: 'ecclesia',
        DB_MASTER_USER: 'ecclesia',
        DB_APP_USER: 'ecclesia_app',
        COGNITO_USER_POOL_ID: cognito.userPool.userPoolId,
        COGNITO_CLIENT_ID: cognito.webAdminClient.userPoolClientId,
        COGNITO_REGION: config.region,
        AWS_REGION: config.region,
        EVENTBRIDGE_BUS_NAME: eventing.bus.eventBus.eventBusName,
        // No CORS_ORIGIN set yet - no Web Admin domain exists (this
        // milestone's own roadmap discussion). apps/api's own main.ts
        // falls back to CORS disabled entirely outside NODE_ENV=development,
        // which is the correct, safe default until a real origin exists -
        // see main.ts's own CORS_ORIGIN doc comment.
      },
      secrets: {
        // Master (owner-role 'ecclesia') password - drawn from the
        // existing, unmodified SecretsStack secret (this stack's own top
        // doc comment, and database-stack.ts's own doc comment on why the
        // username is overridden separately as a plain env var above).
        DB_MASTER_PASSWORD: ecs.Secret.fromSecretsManager(secrets.databaseCredentials, 'password'),
        // 'ecclesia_app' (RLS-scoped) password - the new, generated
        // secret DatabaseStack provisions specifically for this role; see
        // database-stack.ts's own doc comment on the one manual
        // reconciliation step this still requires.
        DB_APP_PASSWORD: ecs.Secret.fromSecretsManager(database.appRoleCredentials, 'password'),
      },
      containerHealthCheckCommand: undefined, // ALB target-group health check covers this service instead (attachToAlb() below).
    });

    this.fargateService.attachToAlb(alb.httpListener, '/health');

    // `[Bug fix]` Granted here, against the imported `fargateService.taskRole`,
    // rather than in `IamStack` against the live `apiTaskRole` object - see
    // `FargateService.taskRole`'s own doc comment and `iam-stack.ts`'s
    // matching comment for why granting from `IamStack` directly recreates
    // the exact `DependencyCycle` this construct already fixed once for the
    // execution role's ECS-native secret injection above.
    secrets.mobileMoneyProviderSecret.grantRead(this.fargateService.taskRole);
    secrets.smsGatewaySecret.grantRead(this.fargateService.taskRole);

    writeParameter(this, 'ApiServiceNameParam', config.envName, 'compute', 'api-service-name', this.fargateService.service.serviceName);

    new cdk.CfnOutput(this, 'ApiServiceNameOutput', { value: this.fargateService.service.serviceName });
    new cdk.CfnOutput(this, 'ApiUrlOutput', { value: `http://${alb.alb.loadBalancerDnsName}`, description: 'API base URL via the ALB (HTTP until a certificate is configured)' });
  }
}
