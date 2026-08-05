import * as cdk from 'aws-cdk-lib';
import * as ses from 'aws-cdk-lib/aws-ses';
import type { Construct } from 'constructs';

import { EcclesiaStack } from '../common/ecclesia-stack';
import type { EnvironmentConfig } from '../common/types';

/**
 * SES - Amazon Simple Email Service.
 *
 * `[Design Decision]` **Why this stack exists at all.** Blueprint §10.7's
 * Notification fan-out names exactly three channels - mobile push (FCM/
 * APNs), SMS, and WhatsApp (roadmap) - **no email channel**. SES is not
 * that fan-out mechanism. This stack exists for a narrower, but real,
 * reason: Blueprint §8.2 puts four personas (Treasurer, Assistant Pastor,
 * Resident Pastor, Admin) on email+password authentication, and Cognito's
 * *own* transactional email (sign-up verification codes, forgot-password
 * codes, admin-invite emails) has a low default sending quota unsuitable
 * for production use once real accounts exist for those personas - AWS's
 * own guidance is to configure a verified SES identity as the User Pool's
 * email source for any real deployment. That is this stack's actual job.
 *
 * `[Open Question]` No real sending domain/email address has been
 * confirmed yet for any environment (`config.ses.emailIdentity` is
 * `undefined` in all three `environments/*\/config.ts` files today) - see
 * this milestone's final summary. Until it is, this stack only provisions
 * the `ConfigurationSet` (bounce/complaint event tracking, useful and
 * identity-independent) and skips creating an `EmailIdentity`.
 *
 * `[Known limitation]` Even once a real identity exists here, wiring
 * `CognitoStack`'s User Pool to actually use it
 * (`cognito.UserPoolEmail.withSES(...)`, replacing the pool's current
 * default `cognito.UserPoolEmail.withCognito()` behavior) is a follow-up
 * change to `cognito-stack.ts` this milestone does not make - doing so
 * before a domain is confirmed and verified would create a stack that
 * cannot actually send email at all. Flagged in
 * `INFRASTRUCTURE_DESIGN_NOTES.md` §5.3 as the concrete next step once the
 * domain question is answered.
 */
export class SesStack extends EcclesiaStack {
  public readonly configurationSet: ses.ConfigurationSet;
  public readonly emailIdentity?: ses.EmailIdentity;

  constructor(scope: Construct, id: string, config: EnvironmentConfig, props?: cdk.StackProps) {
    super(scope, id, config, props);

    this.configurationSet = new ses.ConfigurationSet(this, 'ConfigurationSet', {
      configurationSetName: this.resourceName('email-config-set'),
      reputationMetrics: true,
      sendingEnabled: true,
    });

    if (config.ses.emailIdentity) {
      this.emailIdentity = new ses.EmailIdentity(this, 'EmailIdentity', {
        identity: ses.Identity.email(config.ses.emailIdentity),
        configurationSet: this.configurationSet,
      });

      new cdk.CfnOutput(this, 'EmailIdentityOutput', {
        value: config.ses.emailIdentity,
        description: 'Verified SES sending identity for this environment',
      });
    } else {
      new cdk.CfnOutput(this, 'EmailIdentityStatusOutput', {
        value: 'NOT_CONFIGURED - see ses-stack.ts and INFRASTRUCTURE_DESIGN_NOTES.md §5.3',
        description: 'No SES sending identity configured for this environment yet',
      });
    }
  }
}
