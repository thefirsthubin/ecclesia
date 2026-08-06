# infra — Ecclesia AWS CDK Infrastructure

A TypeScript AWS CDK v2 application defining Ecclesia's cloud
infrastructure, per Blueprint §11.4 (ADR-008: "AWS CDK with TypeScript,
living in `infra/`, for all infrastructure definitions").

**Status:** the original six stacks (Cognito, Eventing, Ses, Secrets, Iam,
Observability) are deployed to `dev` (bootstrapped and deployed by the
user directly, after the Production Infrastructure Foundation milestone
shipped). The seven Milestone 10 (Cloud Runtime Infrastructure) stacks
below are code-complete and verified via a real `cdk synth`, but **not yet
deployed** anywhere - `cdk deploy` for them was outside this milestone's
own scope. See `DEPLOYMENT.md` and `INFRA_RUNTIME.md` §8 for what's left.

## What's in here

| Path | Contents |
|---|---|
| `bin/infra.ts` | CDK app entrypoint - instantiates all 13 stacks, for all three environments (39 stacks total) |
| `lib/common/` | Shared base class (`EcclesiaStack`), naming/tagging/SSM-parameter helpers, the `EnvironmentConfig` type |
| `lib/stacks/` | 13 stacks: Cognito, Eventing, Ses, Secrets, Iam, Observability (Production Infrastructure Foundation) + Network, Database, EcsCluster, Alb, ApiService, WorkerService, RuntimeObservability (Cloud Runtime Infrastructure, Milestone 10) |
| `lib/constructs/` | Reusable constructs: `Network` (VPC/subnets/security groups), `FargateService` (task def + container + log group + optional ALB attachment) |
| `modules/` | The EventBridge bus + queues construct (Production Infrastructure Foundation) |
| `environments/` | One `config.ts` per environment (`dev`/`staging`/`production`) - the only place environment-specific values live |
| `*.spec.ts` (colocated) | `aws-cdk-lib/assertions`-based tests per stack |
| `apps/api/Dockerfile`, `apps/worker/Dockerfile` | Container images for the two Fargate-deployed services (not in `infra/` itself - colocated with the apps they build) |

Further reading:

- **`INFRA_RUNTIME.md`** - Milestone 10's own architecture diagram,
  deployment order, networking/security/scaling/DR/rollback design, and
  cost estimate.
- **`INFRASTRUCTURE_DESIGN_NOTES.md`** - the original six stacks' full
  architecture overview and design decisions.
- **`ENVIRONMENTS.md`** - how environment configuration works.
- **`DEPLOYMENT.md`** - the environment promotion flow.

## Quickstart

```bash
cd infra
npx cdk synth            # no stack argument = every stack, every environment
npx cdk diff 'Ecclesia-Dev-*'
npx tsc --noEmit -p tsconfig.json
```

Or via this repository's own Nx targets, from the repo root:

```bash
pnpm nx run infra:build   # tsc --noEmit, then cdk synth
pnpm nx run infra:synth   # cdk synth only
pnpm nx run infra:lint
pnpm nx test infra
```

`pnpm lint`/`pnpm test`/`pnpm build` at the repo root already include this
project.

## What was actually verified, and how

Unlike earlier in this project's history, this sandbox's mounted repo
folder has a real `node_modules` with `aws-cdk-lib`/`aws-cdk` installed
(from the user's own `pnpm install`), so `tsc`, `cdk synth`, and `eslint`
could genuinely be run here for Milestone 10 - not just written and
manually reviewed. `INFRA_RUNTIME.md` §9 has the full account, including
three real bugs a synth-only or review-only pass would have missed
(an ECS capacity-provider error, two `DependencyCycle`s, and a
silently-wrong subnet count). `jest` still cannot run in this sandbox
(`@swc/core`'s installed binding is macOS-only) - every new spec's
assertions were instead individually cross-checked against real
synthesized CloudFormation JSON.

## Do NOT (still in force for anything not already deployed)

- Do not run `cdk bootstrap`/`cdk deploy` for `staging`/`production`, or
  for `dev`'s seven new Milestone 10 stacks, without a deliberate decision
  to do so - each provisions real, billable AWS resources.
- Do not provision anything by hand in the AWS Console that this code
  should define instead.

`DEPLOYMENT.md` documents the promotion flow once that decision is made.
