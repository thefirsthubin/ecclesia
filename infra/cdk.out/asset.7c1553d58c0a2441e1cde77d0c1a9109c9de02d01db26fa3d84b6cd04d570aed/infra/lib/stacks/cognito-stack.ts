import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import type { Construct } from 'constructs';

import { EcclesiaStack } from '../common/ecclesia-stack';
import { writeParameter } from '../common/parameters';
import type { EnvironmentConfig } from '../common/types';

/**
 * Cognito - Blueprint §8 (ADR-004: AWS Cognito as the identity provider).
 *
 * One User Pool per environment, matching §8.2's explicit design: "Phone-
 * based OTP and email/password are both first-class Cognito authentication
 * flows in the same User Pool, distinguished by a custom attribute
 * (`auth_method`)" - not two separate pools per persona group.
 *
 * `[Known limitation - infrastructure-only milestone]` Three things
 * Blueprint §8 describes are deliberately **not** implemented here,
 * because implementing them means writing business logic (Lambda trigger
 * bodies), which this milestone's brief explicitly excludes ("Do NOT...
 * introduce new business functionality"):
 *
 * 1. **The phone-OTP custom auth flow itself** (§8.2) needs three Lambda
 *    triggers (`DefineAuthChallenge`/`CreateAuthChallenge`/
 *    `VerifyAuthChallengeResponse` - OTP generation, SMS dispatch,
 *    verification). This stack enables `ALLOW_CUSTOM_AUTH` as a supported
 *    client auth flow (the User Pool-level configuration surface) but
 *    wires no trigger Lambdas - a User Pool in this state cannot actually
 *    complete a custom-auth sign-in yet. See
 *    `INFRASTRUCTURE_DESIGN_NOTES.md` §5.1.
 * 2. **Per-role mandatory MFA** (§8.2's Treasurer/Pastor/Admin rows) -
 *    see `types.ts`'s own doc comment on `CognitoEnvironmentConfig.mfaMode`
 *    for why a pool-level setting alone cannot express this, and what a
 *    future milestone needs to add (a `PreTokenGeneration` trigger).
 * 3. **Cognito's account-provisioning-via-Role-Assignment workflow**
 *    (PRD §12.2/§19.4) - this stack provisions the *pool*; actually
 *    creating a user record when a Role Assignment is granted is
 *    `apps/api`'s job (a future application-layer milestone), not
 *    infrastructure.
 */
export class CognitoStack extends EcclesiaStack {
  public readonly userPool: cognito.UserPool;
  public readonly mobileClient: cognito.UserPoolClient;
  public readonly webAdminClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, config: EnvironmentConfig, props?: cdk.StackProps) {
    super(scope, id, config, props);

    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: this.resourceName('user-pool'),
      selfSignUpEnabled: config.cognito.selfSignUpEnabled,
      signInAliases: { email: true, phone: true, username: false },
      autoVerify: { email: true, phone: true },
      standardAttributes: {
        email: { required: true, mutable: true },
        phoneNumber: { required: true, mutable: true },
      },
      customAttributes: {
        // Blueprint §8.2 - "distinguished by a custom attribute
        // (`auth_method`)". A future application-layer milestone's
        // Lambda triggers/apps/api read and set this; this stack only
        // reserves the attribute on the pool schema.
        auth_method: new cognito.StringAttribute({ minLen: 1, maxLen: 32, mutable: true }),
      },
      passwordPolicy: {
        // [Design Decision] NFR-SEC-01 requires "encrypted credential
        // handling" but names no specific password policy numbers -
        // this is a reasonable, disclosed default (12+ chars, all four
        // character classes), not a citation. Only governs the
        // email+password flow (Treasurer/Pastor/Admin, §8.2) - the
        // phone-OTP personas never set a password.
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      mfa: config.cognito.mfaMode === 'REQUIRED' ? cognito.Mfa.REQUIRED : config.cognito.mfaMode === 'OPTIONAL' ? cognito.Mfa.OPTIONAL : cognito.Mfa.OFF,
      mfaSecondFactor: { sms: true, otp: true },
      accountRecovery: cognito.AccountRecovery.EMAIL_AND_PHONE_WITHOUT_MFA,
      advancedSecurityMode:
        config.cognito.advancedSecurityMode === 'ENFORCED'
          ? cognito.AdvancedSecurityMode.ENFORCED
          : config.cognito.advancedSecurityMode === 'AUDIT'
            ? cognito.AdvancedSecurityMode.AUDIT
            : cognito.AdvancedSecurityMode.OFF,
      removalPolicy: config.removalPolicy,
      deletionProtection: config.isProduction,
    });

    // Blueprint §8.3's token strategy table, applied to both clients.
    const tokenValidity = {
      accessTokenValidity: cdk.Duration.minutes(15),
      idTokenValidity: cdk.Duration.minutes(15),
      refreshTokenValidity: cdk.Duration.days(30),
    };

    this.mobileClient = this.userPool.addClient('MobileClient', {
      userPoolClientName: this.resourceName('mobile-client'),
      generateSecret: false, // public client (React Native app), per §8.1's OIDC/JWT-validation-middleware integration model
      authFlows: {
        // ALLOW_CUSTOM_AUTH: the phone-OTP flow's client-side auth-flow
        // surface (§8.2) - see this file's own top doc comment for what
        // is/isn't built to actually complete it end-to-end yet.
        custom: true,
        userSrp: true, // fallback for any mobile persona later granted an email+password role (§8.2's own "later granted a Treasurer/Pastor role" case)
      },
      ...tokenValidity,
      preventUserExistenceErrors: true,
    });

    this.webAdminClient = this.userPool.addClient('WebAdminClient', {
      userPoolClientName: this.resourceName('web-admin-client'),
      generateSecret: false, // public SPA client
      authFlows: {
        // SRP (Secure Remote Password), not ALLOW_USER_PASSWORD_AUTH -
        // the standard, more secure flow Amplify/Cognito SDKs use by
        // default for browser clients; §8.2's "email + password" is the
        // user-facing description, SRP is how that's actually
        // transmitted without the plaintext password ever leaving the
        // browser unhashed.
        userSrp: true,
      },
      ...tokenValidity,
      preventUserExistenceErrors: true,
    });

    writeParameter(this, 'UserPoolIdParam', config.envName, 'cognito', 'user-pool-id', this.userPool.userPoolId);
    writeParameter(this, 'MobileClientIdParam', config.envName, 'cognito', 'mobile-client-id', this.mobileClient.userPoolClientId);
    writeParameter(this, 'WebAdminClientIdParam', config.envName, 'cognito', 'web-admin-client-id', this.webAdminClient.userPoolClientId);

    new cdk.CfnOutput(this, 'UserPoolIdOutput', { value: this.userPool.userPoolId, description: 'Cognito User Pool ID' });
    new cdk.CfnOutput(this, 'MobileClientIdOutput', { value: this.mobileClient.userPoolClientId, description: 'Mobile app Cognito client ID' });
    new cdk.CfnOutput(this, 'WebAdminClientIdOutput', { value: this.webAdminClient.userPoolClientId, description: 'Web Admin Cognito client ID' });
  }
}
