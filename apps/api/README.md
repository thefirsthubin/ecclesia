# apps/api

The Ecclesia API service: a modular monolith (Blueprint ADR-001) exposing
one NestJS module per bounded context (Blueprint Ch.1 §4.2 / Ch.2 §6.4):
`people`, `pastoral-care`, `ministry`, `gatherings`, `stewardship`,
`insights`, `platform`.

**Status (Pastoral Care domain milestone):** `platform` provides a real
database connection and Cognito JWT authentication (Sprint 1.4, verified
for real: `pnpm install`/`lint`/`test`/`build` all pass; only integration
against a real, provisioned Cognito User Pool remains unverified).
`modules/people/` and `modules/pastoral-care/` are the first two
bounded-context modules built on top of it, and now import each other
(`forwardRef`) for a genuine bidirectional public-service dependency - see
`modules/people/PEOPLE_DESIGN_NOTES.md` and
`modules/pastoral-care/PASTORAL_CARE_DESIGN_NOTES.md`. `src/platform/`
holds:

| File | Purpose |
|---|---|
| `config/env.schema.ts` | Zod-validated process config (`NODE_ENV`, `PORT`, `LOG_LEVEL`, `API_DOCS_ENABLED`, `DATABASE_URL`, `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `COGNITO_REGION`) - fails fast at boot on an invalid value. See `.env.example`. |
| `platform.module.ts` | Wires `ConfigModule`, `nestjs-pino`'s `LoggerModule`, `TerminusModule`, `DatabaseModule`, `AuditModule`, `AuthModule`, and the workspace-wide `AllExceptionsFilter` (as an `APP_FILTER` provider). |
| `database/prisma.service.ts` | The one `PrismaClient` instance, connected/disconnected on module init/destroy. See `db/README.md` and `db/DESIGN_NOTES.md` - the schema it's generated from has been rebuilt against the real Blueprint §7.2-7.5/PRD text and fully verified against a real PostgreSQL instance (`prisma migrate diff` empty, seed succeeds). |
| `database/database-health.indicator.ts` | Custom Terminus indicator (`SELECT 1`) so `/health` reflects real database reachability, not just process liveness. |
| `auth/` | Cognito JWT verification and `ActorContext` resolution (Sprint 1.4) - see `auth/AUTH_DESIGN_NOTES.md` for what's Blueprint-exact, what's inferred, the one remaining open question (multi-Role-Assignment Persons), and the CLUSTER-scope gap that milestone originally found, since resolved. |
| `audit/audit-log.service.ts` | Shared `platform.audit_log` writer (Sprint 1.4), used today by `AuthGuard` for verification failures (Blueprint §8.5). |
| `health/health.controller.ts` | `GET /health` - version-neutral, `@Public()` (exempt from `AuthGuard` - ECS/ALB health checks can't present a token), checks process memory (heap/RSS) and the database. |
| `filters/all-exceptions.filter.ts` | Every error response goes through here: consistent shape, 4xx logged at `warn`, 5xx at `error` with the original exception, per engineering-principles.md §5 (Security by Default - denials logged as rigorously as approvals). |
| `pipes/zod-validation.pipe.ts` | Per-route `@Body(new ZodValidationPipe(schema))` - the Zod equivalent of Nest's class-validator `ValidationPipe`, matching `libs/contracts`' Zod ADR. First real usage: `modules/people`'s controllers. |
| `rbac/branch-configuration.service.ts` | Loads `libs/rbac`'s `BranchConfiguration` (currently just `poimenGateEnabled`) from `platform.configurations`. Shared by every future domain module, not People-specific. |
| `rbac/ecclesia-context.guard-base.ts` | Abstract Guard combining `request.actorContext` (Sprint 1.4) with a per-route-loaded `ResourceContext` and `BranchConfiguration` into the full `EcclesiaRequestContext` `RbacGuard` reads. Domain modules subclass it. An inferred design decision - `libs/rbac`'s own contract only states the shape, not a mechanism - see `modules/people/PEOPLE_DESIGN_NOTES.md`. |

`main.ts` also enables URI path versioning (`/v1/...`, Blueprint §14.7) and mounts Swagger at `/docs` (gated by `API_DOCS_ENABLED`).

`AuthGuard` (Sprint 1.4) is applied globally (`APP_GUARD`) - every route requires a verified Cognito access token by default, opt out via `@Public()`. It attaches `request.actorContext` (an `ActorContext`, `@ecclesia/rbac`), retrievable in controllers via `@CurrentActor()`.

**`modules/people/`** (PRD §13.1) is the first bounded-context module: Person create/read/update, lifecycle-stage transitions (FR-PPL-03), Group (Bacenta/Basonta) CRUD (FR-PC-01/FR-MIN-01, backfilled during the Pastoral Care milestone), Bacenta/Basonta assignment (FR-PPL-04/05), and Role Assignment grants including Bacenta Leader succession (PRD §17.2, §19.4 step 6) and the Poimen gate (PRD §24 OQ-02) - the first real usage of `RbacGuard`/`RecordLevelPolicyGuard` (built Sprint 1.1) and the first module reading/writing through `PrismaService`. Building it surfaced that Sprint 1.4's CLUSTER-scope gap needed fixing before Pastoral Care's Assistant Pastor cluster view could work, so that fix (`libs/rbac`'s `ActorContext.clusterBacentaIds`) landed as a direct follow-up. Exports `PersonScopeService`, this module's public service interface (Blueprint §7.2) for any module whose resources reference a Person. See `modules/people/PEOPLE_DESIGN_NOTES.md` for the full citation breakdown, what's deliberately deferred (search/directory, the persistent duplicate-resolution queue, custom profile fields), and open items (Row-Level Security still not wired; the multi-Role-Assignment gap from Sprint 1.4 remains open, deliberately, pending a real product decision).

**`modules/pastoral-care/`** (PRD §13.2) is the second bounded-context module: Poimen enrollment tracking (FR-PC-06), Follow-up task creation/completion/escalation (FR-PC-03/04, BR-PC-04), and Pastoral notes (§16.2, NFR-PRIV-01's explicit ADMIN deny) - all consuming `PersonScopeService` from People via a `forwardRef` import, and itself exporting `PoimenEnrollmentService` so People's `RoleAssignmentService` can consume the Poimen gate check without querying `pastoral_care.poimen_enrollments` directly (a module-boundary violation this milestone found and fixed). The silent-drift decision tree (PRD §15.8) is built as a pure function in `libs/domain/pastoral-care` but not wired to a real trigger yet - it needs `gatherings.attendance_records`, and the Gatherings domain doesn't exist. See `modules/pastoral-care/PASTORAL_CARE_DESIGN_NOTES.md` for the full citation breakdown and what's deliberately deferred (automatic Follow-up task assignment/escalation-target resolution - both need a product decision, not an engineering guess).

Four bounded-context modules remain unbuilt: ministry, gatherings, stewardship, insights.
