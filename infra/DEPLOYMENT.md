# Deployment strategy

**Status:** `dev`'s original six stacks (Cognito, Eventing, Ses, Secrets,
Iam, Observability - Production Infrastructure Foundation) are deployed
for real, to AWS account `403677988069` in `eu-west-1`. The seven Cloud
Runtime Infrastructure stacks (Network, Database, EcsCluster, Alb,
ApiService, WorkerService, RuntimeObservability) are code-complete and
`cdk synth`-verified but **not yet deployed** anywhere. Nothing has been
deployed to `staging`/`production`. See `INFRA_RUNTIME.md` §2/§8 for the
full design detail behind the steps below.

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
deploy 'Ecclesia-Dev-*'` deploys only dev's thirteen stacks (six already
live, seven not yet), for instance.

## Prerequisite: `cdk bootstrap`

CDK requires a one-time, per-account-per-region bootstrap (an S3 bucket +
IAM roles CDK uses to stage deployment assets) before any `cdk deploy` can
run. All three environments target the **same** AWS account, so one
bootstrap covers all of them.

**Already done** - `npx cdk bootstrap aws://403677988069/eu-west-1` was
run by the user and the original six `dev` stacks deployed successfully
on top of it. `staging`/`production` reuse the same bootstrap (same
account) - no further bootstrap step is needed before deploying to them.

## Deploying the seven new Cloud Runtime stacks to `dev` - full walkthrough

Docker must be running on whatever machine runs this - `cdk synth`
doesn't need it, but `cdk deploy` builds and pushes the `apps/api`/
`apps/worker` container images as part of asset publishing
(`INFRA_RUNTIME.md` §8, §9). AWS CLI must be configured for account
`403677988069`, region `eu-west-1`.

**1. Network and Database**

```
cd infra
npx cdk deploy Ecclesia-Dev-Network
npx cdk deploy Ecclesia-Dev-Database
```

**2. Compute platform** (independent of each other, deploy together)

```
npx cdk deploy Ecclesia-Dev-EcsCluster Ecclesia-Dev-Alb
```

**3. API service** - this is the slow step first time (Docker build +
push of `apps/api`'s image). The service will come up healthy even
before the database has a schema - the ALB health check is just
`SELECT 1`, not a real query against app tables.

```
npx cdk deploy Ecclesia-Dev-ApiService
```

**4. Run the database migration** - RDS is in isolated subnets with no
route to a laptop, so this runs as a one-off ECS task inside the VPC,
reusing the `ApiService` task definition/image (which ships the Prisma
CLI and `db/migrations/` specifically for this - see
`apps/api/Dockerfile`'s own doc comment). First, grab the exact network
config the running service already uses:

```
NETCFG=$(aws ecs describe-services --cluster ecclesia-dev-cluster \
  --services ecclesia-dev-api --query 'services[0].networkConfiguration' --output json)
echo "$NETCFG"   # note the subnets and securityGroups printed here
```

Then run the migration:

```
aws ecs run-task --cluster ecclesia-dev-cluster \
  --task-definition ecclesia-dev-api \
  --launch-type FARGATE \
  --network-configuration "$NETCFG" \
  --overrides '{"containerOverrides":[{"name":"ecclesia-dev-api","command":["npx","prisma","migrate","deploy","--schema=./db/schema.prisma"]}]}'
```

Watch it finish in CloudWatch Logs (`/ecs/ecclesia-dev-api`, look for the
newest log stream) - `aws logs tail /ecs/ecclesia-dev-api --since 5m
--follow` and confirm it prints applied migrations with no errors, then
exits.

**5. Reconcile the `ecclesia_app` role's password** - the migration
creates that role with a hardcoded placeholder password (baked into the
protected migration file); this stack generated a real secret for it that
now needs to become the role's actual password:

```
APP_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id ecclesia-dev-app-role-credentials --query SecretString --output text \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['password'])")

ALTER_CMD="echo \"ALTER ROLE ecclesia_app WITH PASSWORD '$APP_SECRET';\" | npx prisma db execute --schema=./db/schema.prisma --stdin"

aws ecs run-task --cluster ecclesia-dev-cluster \
  --task-definition ecclesia-dev-api \
  --launch-type FARGATE \
  --network-configuration "$NETCFG" \
  --overrides "{\"containerOverrides\":[{\"name\":\"ecclesia-dev-api\",\"command\":[\"sh\",\"-c\",\"$ALTER_CMD\"]}]}"
```

(That command runs as `ecclesia`, the master/owner role set via
`DB_MASTER_USER` - it has the privilege to alter another role.) Confirm
via the same CloudWatch log stream approach as step 4.

**6. Worker service and observability**

```
npx cdk deploy Ecclesia-Dev-WorkerService
npx cdk deploy Ecclesia-Dev-RuntimeObservability
```

**7. Verify**

```
aws cloudformation describe-stacks --stack-name Ecclesia-Dev-ApiService \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrlOutput'].OutputValue" --output text
curl http://<that-url>/health
```

A `curl` against a real endpoint (not `/health`, e.g. an authenticated
`/people` call) is the real test that the schema/migration actually
landed - `/health` alone will pass either way.

Or let CDK handle steps 1-3/6 as one sequence instead of stack-by-stack:
`npx cdk deploy 'Ecclesia-Dev-*'` (steps 4-5, the one-off migration
task and password reconciliation, are always manual regardless).

## Deploying to `staging`/`production` (later, once `dev` is proven out)

```
npx cdk diff 'Ecclesia-Staging-*'         # review before deploying
npx cdk deploy 'Ecclesia-Staging-*'
```

Same dependency ordering applies. `production`'s config differs mainly in
sizing and durability: `natGateways: 3`, `multiAz: true`,
`deletionProtection: true`, 30-day backup retention
(`environments/production/config.ts`) - not a different deployment
procedure.

## CI/CD (Blueprint §11.5) - not wired in this milestone

`.github/workflows/ci.yml` is untouched. Wiring `cdk deploy` into it
(dev on every push, staging on merge to `main`, a manual promotion gate
before pilot/production) is future work, explicitly deferred until a real
decision is made to start deploying - this milestone is infrastructure
*definitions* only.

## Manual steps still required

Account, region, and bootstrap are done. What's left:

1. **Deploy the seven Cloud Runtime stacks to `dev`** (above), including
   the `ecclesia_app` password reconciliation step.
2. **Confirm a real SES sending domain/address** per environment and set
   `ses.emailIdentity` in that environment's `config.ts`
   (`ENVIRONMENTS.md`'s "two fields every environment currently leaves
   unset").
3. **Confirm a real on-call alert email** and subscribe it to the SNS
   alert topic - `aws sns subscribe --topic-arn <alert-topic-arn>
   --protocol email --notification-endpoint <address>`. Still unset; all
   CloudWatch alarms (original + `RuntimeObservabilityStack`'s new ones)
   currently fire into a topic with no subscriber.
4. **Populate the two placeholder Secrets Manager secrets**
   (`mobile-money-provider`, `sms-gateway`) with real values once those
   providers are actually contracted - manually, via the console or `aws
   secretsmanager put-secret-value`, never by committing a value into
   this CDK code (`lib/stacks/secrets-stack.ts`'s own doc comment).
5. **A real domain + ACM certificate** for HTTPS - the ALB serves HTTP
   only until `AlbEnvironmentConfig.certificateArn` is set per
   environment.
6. **Docker installed** on the machine that runs `cdk deploy` for
   `ApiService`/`WorkerService` (not needed for `cdk synth`).
