import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import type { Construct } from 'constructs';

import { EcclesiaStack } from '../common/ecclesia-stack';
import { writeParameter } from '../common/parameters';
import type { EnvironmentConfig } from '../common/types';
import type { NetworkStack } from './network-stack';
import type { SecretsStack } from './secrets-stack';

export interface DatabaseStackProps extends cdk.StackProps {
  network: NetworkStack;
  secrets: SecretsStack;
}

/**
 * Cloud Runtime Infrastructure milestone (Milestone 10) §2 - RDS
 * PostgreSQL 16 in `NetworkStack`'s isolated database subnets.
 *
 * `[Design Decision]` The milestone brief requires "Use the existing
 * Secrets Manager secret. Do not create duplicate secrets" - this stack
 * follows that literally for the *master* credential: `SecretsStack`'s
 * `databaseCredentials` secret (`DO NOT MODIFY` per this milestone's own
 * brief - `secrets-stack.ts` is untouched) supplies the master password.
 *
 * That secret's placeholder JSON has `username: 'ecclesia_app'`
 * (`secrets-stack.ts`'s own doc comment calls this a placeholder pending a
 * real RDS stack) - but `ecclesia_app` is, per
 * `db/migrations/20260801050000_row_level_security_enforcement/migration.sql`
 * (protected: "Existing Prisma Schema" is `DO NOT MODIFY`), a deliberately
 * **restricted, non-owner** Postgres role, created by a migration that
 * runs *as* the owner role (`ecclesia`). An RDS master user needs
 * owner-level privileges to run that migration at all - using the secret's
 * literal `username` field as the master username would be
 * self-contradictory.
 *
 * `[Bug fix, found via a real cdk synth]` The obvious way to reconcile
 * this - `rds.Credentials.fromSecret(secret, 'ecclesia')` - synthesizes,
 * but throws a real `DependencyCycle` between this stack and
 * `SecretsStack`: `rds.DatabaseInstance`'s own constructor calls
 * `secret.attach(this)` internally whenever `Credentials.fromSecret()` is
 * used (confirmed by reading `aws-rds/lib/instance.js` directly), and that
 * auto-attachment adds an edge from `SecretsStack` back to this stack -
 * which already depends on `SecretsStack` for the secret itself, so CDK
 * refuses the cycle. `rds.Credentials.fromPassword('ecclesia',
 * secrets.databaseCredentials.secretValueFromJson('password'))` below
 * avoids this entirely: it extracts just the password *value* (a
 * `SecretValue` token) rather than holding a live reference to the
 * `ISecret` object, so `DatabaseInstance` never sees a `credentials.secret`
 * to auto-attach - still genuinely reusing the existing secret's real
 * password (not duplicating it, not hardcoding it), just without the
 * attachment side effect that caused the cycle.
 *
 * `[Known limitation - disclosed]` `ecclesia_app`'s own password is
 * hardcoded as the literal string `'ecclesia_app'` inside that same
 * protected migration file - not something this infra-only milestone can
 * fix without editing a `DO NOT MODIFY` Prisma migration. Rather than
 * inject that weak, checked-into-source-control literal as a plaintext
 * task-definition environment variable (violating the milestone's own "No
 * plaintext secrets" requirement more directly), this stack provisions one
 * additional, real, randomly-generated secret (`AppRoleCredentials` below)
 * for the `ecclesia_app` role. `INFRA_RUNTIME.md`'s "Manual AWS steps
 * still required" section names the one manual step this implies: after
 * first deploying this stack and running `prisma migrate deploy` (which
 * creates `ecclesia_app` with the migration's hardcoded password), an
 * operator must run `ALTER ROLE ecclesia_app WITH PASSWORD '<value from
 * AppRoleCredentials>'` once against the real database so the generated
 * secret this stack created actually matches the role's real password.
 * Disclosed explicitly, not silently assumed solved - the same pattern
 * this project has used for every other "infra is ready, one manual
 * reconciliation step remains" gap (SES identity, SNS alert email).
 */
export class DatabaseStack extends EcclesiaStack {
  public readonly instance: rds.DatabaseInstance;
  public readonly appRoleCredentials: secretsmanager.Secret;

