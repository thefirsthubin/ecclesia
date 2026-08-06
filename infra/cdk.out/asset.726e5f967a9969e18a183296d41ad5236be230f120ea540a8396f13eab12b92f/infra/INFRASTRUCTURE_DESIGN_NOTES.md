# Production Infrastructure Foundation — Design Notes

Milestone brief (verbatim, key excerpt): "Initialize the `infra/`
directory as a production-ready AWS CDK (TypeScript) application while
preserving the existing folder structure. Do NOT delete or replace the
existing `environments/` or `modules/` directories... The next milestone
is NOT deployment... this milestone is infrastructure-as-code only." Same
disclosure discipline as every other milestone in this repository: every
claim below is a direct citation (PRD/Blueprint section) or an explicit
`[Design Decision]`/`[Open Question]`/`[Known limitation]`.

## 0. What existed before this milestone

`infra/environments/{dev,staging,production}/README.md` and
`infra/modules/README.md` - four placeholder files, each already citing
Blueprint §11.2-§11.4 and stating "Status: populated in the CDK
infrastructure milestone." No `cdk.json`, `bin/`, `lib/`, or any stack
code existed. This milestone is that "populated in..." promise being
kept - both directories are preserved, and now contain real content
matching what their own pre-existing descriptions said they would.

## 1. Architecture overview

```
                         ┌─────────────────────────────┐
                         │   cdk.App (bin/infra.ts)    │
                         │  loops over dev/staging/     │
                         │  production, instantiating   │
                         │  all six stacks per env       │
                         └──────────────┬───────────────┘
                                        │
        ┌───────────────┬──────────────┼───────────────┬───────────────┬────────────────┐
        │               │              │               │               │                │
  CognitoStack    EventingStack    SesStack      SecretsStack      IamStack      ObservabilityStack
  (User Pool,    (EventBridge bus  (config set,  (3 placeholder   (depends on:   (depends on:
   2 app clients) + 3 SQS queues    optional       secrets)         Eventing,      Eventing -
                   + DLQs + rules)  EmailIdentity)                   Secrets, Ses)  SQS alarms,
                                                                                     SNS topic)
```

Every stack extends `EcclesiaStack` (`lib/common/ecclesia-stack.ts`),
which applies standard tags, termination protection, and the
`resourceName()` naming helper - so no individual stack re-implements
those three concerns. Every stack takes the same shape of constructor:
`(scope, id, config: EnvironmentConfig, props?)` - one config object
(`environments/<env>/config.ts`) parameterizes every stack for that
environment, per the milestone brief's "configurable without duplicating
infrastructure definitions" requirement. See §2 for exactly how that's
enforced (one set of stack classes, instantiated three times).

## 2. Environment strategy - config, not duplication

`bin/infra.ts` loops over `ENVIRONMENT_NAMES = ['dev', 'staging',
'production']` and instantiates the same six stack classes once per
environment, each parameterized by that environment's
`EnvironmentConfig` (`environments/index.ts`'s `getEnvironmentConfig()`).
**No stack class contains an `if (envName === 'production')` branch
anywhere** - every environment-dependent decision (removal policy,
termination protection, MFA mode, log retention, SES identity, alert
email) is a field read off `config`, set once per environment in that
environment's own `config.ts` file. Adding a fourth environment (see §7's
`pilot` disclosure) means adding one `environments/<name>/config.ts` file
and one line to `ENVIRONMENT_NAMES` - no stack file changes.

This directly implements the milestone's own "Each environment should be
configurable without duplicating infrastructure definitions" requirement,
and Blueprint §11.2's environment table (reproduced here for reference,
with this milestone's own three-environment scope noted):

| Environment | Blueprint §11.2 purpose | Modeled in this milestone? |
|---|---|---|
| `dev` | Feature-branch integration testing, synthetic data | Yes |
| `staging` | Pre-production validation, anonymized/synthetic data | Yes |
| `pilot` | PRD §22.2 staged rollout, real pilot-cohort data | **No - see §7** |
| `production` | Full congregation-wide operation, real data | Yes |

## 3. `[Design Decision]` Why no VPC/network stack exists

The milestone brief lists "Shared networking/resources (**if required**)"
- judged, checked against what this milestone actually builds: **none of
the seven required resources (Cognito, EventBridge, SQS, SES, Secrets
Manager, CloudWatch, IAM) need a VPC to function.** They are all regional,
AWS-managed services reachable over the public AWS API, not resources
that live inside a VPC's subnets. Blueprint §11.3's own VPC diagram exists
specifically to isolate RDS/ElastiCache/ECS - none of which this milestone
builds (see §7).

