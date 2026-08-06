# Deployment strategy

**This milestone does not deploy anything.** Nothing in this file has
been executed - it documents the strategy this CDK app is built for, and
the exact manual steps a future milestone (or a human operator) needs
before any of it can run for real. See this milestone's final summary for
the same list, framed as recommendations.

## Environment promotion flow (Blueprint §11.2/§11.5)

```
feature branch → dev (automatic, per push)
        │
        ▼
     main branch → staging (automatic, on merge)
        │              │
        │              ▼
        │      RBAC executable spec (Blueprint §9.5) +
        │      migration dry-run + smoke tests
        │              │
        │              ▼
        │      Manual promotion gate
        │              │
        ▼              ▼
     pilot ◄─── (Blueprint §11.2 - not modeled in this
        │        milestone's 3-environment scope, see
        │        ENVIRONMENTS.md's "adding pilot" section)
        ▼
   production (manual promotion from pilot, Release 1;
               later directly from staging once the
               pilot-phase gate is no longer needed)
```

This CDK app's own structure mirrors that: three independent stack
groups, one per environment (`Ecclesia-Dev-*`, `Ecclesia-Staging-*`,
`Ecclesia-Production-*`), deployable independently. Nothing about
`bin/infra.ts`'s design requires deploying all three together - `cdk
deploy 'Ecclesia-Dev-*'` deploys only dev's six stacks, for instance.

## Prerequisite: `cdk bootstrap`

CDK requires a one-time, per-account-per-region bootstrap (an S3 bucket +
IAM roles CDK uses to stage deployment assets) before any `cdk deploy` can
run. Per `INFRASTRUCTURE_DESIGN_NOTES.md` §6, all three environments in
this milestone target the **same** AWS account - so only **one**
`cdk bootstrap` is needed total, not three, once account and region are
confirmed:

```
npx cdk bootstrap aws://<ACCOUNT_ID>/<REGION>
```

**Not run as part of this milestone**, per the brief's explicit
instruction.

## Deploying (once bootstrap has happened - not part of this milestone)

```
cd infra
npx cdk deploy 'Ecclesia-Dev-*'          # every dev stack
npx cdk deploy Ecclesia-Dev-Cognito       # one specific stack
npx cdk diff 'Ecclesia-Staging-*'         # review before deploying
```

Stack dependency ordering (`IamStack` depends on `EventingStack`/
`SecretsStack`/`SesStack`; `ObservabilityStack` depends on
`EventingStack`) is handled automatically by CDK - `cdk deploy
'Ecclesia-Dev-*'` deploys them in the correct order without any manual
sequencing.

## CI/CD (Blueprint §11.5) - not wired in this milestone

`.github/workflows/ci.yml` is untouched. Wiring `cdk deploy` into it
(dev on every push, staging on merge to `main`, a manual promotion gate
before pilot/production) is future work, explicitly deferred until a real
decision is made to start deploying - this milestone is infrastructure
*definitions* only.

## Manual steps still required before any real deployment

Reproduced from this milestone's final summary, with the file each one
lives in:

1. **Confirm the AWS account ID and region.** `region: 'eu-west-1'` in
   every `environments/*/config.ts` is a disclosed placeholder
   (`INFRASTRUCTURE_DESIGN_NOTES.md` §6) - confirm it (or switch to
   `af-south-1`, or another region) before bootstrapping.
2. **Run `cdk bootstrap`** against the confirmed account/region (above) -
   once, not per environment.
3. **Confirm a real SES sending domain/address** per environment and set
   `ses.emailIdentity` in that environment's `config.ts`
   (`ENVIRONMENTS.md`'s "two fields every environment currently leaves
   unset").
4. **Confirm a real on-call alert email** per environment and set
   `alerting.email` (same section of `ENVIRONMENTS.md`).
5. **Populate the two placeholder Secrets Manager secrets**
   (`mobile-money-provider`, `sms-gateway`) with real values once those
   providers are actually contracted - manually, via the console or `aws
   secretsmanager put-secret-value`, never by committing a value into
   this CDK code (`lib/stacks/secrets-stack.ts`'s own doc comment).
6. **A real `pnpm install`, then `pnpm nx run infra:build` (or `cdk
   synth`/`cdk diff`)** to confirm this project actually compiles and
   synthesizes on a machine with real AWS SDK type definitions and
   network access - this sandbox could not install `aws-cdk-lib`/
   `constructs`/`aws-cdk` at all (no package-registry access, the same
   disclosed limitation every prior milestone in this repository has
   carried). See this milestone's final summary for the full disclosure.
