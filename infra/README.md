# infra — Ecclesia AWS CDK Infrastructure

A TypeScript AWS CDK v2 application defining Ecclesia's cloud
infrastructure, per Blueprint §11.4 (ADR-008: "AWS CDK with TypeScript,
living in `infra/`, for all infrastructure definitions").

**Status: infrastructure-as-code only.** Nothing here has been deployed.
See `DEPLOYMENT.md` for the manual steps still required before it can be.

## What's in here

| Path | Contents |
|---|---|
| `bin/infra.ts` | CDK app entrypoint - instantiates all six stacks, for all three environments |
| `lib/common/` | Shared base class (`EcclesiaStack`), naming/tagging/SSM-parameter helpers, the `EnvironmentConfig` type |
| `lib/stacks/` | The six stacks: Cognito, Eventing (EventBridge+SQS), Ses, Secrets, Iam, Observability (CloudWatch) |
| `modules/` | Reusable constructs shared across environments/stacks (currently: the EventBridge bus + queues construct) |
| `environments/` | One `config.ts` per environment (`dev`/`staging`/`production`) - the only place environment-specific values live |
| `*.spec.ts` (colocated) | `aws-cdk-lib/assertions`-based tests per stack, plus a whole-app synth smoke test |

Further reading:

- **`INFRASTRUCTURE_DESIGN_NOTES.md`** - the full architecture overview,
  CDK project structure, and every design decision/citation/disclosed
  limitation behind this milestone.
- **`ENVIRONMENTS.md`** - how environment configuration works, and how to
  change or add one.
- **`DEPLOYMENT.md`** - the environment promotion flow, and the manual
  steps still required before any real deployment.

## Quickstart (once `pnpm install` has run for real - see below)

```bash
cd infra
npx cdk synth            # no stack argument = every stack, every environment
npx cdk diff 'Ecclesia-Dev-*'
npx tsc --noEmit -p tsconfig.json
```

`[Bug fix, found via a real run]` `cdk synth --all` (this project's
original own commands) is **not** a recognized `cdk synth` flag - only
`cdk deploy --all`/`cdk destroy --all`/`cdk diff --all` accept `--all`.
`cdk synth` with no stack selector already synthesizes every stack by
default, so no flag is needed at all. Fixed in `project.json`'s
`build`/`synth` targets and everywhere else this was written.

Or via this repository's own Nx targets, from the repo root:

```bash
pnpm nx run infra:build   # tsc --noEmit, then cdk synth
pnpm nx run infra:synth   # cdk synth only
pnpm nx run infra:lint
pnpm nx test infra
```

`pnpm lint`/`pnpm test`/`pnpm build` at the repo root already include
this project - no separate command is required for those three to cover
`infra` too (`INFRASTRUCTURE_DESIGN_NOTES.md` §4).

## `[Disclosed limitation]` What could not be verified in this sandbox

This sandbox has no AWS package-registry access - `npm view aws-cdk-lib`
returns a 403, the same disclosed limitation every prior milestone in
this repository has carried for its own dependencies. `aws-cdk-lib`,
`constructs`, and `aws-cdk` were added to the root `package.json` but
could not actually be installed here, meaning `cdk synth`, `tsc`, `eslint`
and `jest` could not be *run* against this code in this environment - only
written and manually reviewed against the real AWS CDK v2 API surface.
**A real `pnpm install` followed by `pnpm lint && pnpm test && pnpm
build` on a machine with registry access is required to confirm this
milestone's own validation criteria are actually met** - see this
milestone's final summary for the complete, honest disclosure.

## Do NOT (this milestone's own constraints, still in force)

- Do not run `cdk bootstrap`.
- Do not run `cdk deploy`.
- Do not provision anything by hand in the AWS Console that this code
  should define instead.

`DEPLOYMENT.md` documents when and how those steps happen, once a real
decision is made to start deploying.
