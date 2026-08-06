import * as cdk from 'aws-cdk-lib';

import type { EnvironmentConfig } from '../../lib/common/types';

/**
 * `production` environment configuration - Blueprint §11.2: "Full
 * congregation-wide operation... Real production data... Manual
 * promotion from `pilot`." See `infra/ENVIRONMENTS.md`.
 *
 * `[Design Decision]` The existing `infra/environments/production/README.md`
 * (written before this milestone) notes this environment includes "the
 * pilot-cohort configuration referenced in PRD §22.2." That configuration
 * is the Blueprint §11.2 `pilot` environment's own concern, and this
 * milestone's `EnvironmentName` deliberately does not include `pilot`
 * (`types.ts`'s own doc comment, per this milestone brief's literal
 * three-environment instruction) - so no pilot-cohort-specific field
 * exists on this config object yet. Flagged here, not silently dropped:
 * see `INFRASTRUCTURE_DESIGN_NOTES.md` §7 for the full disclosure and how
 * small the gap is to close later (add `'pilot'` to `EnvironmentName`, add
 * `environments/pilot/config.ts` - no stack class needs to change, since
 * every stack is already written generically against `EnvironmentConfig`,
 * not against a hardcoded environment name).
 */
export const productionConfig: EnvironmentConfig = {
  envName: 'production',
  account: undefined,
  region: 'eu-west-1',
  isProduction: true,
  removalPolicy: cdk.RemovalPolicy.RETAIN,
  terminationProtection: true,
  logRetentionDays: 365,
  cognito: {
    selfSignUpEnabled: false,
    mfaMode: 'OPTIONAL',
    advancedSecurityMode: 'ENFORCED',
  },
  eventing: {
    maxReceiveCount: 5,
    visibilityTimeoutSeconds: 180,
  },
  ses: {
    emailIdentity: undefined,
  },
  alerting: {
    email: undefined,
  },
  // Cloud Runtime Infrastructure milestone.
  networking: {
    maxAzs: 3,
    natGateways: 3, // one per AZ - production HA, no single-NAT cross-AZ dependency.
  },
  database: {
    instanceType: 't3.medium',
    allocatedStorageGb: 50,
    maxAllocatedStorageGb: 500,
    multiAz: true,
    deletionProtection: true,
    backupRetentionDays: 30,
    performanceInsightsEnabled: true,
  },
  compute: {
    api: { cpu: 1024, memoryLimitMiB: 2048, desiredCount: 2, maxCapacity: 6 },
    worker: { cpu: 512, memoryLimitMiB: 1024, desiredCount: 1 },
  },
  alb: {
    certificateArn: undefined,
  },
};
