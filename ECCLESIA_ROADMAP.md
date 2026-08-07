# Ecclesia — Church Operating System: Full Roadmap

Source of truth: `docs/Ecclesia_PRD.md` (v1.0), `docs/Ecclesia_Technical_Blueprint.md` (PTB v2.0), the PRD Open Questions Resolution Workshop, and `docs/Ecclesia_Design_System_UX_Foundation_v1.0.md`. This document is a synthesized status report against those sources plus the repository's own `README.md`, `infra/README.md`, `infra/DEPLOYMENT.md`, and every domain's `*_DESIGN_NOTES.md` — it is not itself a source of truth, and if it ever disagrees with those documents, they win.

Status as of this writing: **every domain named in the locked Release 1 roadmap is built end-to-end** — backend modules, RBAC, worker sweeps, the shared UI component library, all six Web Admin domain pages (including a premium-redesigned Dashboard), and five real Mobile persona experiences (Shepherd, Ministry Leader, Finance Officer, Resident Pastor, Usher). The Engagement Signal ingestion pipeline — previously the single biggest structural gap — is now built. Production AWS infrastructure exists as code for all 13 stacks; 6 are live in `dev`, 7 are written and verified but not yet deployed. What remains is a defined, shrinking list of disclosed gaps (mostly product decisions, not engineering guesswork) plus deployment/operations work and Horizon 2/3 scope that was never meant to ship yet.

---

## 1. Product foundation (the PRD)

**Vision.** Ecclesia aims to be "the world's most comprehensive Church Operating System" — replacing incumbent ChMS tools that "answer 'what happened?' competently" but "almost never answer 'what should a leader do next?'" The product's differentiator is Church Pulse: a leading-indicator engagement score meant to surface a drifting member *before* the lagging signal (attendance dropping to zero) confirms it.

**Reference deployment.** River of Life Cathedral (Ghana), a Council/Branch-structured church using the cell-model Bacenta (small group) / Basonta (ministry team) organizational pattern. The PRD is written against this specific church, not a generic template — genericization is deliberately deferred until a second real deployment exists (§9.5).

**Six bounded-context domains (PRD §16, Blueprint §5)** — the spine everything else hangs off:

| Domain | Core purpose |
|---|---|
| People | Identity, member lifecycle (Visitor → First-Time Guest → Follow-up → Assigned to Bacenta → Six Weeks Participation → Member → Worker → Shepherd → Pastor), one-Bacenta enforcement |
| Pastoral Care | Bacenta structure, Shepherd assignment, follow-up workflow, silent-drift detection |
| Ministry | Basonta structure (many-per-member), worker assignment, staffing visibility |
| Gatherings | Unified Gathering model (services, Bacenta/Basonta meetings), attendance, visitor intake |
| Stewardship | Offering/Tithe/Special Offering recording, verification, reconciliation, expense approval |
| Insights | Church Pulse scoring, silent-drift alerting, role-scoped dashboards |

**Release horizons (PRD §9, §22):**

| Horizon | Scope | Status |
|---|---|---|
| **Release 1 (Horizon 1)** | All six domains above, at the scope in §9.2's table (Release 1 in-scope list) | **Built** — every domain, all four sequenced phases (Foundation → Pastoral Care → Stewardship → Insights), plus the Engagement Signal pipeline that makes Insights reflect real usage |
| **Release 2.0 (Horizon 2)** | Mobile Money simplification, Poimen tracking curriculum, Ministry staffing adequacy UI, Project/pledge tracking UI, member-level Church Pulse (pending privacy gate) | Not started — gated on Release 1 being stable in production for a defined minimum period |
| **Release 3.0 (Horizon 3)** | Multi-branch/Council consolidation, Online Gatherings, Bacenta/Basonta split-merge workflows | Not started — gated on a second real Branch being ready to onboard |
| **Beyond-horizon directions (§23)** | Messaging-platform integration (WhatsApp), multi-denominational templates, predictive engagement modeling, financial forecasting, give-in-kind tracking, household/family modeling, Council/marketplace scale | Named for direction only, explicitly not specified in detail yet |

