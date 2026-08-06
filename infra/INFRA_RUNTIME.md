# Cloud Runtime Infrastructure (Milestone 10)

This document covers the seven stacks Milestone 10 added on top of the
Production Infrastructure Foundation milestone's original six
(`INFRASTRUCTURE_DESIGN_NOTES.md`). Together they let Ecclesia run as a
real, deployed cloud-native application - not just infrastructure-as-code
sitting unused.

## 1. Architecture diagram

```
Internet
   |
Application Load Balancer (public subnets)          <- AlbStack
   |
   | HTTP :80 (HTTPS once a certificate exists)
   v
ECS Fargate Cluster (private-app subnets)            <- EcsClusterStack
 |------------------------------|
 |                              |
apps/api Service          apps/worker Services (x3)  <- ApiServiceStack, WorkerServiceStack
 (1 task, port 3000)       (consume:insights/notification/audit)
 |          |                   |
 |          |                   |
 v          v                   v
RDS      EventBridge/SQS    EventBridge/SQS          <- DatabaseStack, EventingStack (existing)
(private- (existing, Production
 db       Infrastructure Foundation
 subnets) milestone)
 |                              |
 v                              v
Secrets Manager (existing secret + one new  <- SecretsStack (existing) + DatabaseStack
 AppRoleCredentials secret)
 |
 v
CloudWatch (ECS/RDS alarms + dashboard,     <- RuntimeObservabilityStack
 existing SNS alert topic from ObservabilityStack)
```

Every box above is a real, synthesized CloudFormation resource - none of
this is a placeholder. `bin/infra.ts` instantiates all thirteen stacks
(six from the prior milestone, seven from this one) for `dev`/`staging`/
`production`, 39 stacks total.

## 2. Deployment order

CDK resolves this automatically from construct references (no manual
ordering needed for `cdk deploy --all`), but for a first manual, partial
rollout the dependency chain is:

1. `Secrets`, `Eventing`, `Ses`, `Cognito` (Production Infrastructure
   Foundation - already deployed to Dev as of this milestone).
2. `Network` (no dependencies).
3. `Database` (needs `Network` + `Secrets`).
4. `EcsCluster`, `Alb` (both need only `Network`, deploy in parallel).
5. `Iam` (Production Infrastructure Foundation - already deployed).
6. `ApiService` (needs `Network`, `EcsCluster`, `Alb`, `Database`, `Iam`,
   `Cognito`, `Eventing`, `Secrets` - the most connected stack in the app).
7. `WorkerService` (needs `Network`, `EcsCluster`, `Database`, `Iam`,
   `Eventing`, `Secrets`).
