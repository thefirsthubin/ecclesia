import type * as cdk from 'aws-cdk-lib';

/**
 * Production Infrastructure Foundation milestone.
 *
 * Shared types for the environment-aware configuration every stack is
 * parameterized by (milestone brief: "Each environment should be
 * configurable without duplicating infrastructure definitions"). One
 * `EnvironmentConfig` object per environment
 * (`infra/environments/{dev,staging,production}/config.ts`) is the single
 * input every stack class consumes - stack *code* is written once, in
 * `infra/lib/stacks/`, and never duplicated per environment.
 *
 * `[Design Decision]` The Technical Blueprint §11.2 names **four**
 * environments (`dev`, `staging`, `pilot`, `production`) - `pilot` is the
 * concrete infrastructure implementation of the PRD §22.2 staged-rollout
 * plan, not a testing convenience. This milestone's own brief explicitly
 * names only three ("Support: Development, Staging, Production"), so
 * `EnvironmentName` below is scoped to exactly those three per the
 * brief's literal instruction. `pilot` is deliberately **not** added as a
 * fourth value here - seе `INFRASTRUCTURE_DESIGN_NOTES.md` §7 for why this
 * is flagged as a real, disclosed gap against the Blueprint rather than a
 * silent omission, and how little work adding it later is (one more
 * `environments/pilot/config.ts` file and one more loop iteration in
 * `bin/infra.ts` - the environment-parameterized stack design means no
 * stack class needs to change to add it).
 */
export type EnvironmentName = 'dev' | 'staging' | 'production';

export const ENVIRONMENT_NAMES: readonly EnvironmentName[] = ['dev', 'staging', 'production'];

/** Cognito-specific configuration, environment-aware per Blueprint §8. */
export interface CognitoEnvironmentConfig {
  /**
   * PRD/Blueprint never describe public self-service account creation -
   * every persona's account is provisioned via the Role Assignment
   * workflow (PRD §12.2) or the dev-auth seed script, never a public
   * sign-up form. `false` in every environment; kept as a config field
   * (not hardcoded in the stack) so a future persona/requirement change
   * doesn't require editing stack code, only this config.
   */
  selfSignUpEnabled: boolean;
  /**
   * Cognito User Pool-level MFA setting. `[Known limitation]` Blueprint
   * §8.2 requires MFA *mandatory* for Treasurer/Pastor/Admin personas but
   * *not* for Shepherd/Basonta Leader/Member/Worker, all sharing **one**
   * User Pool (§8.2's own text: "both first-class Cognito authentication
   * flows in the same User Pool"). A User Pool's MFA setting is pool-wide,
   * not per-user-group - `OPTIONAL` (allowing per-user enforcement via
   * `AdminSetUserMFAPreference`) is the only pool-level setting compatible
   * with that per-role split. Actually enforcing "these four roles must
   * enroll MFA before completing sign-in" requires a `PreTokenGeneration`
   * Lambda trigger (or an application-layer check) that reads the
   * `auth_method`/role and rejects an un-enrolled Treasurer/Pastor/Admin
   * login - that trigger is business logic, not infrastructure, and is
   * explicitly out of this milestone's scope ("Do NOT... introduce new
   * business functionality"). Documented here, and in
   * `INFRASTRUCTURE_DESIGN_NOTES.md` §5.1, as a known, disclosed gap for a
   * future application-layer milestone to close - not silently assumed
   * solved by this pool-level setting alone.
   */
  mfaMode: 'OPTIONAL' | 'REQUIRED' | 'OFF';
  /** Cognito Advanced Security Features (compromised-credential checks,
   * adaptive risk-based auth). `ENFORCED` in production; `AUDIT` (log
   * only, no blocking) in dev/staging so synthetic test accounts are
   * never blocked, matching how `staging`'s own purpose (Blueprint §11.2)
   * is validation against anonymized/synthetic data, not a production
   * security posture rehearsal. */
  advancedSecurityMode: 'AUDIT' | 'ENFORCED' | 'OFF';
}

/** EventBridge/SQS configuration (Blueprint §10.2/§10.5). */
export interface EventingEnvironmentConfig {
  /** Number of delivery attempts before a message moves to a queue's DLQ.
   * Blueprint §10.5 requires idempotent, at-least-once-tolerant consumers
   * - a DLQ is the backstop for a consumer that keeps failing regardless
   * (a bug, not a transient blip), so it can be inspected/replayed
   * manually rather than looping forever or being silently dropped. */
  maxReceiveCount: number;
  /** SQS visibility timeout, in seconds - how long a consumer has to
   * process and delete a message before it's considered failed and
   * redelivered. Set well above the Worker's own expected per-message
   * processing time (Church Pulse recomputation, Blueprint §10.9) to
   * avoid a slow-but-successful consumer racing its own redelivery. */
  visibilityTimeoutSeconds: number;
}