  constructor(scope: Construct, id: string, config: EnvironmentConfig, props: DatabaseStackProps) {
    super(scope, id, config, props);

    const { network, secrets } = props;
    const { database } = config;

    const subnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      description: `Ecclesia ${config.envName} RDS subnet group - isolated private-db subnets only (Milestone 10 §1).`,
      vpc: network.network.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      subnetGroupName: this.resourceName('db-subnet-group'),
    });

    const parameterGroup = new rds.ParameterGroup(this, 'DatabaseParameterGroup', {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_16 }),
      description: `Ecclesia ${config.envName} PostgreSQL 16 parameter group - forces SSL (Milestone 10 §2).`,
      parameters: {
        // Milestone brief §2: "SSL required." rds.force_ssl=1 rejects any
        // client connection that doesn't negotiate TLS, at the engine
        // level - not just "the app happens to always pass sslmode=require".
        'rds.force_ssl': '1',
      },
    });

    // `[Known limitation - disclosed]` See this class's own top doc
    // comment: overrides the master username to 'ecclesia' (the owner
    // role the protected Prisma migration assumes) while still drawing
    // the password from the existing, un-modified SecretsStack secret.
    this.instance = new rds.DatabaseInstance(this, 'Instance', {
      instanceIdentifier: this.resourceName('postgres'),
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_16 }),
      instanceType: new ec2.InstanceType(database.instanceType),
      vpc: network.network.vpc,
      subnetGroup,
      securityGroups: [network.network.databaseSecurityGroup],
      credentials: rds.Credentials.fromPassword('ecclesia', secrets.databaseCredentials.secretValueFromJson('password')),
      databaseName: 'ecclesia',
      port: 5432,
      allocatedStorage: database.allocatedStorageGb,
      maxAllocatedStorage: database.maxAllocatedStorageGb,
      storageEncrypted: true, // Milestone 10 §2/§7: "Encryption enabled" / "Encryption Everywhere" - AWS-managed KMS key, no dedicated CMK provisioned this milestone.
      multiAz: database.multiAz,
      deletionProtection: database.deletionProtection,
      backupRetention: cdk.Duration.days(database.backupRetentionDays),
      enablePerformanceInsights: database.performanceInsightsEnabled,
      performanceInsightRetention: database.performanceInsightsEnabled ? rds.PerformanceInsightRetention.DEFAULT : undefined,
      parameterGroup,
      removalPolicy: config.removalPolicy,
      cloudwatchLogsExports: ['postgresql'],
      cloudwatchLogsRetention: config.logRetentionDays,
      autoMinorVersionUpgrade: true,
    });

    // `[Bug fix, found via a real cdk synth]` A manual
    // `secretsmanager.CfnSecretTargetAttachment` used to be created here.
    // Redundant, and the actual source of a real `DependencyCycle`:
    // `rds.DatabaseInstance` (above) already calls the existing secret's
    // own `.attach(this)` internally whenever `Credentials.fromSecret()`
    // is used (`aws-rds/lib/instance.js`'s constructor - confirmed by
    // reading the installed package directly, not assumed) - a *second*,
    // separately-declared attachment of the same secret to the same
    // target is what CloudFormation's cross-stack reference resolution
    // choked on. `rds.DatabaseInstance`'s own auto-attachment already
    // gives Secrets Manager's RDS integration the `host`/`port`/`dbname`/
    // `engine` auto-population this class's own doc comment describes -
    // nothing is lost by removing the duplicate.

    // A real, generated secret for
    // `ecclesia_app`, distinct from (not a duplicate of) `databaseCredentials`.
    this.appRoleCredentials = new secretsmanager.Secret(this, 'AppRoleCredentials', {
      secretName: this.resourceName('app-role-credentials'),
      description:
        "RLS-scoped 'ecclesia_app' Postgres role credentials (Milestone 10 §2, db/ROW_LEVEL_SECURITY_DESIGN_NOTES.md). " +
        'Generated password does not yet match the role\'s real password until the manual reconciliation step in INFRA_RUNTIME.md is run once - see this stack\'s own doc comment.',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'ecclesia_app',
          host: this.instance.instanceEndpoint.hostname,
          port: this.instance.instanceEndpoint.port,
          dbname: 'ecclesia',
        }),
        generateStringKey: 'password',
        excludePunctuation: true,
        passwordLength: 32,
      },
      removalPolicy: config.removalPolicy,
    });

    writeParameter(this, 'DbEndpointParam', config.envName, 'database', 'endpoint', this.instance.instanceEndpoint.hostname);
    writeParameter(this, 'DbPortParam', config.envName, 'database', 'port', cdk.Token.asString(this.instance.instanceEndpoint.port));
    writeParameter(this, 'DbSecretArnParam', config.envName, 'database', 'secret-arn', secrets.databaseCredentials.secretArn);
    writeParameter(this, 'DbAppRoleSecretArnParam', config.envName, 'database', 'app-role-secret-arn', this.appRoleCredentials.secretArn);

    new cdk.CfnOutput(this, 'EndpointOutput', { value: this.instance.instanceEndpoint.hostname, description: 'RDS PostgreSQL endpoint' });
    new cdk.CfnOutput(this, 'PortOutput', { value: cdk.Token.asString(this.instance.instanceEndpoint.port), description: 'RDS PostgreSQL port' });
    new cdk.CfnOutput(this, 'SecretArnOutput', { value: secrets.databaseCredentials.secretArn, description: 'Master credentials Secrets Manager ARN' });
    new cdk.CfnOutput(this, 'AppRoleSecretArnOutput', { value: this.appRoleCredentials.secretArn, description: "ecclesia_app role credentials Secrets Manager ARN (see this stack's doc comment - manual reconciliation required once)" });
  }
}
