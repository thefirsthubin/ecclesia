# apps/api

The Ecclesia API service: a modular monolith (Blueprint ADR-001) exposing
one NestJS module per bounded context (Blueprint Ch.1 §4.2 / Ch.2 §6.4):
`people`, `pastoral-care`, `ministry`, `gatherings`, `stewardship`,
`insights`, `platform`.

**Status (Stewardship domain milestone):** `platform` provides a real
database connection and Cognito JWT authentication (Sprint 1.4, verified
for real: `pnpm install`/`lint`/`test`/`build` all pass; only integration
against a real, provisioned Cognito User Pool remains unverified).
`modules/people/`, `modules/pastoral-care/`, `modules/gatherings/`, and
`modules/stewardship/` are the first four bounded-context modules built on
top of it. People and Pastoral Care import each other (`forwardRef`) for a
genuine bidirectional public-service dependency; Gatherings and
Stewardship both import People normally, consuming its exported services
without either needing anything back - see
`modules/people/PEOPLE_DESIGN_NOTES.md`,
`modules/pastoral-care/PASTORAL_CARE_DESIGN_NOTES.md`,
`modules/gatherings/GATHERINGS_DESIGN_NOTES.md`, and
`modules/stewardship/STEWARDSHIP_DESIGN_NOTES.md`. `src/platform/` holds:

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

**`modules/people/`** (PRD §13.1) is the first bounded-context module: Person create/read/update, lifecycle-stage transitions (FR-PPL-03), Group (Bacenta/Basonta) CRUD (FR-PC-01/FR-MIN-01, backfilled during the Pastoral Care milestone), Bacenta/Basonta assignment (FR-PPL-04/05), and Role Assignment grants including Bacenta Leader succession (PRD §17.2, §19.4 step 6) and the Poimen gate (PRD §24 OQ-02) - the first real usage of `RbacGuard`/`RecordLevelPolicyGuard` (built Sprint 1.1) and the first module reading/writing through `PrismaService`. Building it surfaced that Sprint 1.4's CLUSTER-scope gap needed fixing before Pastoral Care's Assistant Pastor cluster view could work, so that fix (`libs/rbac`'s `ActorContext.clusterBacentaIds`) landed as a direct follow-up. Exports `PersonScopeService`, `PersonService`, `GroupScopeService`, and `GroupLeadershipService` - this module's public service interfaces (Blueprint §7.2) now consumed by both Pastoral Care and Gatherings. See `modules/people/PEOPLE_DESIGN_NOTES.md` for the full citation breakdown, what's deliberately deferred (search/directory, the persistent duplicate-resolution queue, custom profile fields), and open items (Row-Level Security still not wired; the multi-Role-Assignment gap from Sprint 1.4 remains open, deliberately, pending a real product decision).

**`modules/pastoral-care/`** (PRD §13.2) is the second bounded-context module: Poimen enrollment tracking (FR-PC-06), Follow-up task creation/completion/escalation (FR-PC-03/04, BR-PC-04), and Pastoral notes (§16.2, NFR-PRIV-01's explicit ADMIN deny) - all consuming `PersonScopeService` from People via a `forwardRef` import, and itself exporting `PoimenEnrollmentService` and `FollowUpTaskService` so People's `RoleAssignmentService` can consume the Poimen gate check (without querying `pastoral_care.poimen_enrollments` directly - a module-boundary violation this milestone found and fixed) and Gatherings' `VisitorIntakeService` can auto-create Follow-up tasks (FR-GTH-04/US-A1). The silent-drift decision tree (PRD §15.8) is built as a pure function in `libs/domain/pastoral-care` but not wired to a real trigger yet - the Gatherings milestone now makes `gatherings.attendance_records` real, but consuming it into a live silent-drift sweep is still Pastoral Care's own follow-up work. See `modules/pastoral-care/PASTORAL_CARE_DESIGN_NOTES.md` for the full citation breakdown and what's deliberately deferred (automatic Follow-up task assignment/escalation-target resolution - both need a product decision, not an engineering guess).

**`modules/gatherings/`** (PRD §13.4) is the third bounded-context module: Gathering/GatheringSeries create/read/update (FR-GTH-01/02, §12.4), attendance recording plus a per-Gathering completeness check (FR-GTH-03/05), and the visitor-intake flow (FR-GTH-04/BR-GTH-03) - creating a Person via People's exported `PersonService` and, per US-A2, conditionally auto-creating a Follow-up task via Pastoral Care's exported `FollowUpTaskService` when a Bacenta preference resolves to an active Shepherd (People's newly-exported `GroupLeadershipService`). Imports both `PeopleModule` and `PastoralCareModule` as ordinary imports (no `forwardRef` - neither needs anything back from Gatherings). See `modules/gatherings/GATHERINGS_DESIGN_NOTES.md` for the full citation breakdown, including two genuine gaps found and flagged rather than invented (the "Usher" role named throughout the PRD narrative but absent from `libs/rbac`'s Role catalog; the recurrence-rule format §12.4 never specifies) and what's deliberately deferred (the Branch-wide attendance-completeness sweep/reminder; US-A2's default-Shepherd "rotation" fallback when no Bacenta preference is given).

**`modules/stewardship/`** (PRD §13.5) is the fourth bounded-context module: the Financial Transaction inbound sub-flow (record/read/verify/flag/escalate/reconcile, FR-STW-01 through 05/07), the Expense outbound sub-flow (request/read/approve/reject/pay/receipt, FR-STW-09), and Project/Pledge create/read/fulfill (FR-STW-08/H2) - consuming People's already-exported `GroupScopeService` (Bacenta-recorded offerings) and `PersonScopeService` (Expense requester scope) unchanged, no new People exports required. Reuses `libs/rbac`'s `DIFFERENT_ACTOR_THAN_RECORDER` record-level check for both BR-STW-04 (Financial Transaction verify) and FR-STW-09 (Expense approve) rather than inventing a parallel check, and is this codebase's first real *declarative* `@UseGuards(..., RbacGuard, RecordLevelPolicyGuard)` usage (every prior `recordLevelCheck` consumer went through an imperative `evaluate()` escape hatch instead, for reasons specific to that endpoint). Imports `PeopleModule` as an ordinary import (no `forwardRef`). See `modules/stewardship/STEWARDSHIP_DESIGN_NOTES.md` for the full citation breakdown, including why `amountMinor` travels as a decimal string (Prisma `BigInt` cannot round-trip through JSON), and what's deliberately deferred (FR-STW-07's bank-deposit comparison - no such entity exists in `db/schema.prisma`; the SLA-triggered `UnderInvestigation` transition, Mobile Money provider integration, and Pledge reminders - all need a scheduler that doesn't exist yet).

Two bounded-context modules remain unbuilt: ministry, insights.