/** SES configuration - see `infra/lib/stacks/ses-stack.ts`'s own doc
 * comment for why this stack exists (Cognito transactional email
 * deliverability, Blueprint §8.2/§8.5) and explicitly does **not**
 * implement the Blueprint §10.7 Notification fan-out (push/SMS/WhatsApp
 * only - no email channel is named there). */
export interface SesEnvironmentConfig {
  /** The verified sending identity (domain or single email address) SES
   * would use for this environment's Cognito transactional email.
   * `undefined` until a real sending domain is confirmed - see
   * `INFRASTRUCTURE_DESIGN_NOTES.md` §5.3's `[Open Question]`. When
   * `undefined`, `SesStack` still provisions the environment's
   * configuration set (bounce/complaint tracking) but skips creating an
   * `EmailIdentity`, so there is nothing left half-configured. */
  emailIdentity?: string;
}

/** CloudWatch alerting configuration (Blueprint §12.7 - "alerting is
 * routed through a single on-call channel"). */
export interface AlertingEnvironmentConfig {
  /** Email address to subscribe to this environment's alert SNS topic.
   * `undefined` until a real on-call address is confirmed - see
   * `INFRASTRUCTURE_DESIGN_NOTES.md` §5.5. The topic itself is still
   * created either way; only the subscription is conditional, so a real
   * address can be subscribed later with zero stack changes (an `aws sns
   * subscribe` CLI call, or setting the config field and redeploying). */
  email?: string;
}

/**
 * One environment's complete, typed configuration - the single object
 * every stack constructor takes alongside `scope`/`id`/`cdk.StackProps`.
 */
export interface EnvironmentConfig {
  envName: EnvironmentName;
  /** AWS account ID this environment deploys into. `undefined` lets CDK
   * fall back to whatever account the deploying credentials resolve to
   * (`CDK_DEFAULT_ACCOUNT`) - see `INFRASTRUCTURE_DESIGN_NOTES.md` §6 for
   * why all three environments are modeled against a **single** AWS
   * account in this milestone (only one account exists per the milestone
   * brief's own "AWS setup... complete" list), with environment isolation
   * coming from stack-name/resource-name prefixing (`resourceName()`
   * below), not account separation. */
  account?: string;
  /** `[Design Decision]` No AWS region is specified anywhere in the PRD or
   * Technical Blueprint. `eu-west-1` (Ireland) is used as a placeholder -
   * a mature, full-service region with a reasonable network path to West
   * Africa - but this is a genuine open decision, not a researched
   * recommendation, and needs real confirmation (alongside `af-south-1`,
   * AWS's own Cape Town region, as the geographically-closest
   * alternative) before `cdk bootstrap`. Flagged explicitly, not silently
   * defaulted - see `INFRASTRUCTURE_DESIGN_NOTES.md` §6 and this
   * milestone's final summary. */
  region: string;
  isProduction: boolean;
  /** `cdk.RemovalPolicy` for stateful resources this milestone creates
   * (Cognito User Pool, Secrets Manager secrets) - `DESTROY` in
   * dev/staging so environments can be torn down and rebuilt freely
   * during infrastructure iteration, `RETAIN` in production so a stack
   * deletion or replacement can never silently take real member data (a
   * User Pool of real accounts) or a live secret with it. */
  removalPolicy: cdk.RemovalPolicy;
  /** Whether CloudFormation stack termination protection is enabled -
   * `true` in production only, requiring an explicit console/CLI opt-out
   * before `cdk destroy`/a stack-replacing update can proceed, a second,
   * independent guard alongside `removalPolicy` against an accidental
   * production teardown. */
  terminationProtection: boolean;
  /** CloudWatch Logs retention, in days, for this environment. `[Design
   * Decision]` Neither the PRD nor the Blueprint specifies exact
   * operational-log retention numbers (Blueprint §12.1 draws the
   * audit-log-vs-operational-log distinction but doesn't put a number on
   * the latter) - two weeks (dev), one month (staging), and one year
   * (production) are reasonable, disclosed placeholders pending a real
   * cost/compliance conversation, not a citation. */
  logRetentionDays: number;
  cognito: CognitoEnvironmentConfig;
  eventing: EventingEnvironmentConfig;
  ses: SesEnvironmentConfig;
  alerting: AlertingEnvironmentConfig;
  /** Extra tags applied to every resource in this environment, beyond the
   * standard `Project`/`Environment`/`ManagedBy` tags `EcclesiaStack`
   * always applies (`infra/lib/common/ecclesia-stack.ts`). */
  extraTags?: Record<string, string>;
}
