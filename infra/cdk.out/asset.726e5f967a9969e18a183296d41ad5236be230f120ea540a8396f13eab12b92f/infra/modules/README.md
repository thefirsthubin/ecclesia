# infra/modules

Reusable CDK constructs, shared across environments (Blueprint §11.3-§11.4).

**Status: partially populated in the Production Infrastructure Foundation milestone.**

## Built in this milestone

- `engagement-signal-bus.construct.ts` - the EventBridge custom bus + three
  per-consumer SQS queues/DLQs/rules construct (Blueprint §10.1/§10.2),
  consumed by `infra/lib/stacks/eventing-stack.ts`.

## Deliberately deferred (not built in this milestone)

This directory's own pre-existing description named "VPC, ECS Fargate
service, RDS, ElastiCache" as constructs that belong here. None of those
are built yet:

- **They are a different infrastructure layer** (compute/data, Blueprint
  §11.1/§11.3/§7.7/§13.3) than this milestone's named scope (Cognito,
  EventBridge, SQS, SES, Secrets Manager, CloudWatch, IAM) - see
  `../INFRASTRUCTURE_DESIGN_NOTES.md` §7 for the full disclosure of this
  boundary.
- **A VPC construct specifically would break this milestone's own "no
  live AWS context lookups" design constraint** (`../bin/infra.ts`'s own
  doc comment) - `ec2.Vpc`'s default availability-zone discovery requires
  a real AWS API call at synth time unless AZs are hardcoded, which would
  make `cdk synth` depend on live AWS credentials before this project has
  even been bootstrapped.

Building these is the natural next infrastructure milestone once compute
is actually needed (i.e., once the application is ready to run on ECS
rather than continuing to be verified via `pnpm nx serve` locally).