**Ten Open Questions (PRD §24)** were taken through a resolution workshop with product leadership. Eight are fully decided and already applied in the document. Two remain **partially decided** — the *method* is settled but the specific numbers need one live pastoral-calibration conversation with Bishop Francis and the Assistant Pastors:

- **OQ-04** — silent-drift thresholds ship with a placeholder (N=3 Sunday attendances / M=3 Bacenta absences).
- **OQ-10** — Church Pulse signal weighting ships with an equal-sixths placeholder across all six signal categories.

Both are structurally configurable (not hardcoded), so resolving them is a product/pastoral conversation, not an engineering task.

---

## 2. Architecture foundation (the Technical Blueprint)

**System shape.** Nx monorepo, four applications on top of ten shared libraries:

- `apps/api` — NestJS backend, all six domain modules, Cognito-verified auth, RBAC guards, EventBridge publishing.
- `apps/worker` — background consumers (SQS) and scheduled sweeps, no HTTP surface.
- `apps/web-admin` — React DOM, the leadership/staff-facing admin surface.
- `apps/mobile` — React Native, the Shepherd/volunteer-facing surface, offline-first by design intent.
- `libs/rbac`, `libs/domain/*`, `libs/contracts`, `libs/ui/{tokens,core,web,native}` — shared, framework-appropriate logic and types consumed by more than one app.
- `infra` — AWS CDK v2 (TypeScript), 13 stacks per environment × 3 environments (dev/staging/production).

**Data layer.** PostgreSQL via Prisma, seven bounded-context schemas, Row-Level Security policies (a real, non-owner `ecclesia_app` DB role plus transaction-scoped `SET LOCAL app.current_branch_id`), an append-only Financial Transaction event model, and a temporal GroupMembership model.

**Auth.** AWS Cognito access tokens (`aws-jwt-verify`), resolved server-side into an `ActorContext` (role + Branch + scope group IDs) — Cognito's tokens carry no role claim; every request recomputes authorization from the database, not from a cached token claim. A real Cognito User Pool now exists in AWS (`dev`, via the `CognitoStack`), but end-to-end verification against it (a real user actually logging in through it) is still outstanding.

**RBAC.** A declarative permission matrix compiled into `libs/rbac` as executable data plus a NestJS guard, evaluated per-request against `{ role, action, scope }`. Scopes are `SELF | OWN_GROUP | CLUSTER | BRANCH | GLOBAL` — no `GLOBAL`-scoped rule exists in the matrix yet. The role catalog now includes `USHER` (added this year — previously named in the PRD narrative but absent from the code).

**Event architecture.** EventBridge → SQS, `apps/worker` as the consumer/sweep runtime. **Now real end-to-end in code**: `apps/api` publishes to EventBridge from all 6 domain write paths the Engagement Signal pipeline needs (§4.2 below), and `apps/worker`'s `insights-consumer` reads from the resulting SQS queue. Live AWS infrastructure for this (the `EventingStack`) is deployed in `dev`; the compute layer that would actually run `apps/worker` as an ECS service (`WorkerServiceStack`) is written but not yet deployed.

**Coding standards.** Nx module-boundary enforcement structurally prevents backend code from importing UI code and vice versa; every domain module's design decisions are logged in a per-module `*_DESIGN_NOTES.md` with citations back to the PRD/Blueprint section that justifies them, and every inferred (non-cited) decision is explicitly tagged `[INFERRED]` or `[Design Decision]` rather than presented as a requirement.

---

## 3. Design foundation (the Design System & UX Foundation v1.0)

