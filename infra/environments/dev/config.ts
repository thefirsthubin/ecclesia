import * as cdk from 'aws-cdk-lib';

import type { EnvironmentConfig } from '../../lib/common/types';

/**
 * `dev` environment configuration - Blueprint §11.2: "Individual developer
 * / feature-branch integration testing... Synthetic seed data only...
 * Automatic on push to any feature branch." See
 * `infra/ENVIRONMENTS.md` for the guide this file is an instance of.
 *
 * `[Design Decision]` `region`/`account` are placeholders needing real
 * confirmation before `cdk bootstrap` - see `types.ts`'s own doc comment
 * on `EnvironmentConfig.region`/`.account` and
 * `INFRASTRUCTURE_DESIGN_NOTES.md` §6.
 */
export const devConfig: EnvironmentConfig = {
  envName: 'dev',
  account: undefined,
  region: 'eu-west-1',
  isProduction: false,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  terminationProtection: false,
  logRetentionDays: 14,
  cognito: {
    selfSignUpEnabled: false,
    mfaMode: 'OPTIONAL',
    advancedSecurityMode: 'AUDIT',
  },
  eventing: {
    maxReceiveCount: 3,
    visibilityTimeoutSeconds: 120,
  },
  ses: {
    // No sending domain confirmed yet - SesStack still provisions the
    // configuration set, but skips creating an EmailIdentity. See
    // ses-stack.ts's own doc comment.
    emailIdentity: undefined,
  },
  alerting: {
    // No on-call address confirmed for dev - the alert topic is still
    // created (so staging/production's identical stack code has
    // somewhere to publish to), just nothing is subscribed to it yet.
    email: undefined,
  },
};
