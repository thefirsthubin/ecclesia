# Environment configuration guide

How this CDK app is parameterized per environment, and how to change or
add one. See `INFRASTRUCTURE_DESIGN_NOTES.md` §2/§6 for the full design
rationale - this file is the practical how-to.

## The three environments

`dev`, `staging`, `production` - `lib/common/types.ts`'s `EnvironmentName`
type. Each has a `config.ts` file under `environments/<name>/` exporting
one `EnvironmentConfig` object (the interface is fully documented in
`lib/common/types.ts` - every field has a doc comment explaining what it
controls and why its current value was chosen).

| | `dev` | `staging` | `production` |
|---|---|---|---|
| Removal policy | `DESTROY` | `DESTROY` | `RETAIN` |
| Termination protection | off | off | **on** |
| Log retention | 14 days | 30 days | 365 days |
| Cognito MFA mode | `OPTIONAL` | `OPTIONAL` | `OPTIONAL` (see below) |
| Cognito advanced security | `AUDIT` | `AUDIT` | `ENFORCED` |
| SQS max receive count | 3 | 3 | 5 |

`[Known limitation]` MFA mode is `OPTIONAL` in every environment,
including production - a Cognito User Pool's MFA setting is pool-wide,
and Blueprint §8.2 requires MFA mandatory for only *some* roles sharing
one pool. See `INFRASTRUCTURE_DESIGN_NOTES.md` §5.1 for the full
explanation and what a future milestone needs to add to actually enforce
this per-role.

## Changing a value for one environment

Edit that environment's `environments/<name>/config.ts` directly - e.g.
to change `staging`'s log retention, edit
`environments/staging/config.ts`'s `logRetentionDays` field. No other
file needs to change; every stack reads its behavior from the
`EnvironmentConfig` object passed into its constructor, never from a
hardcoded environment check.

## Two fields every environment currently leaves unset

- **`ses.emailIdentity`** - no real sending domain/address has been
  confirmed yet (`INFRASTRUCTURE_DESIGN_NOTES.md` §5.3's `[Open
  Question]`). Once one is, set it in that environment's `config.ts`, run
  `pnpm nx run infra:synth`, review the diff, and deploy that one
  environment's `SesStack`.
- **`alerting.email`** - no on-call address has been confirmed yet.
  Same process: set it, synth, review, deploy that environment's
  `ObservabilityStack`. The alert SNS topic already exists regardless -
  this only adds the email subscription.

Neither of these requires any stack *code* to change - they're exactly
the kind of "configurable without duplicating infrastructure definitions"
value this app's design (`INFRASTRUCTURE_DESIGN_NOTES.md` §2) exists for.

## Adding a fourth environment (e.g. `pilot`)

Blueprint §11.2 names a `pilot` environment this milestone's three-
environment scope deliberately excludes
(`INFRASTRUCTURE_DESIGN_NOTES.md` §7). To add it later:

1. Add `'pilot'` to `EnvironmentName` (`lib/common/types.ts`) and
   `ENVIRONMENT_NAMES` (same file).
2. Create `environments/pilot/config.ts`, exporting an `EnvironmentConfig`
   for it (copy `environments/production/config.ts` as a starting point -
   PRD §22.2 describes `pilot` as running with real data at a scoped
   subset of production's posture).
3. Add `pilot: pilotConfig` to `environments/index.ts`'s
   `CONFIGS_BY_ENVIRONMENT` map.

No stack class in `lib/stacks/` needs to change - `bin/infra.ts`'s loop
over `ENVIRONMENT_NAMES` picks the new environment up automatically.

## Account and region

Every environment's `account` is `undefined` today - all three deploy
into whichever single AWS account the deploying credentials resolve to
(`INFRASTRUCTURE_DESIGN_NOTES.md` §6 explains why: only one AWS account
exists per this milestone's own brief). `region` is `'eu-west-1'`
everywhere, a **placeholder** needing real confirmation - see this
milestone's final summary and `DEPLOYMENT.md`'s manual steps before
running `cdk bootstrap` anywhere.