Document-only artifact (no code) that the two frontend apps are built against: eight personas mapped to PRD §11, separate Web Admin (persistent sidebar, six-to-eight domains, max nav depth 3) and Mobile (persona-specific bottom tab bar, max nav depth 2) information architectures, the five-zone dashboard model ("what needs my attention today?" — priority, primary metric, quick actions, recent activity, notifications) applied to every persona dashboard, design tokens, a 24-component library spec, cross-cutting UX rules, the mobile offline-first experience, data-visualization standards, and an AI Experience section explicit about the gap between the PRD's real (deterministic, rule-based) Insights engine and any future generative-AI ambitions.

This is the blueprint the UI component library (`libs/ui/*`) and every Web Admin / Mobile screen trace back to. The Web Admin sidebar taxonomy is byte-for-byte what's implemented; the Dashboard's own "five zones, same order, both platforms" rule and "no card without an implied next action" rule are both still honored even after this year's Dashboard redesign (see §4.5).

---

## 4. Engineering execution — what's built

### 4.1 Platform & infrastructure (application layer)

| Milestone | Status |
|---|---|
| Nx workspace scaffold, CI gate (`install`/`lint`/`test`/`build` on every push/PR) | Complete |
| RBAC executable specification (permission matrix, Poimen record-level gate, guards) | Complete |
| NestJS platform foundation (config, logging, `/health`, validation, Swagger, URI versioning) | Complete |
| Database foundation (Prisma schema, RLS policies, migrations) | Complete against a real local Postgres; **not yet verified against a deployed RDS instance** (the `DatabaseStack` isn't deployed yet — see §4.7) |
| Cognito authentication (`AuthGuard`, `ActorContext` resolution, audit logging) | Complete in code; a real Cognito User Pool now exists in `dev` AWS, but no real end-to-end login through it has been verified yet |
| Development Authentication — local Cognito bypass, seeded personas (now including a `USHER` test actor), role-picker login | Complete |
| CORS configuration | Complete |
| **Engagement Signal ingestion pipeline (EventBridge/SQS)** | **Complete** — `apps/api`'s `EventBridgePublisherService` publishes from all 6 domain write paths Insights needs; this was the single largest structural gap in the previous version of this roadmap, now closed |

### 4.2 Backend domain modules (`apps/api`) — all six built

| Domain | Status | Headline disclosed gaps remaining |
|---|---|---|
| People | Built, plus a later **People Intake** pass (New Person creation with real duplicate-candidate handling) | No persistent duplicate-resolution *queue* (candidates are reviewed synchronously in the create flow, not a separate pending-review list); multi-Role-Assignment Persons still can't authenticate (`ConflictException`, an open product question — see §5) |
| Pastoral Care | Built, plus **Escalate** wired in Web Admin | Automatic task-creation trigger (general FR-PC-03 lifecycle case) and automatic escalation-target resolution (BR-PC-04, needs an org-hierarchy model) are still **not** wired — every create/escalate call needs an explicit target. (One narrower exception: Gatherings' Visitor Intake *does* auto-create a Follow-up task for First-Time Guests.) |
| Gatherings | Built | The **Usher role gap is now closed** (see §4.2's role catalog note above) — Attendance Capture and Visitor Intake now exist as first-class mobile screens for Ushers; recurrence-rule format remains an opaque string |
| Stewardship | Built, including Record Transaction/Request Expense forms in Web Admin | Receipt upload/attach has **no file-storage capability anywhere in this codebase** — `attachReceipt()` exists but only records an already-uploaded file's storage key; Mobile Money provider confirmation (Horizon 2) remains undecided |
| Insights | Built, **and now actually fed by real events** | Person-level Church Pulse remains structurally blocked (a hard privacy gate, no code path can compute it); true multi-Bacenta ranked cluster view still doesn't exist (single-Bacenta drill-down only) |
| Ministry | Built | Staffing Targets has a real backend module (`staffing-target.controller/service/repository`) but **no Web Admin surface at all** — no "list targets for this Basonta" read path exists yet; overcommitment flag counts concurrent Basonta memberships, not concurrent Gathering commitments (a disclosed proxy) |

### 4.3 Background processing (`apps/worker`)

Full Blueprint inventory built: `insights-consumer`, `silent-drift-sweep`, `notification-consumer` (a stub — no delivery channel decided anywhere in the PRD), `audit-consumer`, `church-pulse-recompute`, `follow-up-sla-sweep`, `attendance-completeness-sweep`, `flagged-transaction-sla-sweep`, `pledge-reminder-sweep`.

**Structural gap, still open:** no "system actor" concept exists anywhere in this codebase. Every sweep bypasses the RBAC/audit-log guards by construction (a worker has no HTTP request to resolve an actor from), and most sweeps only *detect and signal* a condition rather than mutate data, specifically to avoid inventing a fake actor for a `NOT NULL` actor foreign key. `pledge-reminder-sweep` remains the one exception (`Pledge.reminderSentAt` has no actor FK).

### 4.4 UI component library (`libs/ui/{tokens,core,web,native}`)

**Complete — the full base set plus Navigation/Data/Layout tier** (Table, Search, Pagination, Filters, CommandPalette [web-only], Charts [BarChart/LineChart], BottomNav [native-only], RecordPicker), on both `@ecclesia/ui-web` and `@ecclesia/ui-native`, sharing one theme object and one icon registry (curated `lucide` subset — now including `church`/`heart`/`userCheck`, added for the Dashboard redesign). Jest still cannot execute in this working environment (a persistent `@swc/core` binding failure specific to this sandbox); `tsc --noEmit` and `eslint` run for real here and both pass clean, and the user's own machine runs the full `pnpm test` suite.

### 4.5 Web Admin (`apps/web-admin`)

All six PRD domain pages are built on a real Application Shell (persistent sidebar/top-bar, Cognito client, hand-built router — no routing library exists in this workspace):

| Page | Built | Notably deferred within it |
|---|---|---|
| Dashboard | **Redesigned this year** — premium layout for the Resident Pastor's Branch dashboard: Church Pulse hero metric (real data), a Members/Attendance/Giving/Volunteers KPI strip, a Performance Chart card, Needs Attention + a Bacenta Leaderboard, Quick Actions, Upcoming Events, Recent Activity, and a Prayer Focus card. Runs its own top pill nav instead of the sidebar (a deliberate, page-scoped exception — see `DASHBOARD_REDESIGN_NOTES.md`). | Only the Resident Pastor role has a real dashboard — Ministry Leader/Finance Officer/Branch Pastor/Council Administrator all still see a "coming soon" stub, despite all having full specs in the Design System |
| People | Directory + Person profile + **New Person intake with real duplicate-candidate review** | No persistent duplicate-resolution *queue* screen; no Bacenta/Basonta reassignment flow |
| Pastoral Care | Follow-up task queue: Complete **and** Escalate | No manual task-*creation* form in Web Admin (the endpoint exists, nothing calls it from the UI); silent-drift flags; Pastoral notes (belongs on the Person profile); Poimen tracker (Horizon 2) |
| Ministry | Basonta directory + roster view | **No Staffing Targets UI at all** — the backend module exists with no Web Admin surface; worker availability self-service |
| Gatherings | Gathering calendar with per-row attendance-completeness badge | Attendance Capture and Visitor Intake are mobile-only (correctly so — both are Usher-primary flows, and the Usher persona is a mobile app) |
| Stewardship | **Now includes create flows** — Record Financial Transaction and Request Expense, alongside the existing Verify/Flag/Escalate/Reconcile and Approve/Reject/Pay queues | Attach Receipt — blocked on file-upload infrastructure that doesn't exist anywhere in this codebase; Project/Pledge surfaces |
| Insights | Role-routed views for every persona with a defined surface | Weight-configuration UI (Horizon 2); true multi-Bacenta ranked cluster view; Person-level Church Pulse (hard-gated) |
| Configuration | Built (Admin/Council Administrator only) | — |

### 4.6 Mobile (`apps/mobile`)

**Every persona named in the Design System's tab-bar spec now has a real, built tab bar** — this is the single biggest change since the last version of this roadmap, which showed only the Shepherd persona partially built:

| Persona | Role key | Spec'd tabs | Built |
|---|---|---|---|
| Shepherd (Bacenta Leader) | `BACENTA_LEADER` | Dashboard · Attendance · Follow-ups · Offering · Profile | **All 5, complete** |
| Ministry Leader | `BASONTA_LEADER` | Dashboard · Roster · Events · Profile | **All 4, complete** |
| Finance Officer | `TREASURER` | Dashboard · Verify · Reconcile · Profile | **All 4, complete** |
| Resident Pastor | `RESIDENT_PASTOR` / `ACTING_RESIDENT_PASTOR` | Dashboard · Alerts · Cluster/Branch · Profile | **All 4, complete** |
| Usher | `USHER` (added this year) | Dashboard · Attendance · Visitor Intake · Profile | **All 4, complete** |

Every other role (`ASSISTANT_PASTOR`, `ADMIN`, `WORKER`, `MEMBER`, `COUNCIL_OVERSEER`, `VISITOR`) still falls to a generic "not available yet" stub — none of these personas' primary surface is Mobile per the Design System, so this is expected, not a gap.

### 4.7 Infrastructure & deployment (`infra`, AWS CDK v2)

**13 stacks defined per environment, 3 environments (dev/staging/production), 39 stacks total in code:**

| Stack group | Stacks | Status |
|---|---|---|
| Production Infrastructure Foundation | Cognito, EventBridge/SQS (Eventing), SES, Secrets Manager, IAM, CloudWatch/Observability (6 stacks) | **Deployed to `dev`** — AWS account `403677988069`, region `eu-west-1` |
| Cloud Runtime Infrastructure | Network (VPC), Database (RDS PostgreSQL 16), EcsCluster, Alb, ApiService, WorkerService, RuntimeObservability (7 stacks) | **Written, `cdk synth`-verified, not yet deployed** anywhere — a real, exact deploy walkthrough exists (`infra/DEPLOYMENT.md`) with the one-off ECS migration-task and `ecclesia_app` password-reconciliation steps spelled out |
| `staging` / `production` | All 13 stacks per environment | **Not started** — same account, different config (sizing/durability), no bootstrap or first deploy done |

**Manual steps still open** (all disclosed in `infra/DEPLOYMENT.md`): deploy the 7 Cloud Runtime stacks to `dev`; a real SES sending domain per environment; a real on-call alert email subscribed to the SNS topic (alarms currently fire into an empty topic); a real domain + ACM certificate for HTTPS (ALB is HTTP-only today); Docker installed on whatever machine runs the deploy (confirmed *not* needed for `cdk synth`, confirmed needed for `cdk deploy`'s image-publishing step). CI/CD (`cdk deploy` wired into `.github/workflows/ci.yml`) is explicitly not built — every deploy so far has been a manual, deliberate command.

---

## 5. Concrete open work items (in rough order of how "shovel-ready" each is)

Every item below traces to a disclosed note in a `*_DESIGN_NOTES.md` file, an infra doc, or this roadmap's own verification pass — not a guess.

**Deployment-ready, no new code needed:**
- Deploy the 7 Cloud Runtime Infrastructure stacks to `dev`, run the one-off migration task, reconcile the `ecclesia_app` password — the exact commands are in `infra/DEPLOYMENT.md`.
- Subscribe a real email to the SNS alert topic; confirm a real SES sending identity.
- Provision an ACM certificate once a real domain exists, to turn the ALB's HTTPS support on.

**Frontend-only, backend already ready:**
- **Ministry Leader / Finance Officer / Branch Pastor / Council Administrator Web Admin dashboards** — the Design System has full Part 4.3 specs for all four; the Resident Pastor redesign this year established the reusable pattern (KPI cards, quick actions, timelines) to build them from.
- **Staffing Targets Web Admin UI** — the backend module (`staffing-target.controller/service/repository`) already exists; needs a "list targets for this Basonta" read path plus a small form.
- **Manual Follow-up task creation form** in Web Admin — `POST` already exists (`pastoral_care.followup_task.create`), nothing in the UI calls it yet.

**Needs new backend/infrastructure work:**
- **Receipt/file upload** (Stewardship's "Attach Receipt") — no S3 bucket, no multipart handling, no upload UI exists anywhere in this codebase. `attachReceipt()` only records a storage key that something else would have to produce first.
- **Multi-Role-Assignment Person authentication** — a Person with 2+ concurrent active Role Assignments still gets a hard `ConflictException` on login. Needs a product decision (pick one? merge permissions? disallow at the data layer instead?), not an engineering guess.
- **Automatic Follow-up task assignment / escalation-target resolution** (the general FR-PC-03/BR-PC-04 cases, beyond Gatherings' narrower Visitor Intake exception) — needs an organizational-hierarchy data model that doesn't exist in the schema today.
- **A "system actor" concept** for `apps/worker` — would let sweeps safely mutate data under RBAC/audit guards, the same way an HTTP-originated request does today.
- **Real, end-to-end verification** of Cognito login and RLS enforcement against deployed infrastructure — both are code-complete and disclosed as "verified in a local/sandbox environment only," blocked on the Cloud Runtime stacks actually being deployed.

**Deployment/operations work (no domain code, but real effort):**
- `staging`/`production` environments — CDK config exists per-environment, nothing bootstrapped or deployed yet.
- CI/CD — wiring `cdk deploy` into the existing GitHub Actions workflow (dev on push, staging on merge to `main`, a manual gate before production) is explicitly deferred, not started.
- A demo/seed dataset for `dev` once the Cloud Runtime stack is live, so a real deployed instance (not just local dev) has something to show.

**Horizon 2/3 scope (deliberately not started — see §1):** Poimen training curriculum, Project/pledge tracking UI, Mobile Money simplified flows, member-level Church Pulse, multi-branch Council consolidation, Online Gatherings, Bacenta/Basonta split-merge workflows.

---

## 6. Suggested "what's next" candidates

Reasonable next candidates, roughly in order of leverage-per-effort — no single order is mandated by the source documents beyond the horizon sequencing in §1:

1. **Deploy the Cloud Runtime Infrastructure to `dev`** — the highest-leverage single action available: turns "everything verified in a sandbox" into "a real, running, demo-able deployment," and every command needed is already written down.
2. **Build the remaining 4 Web Admin persona dashboards** (Ministry Leader, Finance Officer, Branch Pastor, Council Administrator) — the Resident Pastor redesign just established a reusable, premium pattern; these are now much cheaper to build than the first one was.
3. **Staffing Targets Web Admin UI** — closes Ministry's last real gap, and the backend is already there.
4. **Receipt upload** — the last piece needed to make Stewardship's expense flow feel complete for a real user, though it's the one item on this list that needs genuinely new infrastructure (file storage).
5. **Resolve the two remaining open product questions** (Multi-Role-Assignment auth, automatic Follow-up assignment/escalation) with product/pastoral leadership — both are one conversation away from being "shovel-ready" engineering work instead of open questions.
6. **CI/CD + staging** — once `dev`'s Cloud Runtime stack is proven, wiring up automatic deploys and standing up `staging` turns this from "a project that can be deployed" into "a project with a real release process."

---

*Compiled from `docs/Ecclesia_PRD.md`, `docs/Ecclesia_Technical_Blueprint.md`, `docs/Ecclesia_Design_System_UX_Foundation_v1.0.md`, `README.md`, `infra/README.md`, `infra/DEPLOYMENT.md`, and a fresh verification pass against the current repository (not just prior session notes) — current as of this writing.*