8. `RuntimeObservability` (needs `Observability` (existing) + `Database`
   + `ApiService` + `WorkerService` - deploys last, since it references
   every other new stack's resources).

## 3. Networking design

One VPC per environment, three Availability Zones (`NetworkingEnvironmentConfig.maxAzs`,
`environments/*/config.ts`), three subnet tiers:

- **Public** - the ALB only.
- **Private (with egress)** - ECS Fargate tasks. Routed through NAT
  Gateway(s) for ECR image pulls and AWS API calls (Cognito, EventBridge,
  SQS, Secrets Manager - none of which have interface VPC endpoints
  provisioned this milestone, a disclosed cost trade-off, see
  `network.construct.ts`'s own doc comment).
- **Private (isolated)** - RDS only. No route to the internet in either
  direction.

NAT Gateway count is environment-aware: 1 in dev/staging (cost-optimized -
neither is an availability rehearsal), 3 in production (one per AZ, no
single-NAT cross-AZ dependency). One free VPC endpoint (S3 gateway)
reduces NAT data-transfer cost for ECR layer pulls.

**`[Bug fix, found via a real cdk synth]`** The VPC construct originally
used `maxAzs` alone, which does not guarantee the requested AZ count: with
no concrete AWS account in scope at synth time (`EnvironmentConfig.account`
is `undefined` in every environment, an existing, disclosed placeholder),
CDK cannot look up how many AZs a region really has and silently falls
back to 2. A real synth produced 6 subnets (2 AZs x 3 tiers) instead of
the intended 9. Fixed by deriving explicit `availabilityZones` from
`config.region` (`network.construct.ts`) - confirmed via a second real
synth producing the correct 9 subnets.

Security groups, least-privilege chain: ALB (inbound 80/443 from
`0.0.0.0/0`) -> ECS (inbound 3000 from ALB SG only) -> RDS (inbound 5432
from ECS SG only, no other ingress, no egress at all).

## 4. Security model

- **Least-privilege IAM**: `ApiServiceStack`/`WorkerServiceStack` reuse
  the task roles the Production Infrastructure Foundation milestone's
  `IamStack` already built with resource-scoped `.grant*()` calls - no new
  IAM policies were written for this milestone's compute layer.
- **Private database**: RDS has no public IP, sits in isolated subnets,
  reachable only from the ECS security group.
- **Encryption everywhere**: RDS storage encryption (AWS-managed KMS key),
  `rds.force_ssl=1` (TLS required for every connection), Secrets Manager
  for all credentials.
- **No plaintext secrets**: task definitions inject only non-sensitive
  plain env vars (host, port, dbname, usernames - none of which are
  secret by themselves) and pull both database passwords from Secrets
  Manager via ECS `secrets` (never a literal value in the CloudFormation
  template) - see `apps/api/entrypoint.sh` for how the two are composed
  into full connection strings at container start, and
  `api-service-stack.ts`'s own doc comment for why that composition can't
  happen inside the ECS task definition alone.
- **`[Known limitation - disclosed]`** `ecclesia_app`'s real Postgres
  password is hardcoded as a literal in the protected
  `db/migrations/20260801050000_row_level_security_enforcement` migration
  (out of this milestone's power to change - "Existing Prisma Schema" is
  `DO NOT MODIFY`). `DatabaseStack` provisions a real, generated secret for
  this role anyway rather than injecting that literal as plaintext - see
  §7 below for the one manual step this implies.

## 5. Scaling strategy

- **`apps/api`**: `desiredCount` (1 dev/staging, 2 production) with
  `maxCapacity` headroom (`ComputeEnvironmentConfig.api`) for a future
  CPU-based target-tracking policy (not yet configured - `desiredCount` is
  currently static; auto-scaling policies are a natural next step once
  real traffic patterns exist to tune against).
- **`apps/worker`**: three independent services (one per SQS consumer),
  each scaled independently - a backlog on one queue doesn't need to scale
  the others.
- **RDS**: storage auto-scales up to `maxAllocatedStorageGb`. Multi-AZ
  (automatic failover) is production-only; compute scaling (a larger
  `instanceType`) is a manual, disclosed placeholder pending real capacity
  planning (`DatabaseEnvironmentConfig.instanceType`'s own doc comment).
- **ECS deployment circuit breaker** (`circuitBreaker: { enable: true,
  rollback: true }`, `fargate-service.construct.ts`) automatically rolls
  back a deployment whose tasks never reach a healthy state, rather than
  looping forever.

## 6. Disaster recovery

- **RDS automated backups**: 1 day (dev), 7 days (staging), 30 days
  (production) retention (`DatabaseEnvironmentConfig.backupRetentionDays`).
  Point-in-time recovery is available within that window via
  `aws rds restore-db-instance-to-point-in-time`.
- **Multi-AZ** (production only): automatic failover to a synchronous
  standby on an AZ-level outage, no manual intervention, brief
  (~1-2 minute) connection interruption during failover.
- **`removalPolicy`**: `DESTROY` in dev/staging, `RETAIN` in production -
  a production RDS instance and its secrets survive a stack deletion or
  replacement.
- **ECS**: stateless by design - a lost task is simply replaced by the
  service scheduler; no data lives on a Fargate task's own storage.
- **`[Known limitation - disclosed]`** No cross-region backup replication
  or standby region exists - a full region-level outage is not covered by
  this milestone. Out of scope per the milestone brief's own architecture
  (single-region VPC/RDS).

## 7. Rollback procedure

- **Application rollback**: `aws ecs update-service --cluster <cluster>
  --service <service> --task-definition <previous-revision>` for
  `apps/api` or any one of the three `apps/worker` services - ECS retains
  every task definition revision, so rolling back is choosing an older one.
- **Infrastructure rollback**: `cdk deploy` from a previous git commit,
  or `cdk diff`/`cdk deploy` after reverting the relevant stack's source.
  CloudFormation's own changeset-based deploys already roll back
  automatically on a failed stack update.
- **Database rollback**: point-in-time recovery (§6) restores to a new
  instance - RDS does not support in-place rollback of an existing
  instance's data.

## 8. Manual AWS steps still required

1. **`cdk deploy`** the seven new stacks per environment (not run by this
   milestone - "Do NOT... run cdk deploy" was this milestone's own
   constraint. Dev's original six stacks *were* separately deployed by the
   user after this milestone's predecessor, per the conversation history -
   these seven are new and undeployed as of this milestone).
2. **`ecclesia_app` password reconciliation** (§4 above, and
   `database-stack.ts`'s own doc comment): after first deploying
   `DatabaseStack` and running `prisma migrate deploy` against the real
   RDS endpoint (which creates `ecclesia_app` with the migration's
   hardcoded password), run `ALTER ROLE ecclesia_app WITH PASSWORD
   '<value from the AppRoleCredentials secret>'` once so the generated
   secret this stack created actually matches the role's real password.
3. **Docker must be installed** on whatever machine runs `cdk deploy` for
   `ApiService`/`WorkerService` - `cdk synth` does not need it (§9 below),
   but asset *publishing* (`docker build`/`docker push` to the CDK-managed
   ECR repository) happens during `cdk deploy` itself.
4. **A real domain + ACM certificate** for HTTPS - the ALB serves HTTP
   only until `AlbEnvironmentConfig.certificateArn` is set (§3 of
   `INFRASTRUCTURE_DESIGN_NOTES.md`'s own open question on domain
   ownership, still unresolved as of this milestone).
5. **SNS alert email subscription** - still unset for every environment
   (a gap already disclosed before this milestone; the new ECS/RDS alarms
   in `RuntimeObservabilityStack` publish to the same, still-unsubscribed
   topic).

## 9. Verification - what was actually run in this sandbox

Unlike the Production Infrastructure Foundation milestone, this sandbox's
mounted repo folder has a real `node_modules` with `aws-cdk-lib@2.263.0`
and `aws-cdk@2.1135.0` installed (the user ran a real `pnpm install` on
their own machine). This meant genuine verification was possible here,
not just manual review:

- **`npx tsc --noEmit -p tsconfig.json`** - passes cleanly against every
  new file.
- **`npx cdk synth`** - succeeds for all 39 stacks (13 x 3 environments),
  confirmed by inspecting `cdk.out/*.template.json` directly, not just
  trusting exit code 0.
- **Two real `DependencyCycle` bugs, found and fixed via this real synth**
  (not caught by `tsc` or manual review - both are CDK-runtime-only
  failures):
  1. `EcsClusterStack` threw `MustBeCapacityProviderAdded` - fixed by
     setting `enableFargateCapacityProviders: true`.
  2. `FargateService`/`DatabaseStack` cross-stack IAM/secret grants
     created real cycles - fixed by importing IAM roles as immutable
     (`iam.Role.fromRoleArn(..., { mutable: false })`) and switching RDS
     credentials from `Credentials.fromSecret()` (which auto-attaches the
     secret, the cycle's actual source per `aws-rds/lib/instance.js`'s own
     code) to `Credentials.fromPassword()` extracting just the password
     value.
- **One real subnet-count bug, found via a real synth** - `maxAzs` alone
  produced 6 subnets, not 9, with no concrete AWS account in scope. Fixed
  via explicit `availabilityZones` (§3 above).
- **Docker is *not* required for `cdk synth`** to succeed on
  `ApiServiceStack`/`WorkerServiceStack` - this sandbox has no Docker
  daemon at all (`docker --version` fails), yet all 39 stacks, including
  both Docker-image-asset stacks, synthesized successfully. CDK stages the
  build context into `cdk.out/asset.<hash>/` and hashes that source tree;
  the actual `docker build`/push only happens during `cdk deploy`'s
  separate asset-publishing step. This corrects an assumption made
  earlier in this same milestone's own code comments (also fixed).
- **`npx eslint`** against every new/modified `infra/` file - one real
  `consistent-type-imports` violation found and fixed
  (`fargate-service.construct.ts`'s `ec2` import).
- **Not verified in this sandbox**: an actual `docker build` (no Docker
  daemon here at all - confirmed, not assumed), a real `cdk deploy` of any
  of the seven new stacks, and `jest` for the seven new spec files
  (`@swc/core`'s installed native binding is built for macOS and cannot
  load on this Linux sandbox - the same limitation that blocked `nx test`
  for the prior infra milestone). Every spec assertion in this milestone
  was instead individually cross-checked against the real, synthesized
  CloudFormation JSON (`cdk.out/*.template.json`) via direct inspection,
  not left as an untested guess - see each `*.spec.ts` file's own comments
  where this mattered (e.g. the ALB target group living in `AlbStack`'s
  template, not `ApiServiceStack`'s).

## 10. Estimated AWS monthly cost (eu-west-1, rough, disclosed placeholders)

Not a quote - order-of-magnitude figures to inform a real cost review
before deploying, using approximate eu-west-1 on-demand pricing:

| Component | Dev | Staging | Production |
|---|---|---|---|
| NAT Gateway(s) | ~$33 (1) | ~$33 (1) | ~$100 (3) |
| RDS (`instanceType` + storage + backups) | ~$15 | ~$20 | ~$140 (Multi-AZ t3.medium) |
| Application Load Balancer | ~$20 | ~$20 | ~$25 (more LCU usage) |
| Fargate (`apps/api`, 1-2 tasks) | ~$20 | ~$20 | ~$80 |
| Fargate (`apps/worker`, 3 tasks) | ~$30 | ~$30 | ~$60 |
| CloudWatch (logs, alarms, dashboard) | ~$5 | ~$8 | ~$15 |
| Secrets Manager (2 secrets) | ~$1 | ~$1 | ~$1 |
| **Total (rough)** | **~$125/mo** | **~$130/mo** | **~$420/mo** |

Excludes data transfer (highly usage-dependent) and the six existing
stacks' own cost (Cognito, EventBridge/SQS, SES, Secrets Manager,
CloudWatch, IAM - all comparatively small, mostly request-based pricing).
A real AWS Cost Explorer review after a real deployment, per Blueprint
§13.5's own cost-stewardship principle, is what should replace this
estimate - not the other way around.
