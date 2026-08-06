# Ecclesia — Church Operating System: Full Roadmap

Source of truth: `docs/Ecclesia_PRD.md` (v1.0), `docs/Ecclesia_Technical_Blueprint.md` (PTB v2.0), the PRD Open Questions Resolution Workshop, and `docs/Ecclesia_Design_System_UX_Foundation_v1.0.md`. This document is a synthesized status report against those sources plus the repository's own `README.md` — it is not itself a source of truth, and if it ever disagrees with those documents, they win.

Status as of this writing: **every domain named in the locked Release 1 roadmap is built end-to-end** — backend modules, RBAC, worker sweeps, the shared UI component library, and all six Web Admin domain pages, plus the first real Mobile screens. What remains is a defined list of disclosed gaps (mostly requiring product decisions, not more engineering guesswork) and Horizon 2/3 scope that was never meant to ship yet.

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
| **Release 1 (Horizon 1)** | All six domains above, at the scope in §9.2's table (Release 1 in-scope list) | **Built** — every domain, all four sequenced phases (Foundation → Pastoral Care → Stewardship → Insights) |
| **Release 2.0 (Horizon 2)** | Mobile Money simplification, Poimen tracking curriculum, Ministry staffing adequacy, Project/pledge tracking, member-level Church Pulse (pending privacy gate) | Not started — gated on Release 1 being stable in production for a defined minimum period |
| **Release 3.0 (Horizon 3)** | Multi-branch/Council consolidation, Online Gatherings, Bacenta/Basonta split-merge workflows | Not started — gated on a second real Branch being ready to onboard |
| **Beyond-horizon directions (§23)** | Messaging-platform integration (WhatsApp), multi-denominational templates, predictive engagement modeling, financial forecasting, give-in-kind tracking, household/family modeling, Council/marketplace scale | Named for direction only, explicitly not specified in detail yet |

**Ten Open Questions (PRD §24)** were taken through a resolution workshop with product leadership. Eight are fully decided and already applied in the document (household/family linking schema-only; Poimen gate configurable, defaults soft; Resident Pastor succession is a manual runbook, not in-app; single-leader-per-Bacenta only; differentiated Follow-up SLA defaults; one gentle pledge reminder; no non-Ghana data residency work yet; no Visitor self-service login). Two remain **partially decided** — the *method* is settled but the specific numbers need one live pastoral-calibration conversation with Bishop Francis and the Assistant Pastors:

- **OQ-04** — silent-drift thresholds ship with a placeholder (N=3 Sunday attendances / M=3 Bacenta absences).
- **OQ-10** — Church Pulse signal weighting ships with an equal-sixths placeholder across all six signal categories.

Both are structurally configurable (not hardcoded), so resolving them is a product/pastoral conversation, not an engineering task.

---

## 2. Architecture foundation (the Technical Blueprint)

**System shape.** Nx monorepo, four applications on top of ten shared libraries:

- `apps/api` — NestJS backend, all six domain modules, Cognito-verified auth, RBAC guards.
- `apps/worker` — background consumers (SQS) and scheduled sweeps, no HTTP surface.
- `apps/web-admin` — React DOM, the leadership/staff-facing admin surface.
- `apps/mobile` — React Native, the Shepherd/volunteer-facing surface, offline-first by design intent.
- `libs/rbac`, `libs/domain/*`, `libs/contracts`, `libs/ui/{tokens,core,web,native}` — shared, framework-appropriate logic and types consumed by more than one app.

**Data layer.** PostgreSQL via Prisma, seven bounded-context schemas, Row-Level Security policies (Blueprint §7.3), an append-only Financial Transaction event model, and a temporal GroupMembership model (so "who was in this Bacenta on this date" is a real, queryable fact, not just current-state).

**Auth.** AWS Cognito access tokens (`aws-jwt-verify`), resolved server-side into an `ActorContext` (role + Branch + scope group IDs) — Cognito's tokens carry no role claim; every request recomputes authorization from the database, not from a cached token claim.

**RBAC.** A declarative permission matrix (PRD §17.3) compiled into `libs/rbac` as executable data plus a NestJS guard, evaluated per-request against `{ role, action, scope }`. Scopes are `SELF | OWN_GROUP | CLUSTER | BRANCH | GLOBAL` — no `GLOBAL`-scoped rule exists in the matrix yet.