Building a VPC anyway, speculatively, was considered and rejected for a
second, independent reason: `ec2.Vpc`'s default construction performs a
live AWS context lookup (availability-zone discovery) unless
availability zones are hardcoded - which would mean `cdk synth` depends
on real, working AWS credentials before this project has even been
bootstrapped, directly undermining the milestone's own "Do NOT run `cdk
bootstrap`... Do NOT deploy" constraint being genuinely honorable (a
VPC-containing app couldn't even *synthesize* cleanly, let alone deploy,
without live credentials). Every stack this milestone actually builds
synthesizes with **zero** live AWS context lookups - confirmed by
inspection: no `.fromLookup(...)` call exists anywhere in `lib/` or
`modules/`.

## 4. `[Design Decision]` Nx integration

`infra/project.json` registers this directory as a real Nx project
(`projectType: "application"`), so the milestone's own validation bullets
("pnpm lint passes," "pnpm test passes," "pnpm build passes") are
satisfied by the *existing* root `pnpm lint`/`pnpm test`/`pnpm build`
scripts (`nx run-many --target=X --all`) picking `infra` up automatically,
with no separate command for a reviewer to remember. `lint`/`test` reuse
this repository's existing `@nx/eslint/plugin`/`@nx/jest/plugin`
inference (the same mechanism every `apps/*`/`libs/*` project already
relies on - `infra/eslint.config.cjs`/`infra/jest.config.ts` are one-line
files extending the shared root config, matching every other project's
own file verbatim). `build` is the one target this project *couldn't*
reuse an existing Nx executor for (no `@nx/js:tsc`/`@nx/webpack:webpack`
executor fits "type-check, then run `cdk synth`") - it's a small
`nx:run-commands` target instead (`tsc --noEmit` then `cdk synth`, no
stack argument - see §10's `[Bug fix]` for why this is `cdk synth`, not
`cdk synth --all`).

`[Design Decision]` This repository has a single root `package.json` -
no `apps/*`/`libs/*` project has its own (confirmed by inspection before
adding anything). `infra` follows that same convention rather than
introducing a second, divergent dependency-management surface: CDK's
required packages (`aws-cdk-lib`, `constructs`, `aws-cdk`) were added to
the *root* `package.json`, not a new `infra/package.json`. `infra/cdk.json`
still exists (CDK-specific, not a dependency manifest) pointing its `app`
command at `npx ts-node bin/infra.ts`, resolved against the repository's
one hoisted `node_modules` (`.npmrc`'s `shamefully-hoist=true`, already
relied on by every other project the same way).

## 5. Per-stack design notes

### 5.1 Cognito (Blueprint §8, ADR-004)

One User Pool per environment (not one pool per persona group) - Blueprint
§8.2's own words: "both first-class Cognito authentication flows in the
same User Pool, distinguished by a custom attribute (`auth_method`)."
Two app clients (`mobile-client` with `ALLOW_CUSTOM_AUTH` +
`ALLOW_USER_SRP_AUTH`, `web-admin-client` with `ALLOW_USER_SRP_AUTH` only),
token lifetimes matching §8.3's table exactly (15-minute access/ID token,
30-day refresh token) verbatim.

**Two things §8 describes that this stack deliberately does not
implement**, both because implementing them means writing business logic,
out of scope per this milestone's own "Do NOT... introduce new business
functionality":

1. The phone-OTP custom auth flow's actual mechanics (`DefineAuthChallenge`/
   `CreateAuthChallenge`/`VerifyAuthChallengeResponse` Lambda triggers -
   OTP generation, SMS dispatch, code verification). `ALLOW_CUSTOM_AUTH`
   is enabled as a supported client auth flow, but no trigger Lambdas are
   wired - a pool in this state cannot complete a custom-auth sign-in
   yet.
2. Per-role mandatory MFA (§8.2's Treasurer/Assistant Pastor/Resident
   Pastor/Admin rows). A Cognito User Pool's MFA setting is pool-wide
   (`OPTIONAL`/`REQUIRED`/`OFF`), not expressible per-role when every
   role shares one pool. `mfaMode: 'OPTIONAL'` (every environment's
   config today) is the only pool-level setting compatible with "some
   roles need it, some don't" - actually *enforcing* "these four roles
   must have MFA enrolled before sign-in completes" needs a
   `PreTokenGeneration` Lambda trigger (or an application-layer check)
   reading the user's role/`auth_method` - a future application-layer
   milestone's job, not this one's.

### 5.2 EventBridge + SQS (Blueprint §10.1/§10.2/§10.5/§10.7)

`modules/engagement-signal-bus.construct.ts` - one custom Event Bus, three
SQS queues (`insights-consumer`, `notification-consumer`,
`audit-consumer`) each with its own DLQ, three EventBridge Rules (all
events → insights, all events → audit, curated alertable subset →
notification) matching Blueprint §10.2's diagram exactly.

**Grounded in the real, already-built producers**, not assumed: the "all
events" rules match `source: ['ecclesia.api', 'ecclesia.worker']` - the
exact two literal `Source` strings
`apps/api/src/platform/events/eventbridge-publisher.service.ts` and
`apps/worker/src/platform/events/eventbridge-publisher.service.ts` use
today (confirmed by reading both files, from the Engagement Signal
Ingestion Pipeline milestone).

`[Known limitation]` The alertable-events rule's `DetailType` list
(Blueprint §10.7's named alert types) includes some event-type strings
this milestone had to write by convention rather than cite verbatim -
`apps/worker`'s alert-emitting sweeps don't all publish these exact
`eventType` strings onto the bus yet (some sweeps, per
`WORKER_DESIGN_NOTES.md`, only *detect and signal internally* rather than
publish - see that file's own "no system actor" disclosure). Getting one
of these strings wrong only means that specific alert type silently never
reaches `notification-consumer`, not a wrong-recipient or data-leak
failure (`insights-consumer`/`audit-consumer` still receive every event
regardless). Needs reconciliation against `libs/contracts`'s real
`eventType` constants once every alert-emitting sweep actually publishes.

`[Known limitation]` The application's own default `EVENTBRIDGE_BUS_NAME`
(`apps/worker/src/platform/config/env.schema.ts`,
`'ecclesia-engagement-signals'`, no environment prefix) does **not**
match this stack's per-environment, prefixed bus name
(`ecclesia-{env}-engagement-signals`) - by design, since one bus per
environment is the whole point of parameterizing this stack by
environment. A future Compute milestone's ECS task definition **must**
set `EVENTBRIDGE_BUS_NAME`/`SQS_INSIGHTS_QUEUE_URL`/
`SQS_NOTIFICATION_QUEUE_URL`/`SQS_AUDIT_QUEUE_URL` explicitly per
environment (from this stack's `CfnOutput`s/SSM parameters, §8 below) -
it cannot rely on the application-side schema defaults. Repeated in
`DEPLOYMENT.md`'s manual steps since this is exactly the kind of gap
Blueprint §11.4's ADR-008 names as CDK-in-TypeScript's own rationale for
existing ("the infra team named the queue one thing, the app expects
another").

### 5.3 SES (supporting Blueprint §8, not §10.7)

**Why this stack exists at all** is itself a disclosed design decision -
see `lib/stacks/ses-stack.ts`'s own doc comment for the full reasoning.
Short version: Blueprint §10.7's Notification fan-out is push/SMS/WhatsApp
only, no email channel - this stack is **not** that. It exists to give
Cognito production-quality transactional email deliverability for the
four email+password personas (§8.2), since Cognito's own default email
sending has a low quota unsuitable for production.

`[Open Question]` No real sending domain/address has been confirmed for
any environment - `config.ses.emailIdentity` is `undefined` everywhere
today. The stack still provisions a `ConfigurationSet` (bounce/complaint
tracking, identity-independent) but skips creating an `EmailIdentity`
until a real domain exists. See this milestone's final summary.

`[Known limitation]` Even once an identity exists, `CognitoStack` is not
wired to use it (`cognito.UserPoolEmail.withSES(...)`) - that's a
follow-up change once the domain question is answered, not made
speculatively here.

### 5.4 Secrets Manager (Blueprint §11.7)

Three secrets per environment: `database-credentials` (a real, randomly
generated password now, placeholder `host`/`port`/`dbname` fields pending
the RDS stack), `mobile-money-provider` and `sms-gateway` (empty
placeholders pending real providers being contracted, Blueprint §11.7's
own "future integration" language). `[Known limitation]` No automatic
rotation is configured for any secret - §11.7's own ask ("Secrets
Manager's automatic rotation is enabled for the RDS credential
specifically") needs a live RDS instance and a rotation Lambda to rotate
against, neither of which exists yet (§7).

### 5.5 CloudWatch (Blueprint §12)

Built: one SNS alert topic per environment (§12.7's "single on-call
channel"), with an email subscription only if `config.alerting.email` is
set (no address confirmed for any environment yet - see this milestone's
final summary); real CloudWatch Alarms on the six SQS queues/DLQs
`EventingStack` creates (§12.4's "SQS queue depth and age-of-oldest-
message (Worker backlog indicator)"); one dashboard with those same
metrics as widgets.

`[Known limitation]` No ECS/RDS-metric alarms or dashboard widgets exist
- none of those resources exist yet (§7). The dashboard's own first
widget is a Markdown text block stating this plainly, so anyone opening
the real CloudWatch console sees the same disclosure this document makes,
not just this file.

### 5.6 IAM (least-privilege runtime roles)

Four roles per environment: an execution role + a task role, for each of
`apps/api` and `apps/worker` (Blueprint §11.1's two ECS Fargate services).
Every permission grant uses CDK's resource-scoped `.grant*()` convenience
methods (`queue.grantConsumeMessages`, `eventBus.grantPutEventsTo`,
`secret.grantRead`) - each scoped by CDK itself to the exact ARN of the
one resource granted, never `resources: ['*']` - the concrete mechanism
satisfying "Principle of least privilege for IAM." The one exception
(SES send permission, since `aws-ses`'s `EmailIdentity` construct has no
CDK grant convenience method) is a hand-written `iam.PolicyStatement`
still scoped to that one identity's ARN, not a wildcard.

`[Known limitation]` No ECS task definition exists yet to actually
*attach* these roles to (§7) - they are real, deployable IAM resources
today, trust-policy-scoped to `ecs-tasks.amazonaws.com` so nothing else
can assume them even before a task definition references them.

## 6. `[Design Decision]` Single AWS account, region placeholder

The milestone brief's own "AWS setup... complete" list names **one** AWS
account, one IAM administrator user, one AWS CLI configuration - not a
multi-account setup. Every `EnvironmentConfig.account` is therefore
`undefined` (falls back to whatever account the deploying credentials
resolve to, `CDK_DEFAULT_ACCOUNT`) - all three environments are modeled
against that single shared account, with environment isolation coming
from resource-name prefixing (`ecclesia-{env}-...`, every stack's own
`resourceName()` calls) rather than account separation. This means only
**one** `cdk bootstrap` is needed total (not three) - stated precisely in
`DEPLOYMENT.md`. A multi-account setup (one AWS account per environment,
a common later-maturity step via AWS Organizations) is a reasonable
future improvement, not required now, and not silently assumed either way
- flagged explicitly here.

`region: 'eu-west-1'` (Ireland) in every environment's config is a
**placeholder, not a researched recommendation** - neither the PRD nor
the Technical Blueprint names an AWS region anywhere. `af-south-1` (AWS's
own Cape Town region, geographically closest to Ghana) is a reasonable
alternative worth evaluating. This needs real confirmation before `cdk
bootstrap` - see this milestone's final summary.

## 7. `[Known limitation]` What this milestone's scope deliberately excludes

Named explicitly, not silently dropped - every item below is a real gap
against the Blueprint, flagged the same way this codebase discloses every
other known gap:

- **The `pilot` environment** (Blueprint §11.2, PRD §22.2's staged
  rollout) - this milestone's brief names exactly three environments;
  `pilot` is not a fourth `EnvironmentName`. Closing this gap later is
  small: one `environments/pilot/config.ts` file, one entry in
  `ENVIRONMENT_NAMES` - no stack class needs to change, since every stack
  is already written generically against `EnvironmentConfig`.
- **VPC, ECS Fargate (API + Worker), RDS PostgreSQL, ElastiCache Redis**
  (Blueprint §11.1/§11.3/§7.7/§13.3) - an entirely different
  infrastructure layer (compute + data) than this milestone's named scope
  (identity/eventing/observability/secrets/IAM). Not started here at all
  - the natural next infrastructure milestone.
- **CI/CD pipeline wiring** (Blueprint §11.5's GitHub Actions →
  staging → pilot/production flow) - `.github/workflows/ci.yml` is
  untouched by this milestone; wiring `cdk deploy` into it is a future
  step, explicitly after this milestone's own "Do NOT deploy" instruction
  is lifted by a real decision to do so.
- **Cognito's phone-OTP Lambda triggers and per-role MFA enforcement**
  (§5.1 above).
- **Wiring `apps/api`/`apps/worker`'s config modules to read the SSM
  parameters/`CfnOutput`s this milestone's stacks write** (§8 below) -
  today those apps still read from environment variables set however
  they're currently run (locally, or Dev-Auth); connecting that to this
  infrastructure's real output values is future application-layer wiring,
  not built here.

## 8. Shared-naming-source-of-truth mechanism

Blueprint §11.4's ADR-008 names the exact risk CDK-in-TypeScript is
chosen to avoid: "the infra team named the queue one thing, the app
expects another." This milestone's concrete mechanism for that:
`lib/common/parameters.ts`'s `writeParameter()` writes every
externally-relevant resource identifier (User Pool ID, Event Bus name,
queue URLs, IAM role ARNs) to AWS Systems Manager Parameter Store under
one convention, `/ecclesia/{env}/{category}/{key}`
(`lib/common/naming.ts`'s `parameterPath()`). A future application-layer
milestone's `apps/api`/`apps/worker` configuration modules can read these
at deploy/boot time instead of hardcoding values that could drift from
what this infra code actually created. `CfnOutput`s are also written
alongside, for a human running `cdk deploy` to read directly - the two
aren't redundant, they serve different readers (a running application vs.
a person at a terminal).

## 9. Tests

One `*.spec.ts` file per stack (`lib/stacks/*.spec.ts`), using
`aws-cdk-lib/assertions`'s `Template`/`Match` - CDK's own recommended
"fine-grained assertions" testing pattern, not full-template snapshot
tests (which break on every incidental CloudFormation-serialization
change and don't actually assert intent). Plus one pure-function test
(`lib/common/naming.spec.ts`) and one whole-app smoke test
(`bin/infra.spec.ts`) that shells out to `ts-node bin/infra.ts` exactly as
`cdk synth` would invoke it and confirms all eighteen stack templates
synthesize. See this milestone's final summary for what was/wasn't
possible to actually *run* in this environment.

## 10. `[Bug fix]` What §9's own verification claim missed - found via a real `pnpm build`/`pnpm test` run

This sandbox could not install `aws-cdk-lib`/`constructs`/`aws-cdk` at all
(§9's own disclosed limitation), so this milestone's own `cdk synth` was
never actually executed before being handed off - only manually reviewed
against the real CDK v2 API surface, plus two local stand-in verification
techniques (a hand-rolled `any`-stub type-check, and a plain `tsc`/`eslint`
pass against the unresolvable-module errors). The user's own real
`pnpm build` run on their machine surfaced two genuine bugs neither
technique could have caught, since both require actually invoking the
real `cdk` CLI against the real `aws-cdk-lib`:

1. **`infra/cdk.json`'s `context` block contained a CDK v1-only feature
   flag** (`@aws-cdk/core:enableStackNameDuplicates`) that no longer
   exists in CDK v2 - the real `cdk` CLI throws a hard
   `UnsupportedFeatureFlag` error the moment any stack is constructed,
   failing `infra:build` outright. This context block was written
   speculatively (this document's §4 already flagged it as "needing
   reconciliation... before being trusted," but that flag should never
   have been included at all - a stale v1 flag is actively harmful, not
   merely unnecessary). **Fixed**: the block was emptied entirely
   (`"context": {}`) rather than guessing at a replacement set of v2
   flags this sandbox has no way to verify against the real CLI either -
   a real `cdk init`/`cdk doctor` reconciliation on a machine with `aws-cdk`
   installed is the honest way to populate this later, not another guess
   here.
2. **`cdk synth --all` is not a recognized flag** - only `cdk
   deploy`/`destroy`/`diff` accept `--all` to select every stack; `cdk
   synth` with no stack argument already means "every stack in the app."
   The CLI only warned ("Unknown option(s): --all... ignored") rather than
   failing on this one by itself, but it was still wrong. **Fixed**:
   `project.json`'s `build`/`synth` targets, and every doc reference to
   `cdk synth --all`, now say plain `cdk synth`.

Both are now fixed and, per this milestone's own disclosure discipline,
**neither has been re-verified with a real `cdk synth` run in this
sandbox either** - the same install limitation still applies. A second
real `pnpm build` run is needed to confirm `infra:build` is actually
clean now, not just plausibly fixed by inspection.
