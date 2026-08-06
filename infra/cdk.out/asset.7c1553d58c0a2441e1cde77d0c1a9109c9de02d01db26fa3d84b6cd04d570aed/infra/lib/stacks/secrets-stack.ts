import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import type { Construct } from 'constructs';

import { EcclesiaStack } from '../common/ecclesia-stack';
import type { EnvironmentConfig } from '../common/types';

/**
 * Secrets Manager - Blueprint §11.7: "All credentials — RDS connection
 * strings, Cognito app client secrets, Mobile Money provider API keys...,
 * SMS/WhatsApp gateway credentials — are stored in AWS Secrets Manager...
 * never committed to the repository or baked into container images."
 *
 * `[Known limitation]` This milestone's named scope has no RDS/ECS stack
 * yet (`INFRASTRUCTURE_DESIGN_NOTES.md` §7), so the secrets below are
 * **scaffolding**, not yet-consumed credentials:
 *
 * - `database-credentials` gets a real, randomly generated password now
 *   (so the secret is never empty/predictable), but its `host`/`port`/
 *   `dbname` fields are placeholders - a future Compute & Data
 *   Infrastructure milestone's RDS stack either populates this same
 *   secret (via `secretsmanager.Secret.fromSecretNameV2` + a post-deploy
 *   update) or, more idiomatically, has `rds.DatabaseInstance` generate
 *   its *own* managed secret and this placeholder is retired - documented
 *   as an open implementation choice for that future milestone, not
 *   decided here.
 * - `mobile-money-provider` and `sms-gateway` are empty-value placeholders
 *   (§11.7's "future integration," Blueprint Chapter 4) - real values are
 *   populated manually (console or `aws secretsmanager put-secret-value`)
 *   once a provider is actually contracted, never by this CDK code, which
 *   would mean committing the value to source control.
 * - **Automatic rotation is not configured for any secret** - RDS
 *   credential auto-rotation (§11.7's own specific ask, "for the RDS
 *   credential specifically") needs a live RDS instance and a rotation
 *   Lambda to rotate against, neither of which exists yet.
 */
export class SecretsStack extends EcclesiaStack {
  public readonly databaseCredentials: secretsmanager.Secret;
  public readonly mobileMoneyProviderSecret: secretsmanager.Secret;
  public readonly smsGatewaySecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, config: EnvironmentConfig, props?: cdk.StackProps) {
    super(scope, id, config, props);

    this.databaseCredentials = new secretsmanager.Secret(this, 'DatabaseCredentials', {
      secretName: this.resourceName('database-credentials'),
      description: 'RDS PostgreSQL credentials (Blueprint §7). Placeholder host/port/dbname until the RDS stack exists - see this stack file\'s own doc comment.',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'ecclesia_app', host: 'PLACEHOLDER_PENDING_RDS_STACK', port: 5432, dbname: 'ecclesia' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        passwordLength: 32,
      },
      removalPolicy: config.removalPolicy,
    });

    this.mobileMoneyProviderSecret = new secretsmanager.Secret(this, 'MobileMoneyProviderSecret', {
      secretName: this.resourceName('mobile-money-provider'),
      description: 'Mobile Money provider API credentials (Blueprint §11.7, Horizon 2 integration). Empty placeholder - populated manually once a provider is contracted.',
      secretObjectValue: {
        apiKey: cdk.SecretValue.unsafePlainText('PLACEHOLDER_NOT_YET_PROVISIONED'),
      },
      removalPolicy: config.removalPolicy,
    });

    this.smsGatewaySecret = new secretsmanager.Secret(this, 'SmsGatewaySecret', {
      secretName: this.resourceName('sms-gateway'),
      description: 'SMS gateway credentials (Blueprint §10.7 notification fallback channel, §11.7). Empty placeholder - populated manually once a provider is contracted.',
      secretObjectValue: {
        apiKey: cdk.SecretValue.unsafePlainText('PLACEHOLDER_NOT_YET_PROVISIONED'),
      },
      removalPolicy: config.removalPolicy,
    });

    new cdk.CfnOutput(this, 'DatabaseCredentialsArnOutput', { value: this.databaseCredentials.secretArn });
    new cdk.CfnOutput(this, 'MobileMoneyProviderSecretArnOutput', { value: this.mobileMoneyProviderSecret.secretArn });
    new cdk.CfnOutput(this, 'SmsGatewaySecretArnOutput', { value: this.smsGatewaySecret.secretArn });
  }
}