**Event architecture (Blueprint §10).** EventBridge → SQS, with `apps/worker` as the consumer/sweep runtime. Real AWS SDK integration code exists; no live AWS infrastructure has ever been provisioned to verify it against (a disclosed gap, not a simulated substitute).

**Coding standards.** Nx module-boundary enforcement (`@nx/enforce-module-boundaries`) structurally prevents backend code from importing UI code and vice versa; every domain module's design decisions are logged in a per-module `*_DESIGN_NOTES.md` with citations back to the PRD/Blueprint section that justifies them, and every inferred (non-cited) decision is explicitly tagged `[INFERRED]` or `[Design Decision]` rather than presented as a requirement.

---

## 3. Design foundation (the Design System & UX Foundation v1.0)

Document-only artifact (no code) that the two frontend apps are built against: eight personas mapped to PRD §11, separate Web Admin (persistent sidebar, six-to-eight domains, max nav depth 3) and Mobile (persona-specific 5-item bottom tab bar, max nav depth 2) information architectures, the five-zone dashboard model ("what needs my attention today?" — priority, primary metric, quick actions, recent activity, notifications) applied to every persona dashboard, design tokens, a 24-component library spec, cross-cutting UX rules, the mobile offline-first experience, data-visualization standards, and an AI Experience section that is explicit about the gap between the PRD's real (deterministic, rule-based) Insights engine and any future generative-AI ambitions.

This is the blueprint the UI component library (`libs/ui/*`) and every Web Admin / Mobile screen below trace back to.

---

## 4. Engineering execution — what's built

### 4.1 Platform & infrastructure

| Milestone | Status |
|---|---|
| Sprint 0 — Nx workspace, 14 projects, CI-clean from fresh install | Complete |
| Sprint 1.0 — GitHub Actions CI gate (`install`/`lint`/`test`/`build` on every push/PR) | Complete |
| Sprint 1.1 — RBAC executable specification (permission matrix, Poimen record-level gate, guards) | Complete |
| Sprint 1.2 — NestJS platform foundation (config, logging, `/health`, validation, Swagger, URI versioning) | Complete |
| Sprint 1.3 — Database foundation (Prisma schema, RLS policies, migrations, verified against real Postgres) | Complete |
| Sprint 1.4 — Cognito authentication (`AuthGuard`, `ActorContext` resolution, audit logging) | Complete — needs a real, provisioned Cognito User Pool for true end-to-end verification (still outstanding) |
| Row-Level Security — **activated** (non-owner `ecclesia_app` DB role, transaction-scoped `SET LOCAL app.current_branch_id`) | Complete in-sandbox; **not yet run against a real database** — an 8-step manual verification procedure is documented and still needs to be run on real infrastructure |
| Development Authentication — local Cognito bypass, six seeded personas, role-picker login | Complete |
| CORS configuration | Complete (found and fixed live, once both apps were actually run together for the first time) |

### 4.2 Backend domain modules (`apps/api`) — all six built

| Domain | Status | Headline disclosed gaps |
|---|---|---|
| People | Built | No persistent duplicate-resolution queue UI (a narrower synchronous check-and-reject stands in); multi-Role-Assignment Persons still can't authenticate (open product question) |
| Pastoral Care | Built | Automatic task-creation trigger and automatic escalation-target resolution are **not** wired — no "default Shepherd"/"organizational superior" data exists to resolve them from; every create/escalate call needs an explicit target |
| Gatherings | Built | No "Usher" role exists in the RBAC catalog despite the PRD narrative naming it — other roles stand in as a disclosed non-citation; recurrence-rule format is an opaque string (no auto-generation from a series) |
| Stewardship | Built, including a later gaps-closing pass (bank-deposit reconciliation, SLA-breach sweep, pledge reminders, Project progress aggregation) | Mobile Money provider confirmation (NFR-INT-01, Horizon 2) remains the one undecided scheduler-adjacent gap |
| Insights | Built | **The real Engagement Signal ingestion pipeline (EventBridge/SQS) does not exist yet** — dashboards are correct against whatever signal rows exist, but nothing populates them in a real deployment until this pipeline ships; Person-level Church Pulse is structurally blocked (no code path can compute it), per the NFR-PRIV-02 hard gate |
| Ministry | Built | "Rostered" means active group membership, not a per-Gathering assignment (no such entity exists); overcommitment flag counts concurrent Basonta memberships, not concurrent Gathering commitments (a disclosed proxy); Assistant Pastors have no cluster-oversight mechanism over Basontas |

