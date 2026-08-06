import * as cdk from 'aws-cdk-lib';

import type { EnvironmentConfig } from '../../lib/common/types';

/**
 * `staging` environment configuration - Blueprint §11.2: "Pre-production
 * validation, including the RBAC executable spec... and migration
 * dry-runs... Anonymized/synthetic data resembling production shape,
 * never real Person/Financial Transaction data... Automatic on merge to
 * `main`." See `infra/ENVIRONMENTS.md`.
 */
export const stagingConfig: EnvironmentConfig = {
  envName: 'staging',
  account: undefined,
  region: 'eu-west-1',
  isProduction: false,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  terminationProtection: false,
  logRetentionDays: 30,
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
    emailIdentity: undefined,
  },
  alerting: {
    email: undefined,
  },
  // Cloud Runtime Infrastructure milestone.
  networking: {
    maxAzs: 3,
    natGateways: 1, // cost-optimized - staging is a validation environment, not an availability rehearsal (Blueprint §11.2).
  },
  database: {
    instanceType: 't3.small',
    allocatedStorageGb: 20,
    maxAllocatedStorageGb: 100,
    multiAz: false,
    deletionProtection: false,
    backupRetentionDays: 7,
    performanceInsightsEnabled: true,
  },
  compute: {
    api: { cpu: 512, memoryLimitMiB: 1024, desiredCount: 1, maxCapacity: 3 },
    worker: { cpu: 256, memoryLimitMiB: 512, desiredCount: 1 },
  },
  alb: {
    certificateArn: undefined,
  },
};