All six were confirmed via a real `pnpm install && pnpm lint && pnpm test && pnpm build` run on the user's own machine — **the locked Release 1 backend roadmap is complete.**

### 4.3 Background processing (`apps/worker`)

Built in two milestones: a first vertical slice (idempotency table, platform layer, `insights-consumer`, `silent-drift-sweep`), then the full Blueprint §10 inventory (`notification-consumer` as a stub — no delivery channel decided anywhere in the PRD; `audit-consumer`; `church-pulse-recompute`; `follow-up-sla-sweep`; `attendance-completeness-sweep`; plus a later gaps-closing pass adding `flagged-transaction-sla-sweep` and `pledge-reminder-sweep`).

**Structural gap, disclosed, not fixed:** no "system actor" concept exists in `libs/rbac`. Every sweep bypasses the RBAC/audit-log guards by construction (a worker has no HTTP request to resolve an actor from), and most sweeps only *detect and signal* a condition rather than mutate data, specifically to avoid inventing a fake actor for a `NOT NULL` actor foreign key. `pledge-reminder-sweep` is the one exception — `Pledge.reminderSentAt` has no actor FK, so it's the one sweep that safely mutates state.

### 4.4 UI component library (`libs/ui/{tokens,core,web,native}`)

**Complete — 23 of 23 base components**, plus a full Navigation/Data/Layout tier (Table, Search, Pagination, Filters, CommandPalette [web-only], Charts, BottomNav [native-only], RecordPicker), on both `@ecclesia/ui-web` (React DOM) and `@ecclesia/ui-native` (React Native), sharing one theme object and one icon registry (`lucide`). No new build tooling was added (Storybook is recommended but deliberately not built, given this repo's history of tooling breakage). Jest cannot execute in this working environment at all (a persistent `@swc/core` binding failure) — every component has been statically type-checked here and then verified for real via the user's own `pnpm lint`/`pnpm test`.

### 4.5 Web Admin (`apps/web-admin`)

All six PRD §16 domain pages are built on a real Application Shell (persistent sidebar/top-bar, hand-built router and Cognito client — no routing library or Cognito SDK is available in this workspace):

| Page | Built | Notably deferred within it |
|---|---|---|
| Dashboard (Resident Pastor's Branch dashboard) | Yes | "Forward alert to Assistant Pastor" quick action has no backing endpoint — not faked |
| People | Directory + Person profile (read-only) | New Person intake form, duplicate-resolution queue UI, Bacenta/Basonta reassignment flow |
| Pastoral Care | Follow-up task queue, Complete **and now Escalate** | Silent-drift flags, Pastoral notes (belongs on the Person profile instead), Poimen tracker (Horizon 2), manual task-creation form |
| Ministry | Basonta directory + roster view | Staffing Targets UI, worker availability self-service |
| Gatherings | Gathering calendar with per-row attendance-completeness badge | Attendance Capture and Visitor Intake (both Usher-primary, mobile-optimized — and blocked on the same missing "Usher" role) |
| Stewardship | Verification and approval queues (Verify/Flag/Escalate/Reconcile, Approve/Reject/Pay) | Record Financial Transaction, Request Expense, Attach Receipt (needs file upload — doesn't exist anywhere in this codebase), Project/Pledge surfaces |
| Insights | Role-routed views for every persona with a defined surface | Weight-configuration UI (Horizon 2), true multi-Bacenta ranked cluster view, Person-level Church Pulse (hard-gated) |
| Configuration | Built (Admin/Council Administrator only) | — |

**`[Stewardship gaps sprint]` progress against the deferred list above:** `Modal` was built first (the most-cited real blocker). Then the ten remaining base components and the full Navigation/Data/Layout tier were built. Most recently, `RecordPicker` unblocked **Pastoral Care's Escalate action**, now fully wired (`PATCH /follow-up-tasks/:id/escalate`, an inline Person search, confirmed working end-to-end on the user's machine). Record Transaction, Request Expense, and New Person intake remain open — see §5 below for exactly what each still needs.

### 4.6 Mobile (`apps/mobile`)

A real multi-screen app, not a placeholder: a dependency-free stack navigator, a Development-Auth sign-in flow, and the Shepherd's Bacenta Dashboard (the PRD's own "single most important screen in the product") plus Attendance Capture, both fully wired to real backend endpoints with **zero new backend endpoints needed** for Attendance Capture specifically.

Per the Design System's persona tab-bar spec (§3.2), here is what exists vs. what's still missing per persona:

| Persona | Spec'd tab bar | Built |
|---|---|---|
| Shepherd (Bacenta Leader) | Dashboard · Attendance · Follow-ups · Offering · Profile | Dashboard, Attendance only |
| Ministry Leader | Dashboard · Roster · Events · Profile | None yet |
| Finance Officer | Dashboard · Verify · Reconcile · Profile | None yet |
| Branch/Resident Pastor | Dashboard · Alerts · Cluster/Branch · Profile | None yet (this persona's primary surface is Web Admin) |

---

## 5. Concrete open work items (in rough order of how "shovel-ready" each is)

These are the specific, named gaps still open across the codebase — every one of them traces to a disclosed note in a `*_DESIGN_NOTES.md` file or this README, not a guess.

**Backend-ready, frontend-only remaining:**
- Stewardship **Record Financial Transaction** — `POST /financial-transactions` already exists; the optional `sourceGroupId` field genuinely benefits from `RecordPicker`'s Group mode but could ship without it.
- Stewardship **Request Expense** — `POST /expenses` already exists; no picker dependency at all, just a form (amount/currency/description/category).
- People **New Person intake** — `POST /people` already exists; not actually blocked by a missing picker (contrary to how it was originally framed) — its real blocker is duplicate-candidate (409) handling UX, which needs its own design pass.

**Needs new backend work, not just frontend:**
- Mobile: **Offering recording** and **Follow-up queue** screens for the Shepherd persona (the two remaining items in that persona's own tab bar) — backend endpoints already exist (Stewardship, Pastoral Care), so this is primarily a Mobile-app + navigation-tab exercise, similar in shape to Attendance Capture.
- Mobile: Roster/Events (Ministry Leader), Verify/Reconcile (Finance Officer), Alerts/Cluster (Branch Pastor) — none started.
- **The Engagement Signal ingestion pipeline** (EventBridge/SQS end-to-end) — the single biggest structural gap standing between this system and Church Pulse actually reflecting real usage in production, since nothing currently populates `engagement_signals` outside of manual/test data.
- **The "Usher" role** — a product decision needed before Attendance Capture/Visitor Intake can move to Web Admin, and before the role catalog can be considered PRD-complete.
- **Multi-Role-Assignment Person authentication** — an open Sprint 1.4 question, deliberately left unresolved pending a product decision.
- **Automatic Follow-up task assignment / escalation-target resolution** — needs an organizational-hierarchy data model (e.g., a real "reports to" pointer) that doesn't exist in the schema today.
- **A "system actor" concept** for `apps/worker` — would let sweeps safely mutate data (today, only `pledge-reminder-sweep` can, because of a schema accident, not a designed capability).
- **A real Cognito User Pool + a real Postgres instance with RLS enforced** — both infrastructure prerequisites for taking any of the above from "verified in this sandbox" to "verified for real."

**Horizon 2/3 scope (deliberately not started — see §1):** Poimen training curriculum, Project/pledge tracking UI, Mobile Money simplified flows, member-level Church Pulse, multi-branch Council consolidation, Online Gatherings, Bacenta/Basonta split-merge workflows.

---

## 6. Suggested "what's next" candidates

No single next step is mandated by the source documents beyond the horizon sequencing in §1 — engineering judgment picks the order within a horizon. Reasonable next candidates, roughly in order of leverage-per-effort:

1. **Finish the Shepherd's mobile tab bar** (Offering, Follow-ups) — closes out the PRD's own named highest-priority mobile persona, reusing entirely existing backend endpoints.
2. **Stewardship's Record Transaction / Request Expense forms** — the last Web Admin write-flow gaps, one of which (`RecordPicker`) is already unblocked.
3. **The Engagement Signal ingestion pipeline** — the highest-leverage structural fix, since it's the one gap that affects whether Church Pulse (the product's core differentiator) reflects reality anywhere outside a seeded dev database.
4. **Resolve the "Usher" role question with product** — unblocks moving Attendance Capture/Visitor Intake to Web Admin as a stated goal, and closes a real RBAC-catalog gap.
5. **Run the RLS verification procedure against a real database**, and provision a real Cognito User Pool — neither is more code; both are infrastructure prerequisites this project has been carrying as "verified in-sandbox only" for a while.

---

*Compiled from `docs/Ecclesia_PRD.md`, `docs/Ecclesia_Technical_Blueprint.md`, `docs/Ecclesia_Design_System_UX_Foundation_v1.0.md`, and `README.md`'s "Current status" section, all current as of this repository's latest commit.*
