# Ecclesia Design System & UX Foundation v1.0

## How This Document Relates to the PRD and Technical Blueprint

| Document | Answers |
|---|---|
| Product Vision | Why Ecclesia exists |
| PRD v1.0 | What Ecclesia must do, for whom, and why (personas, requirements, workflows) |
| Technical Blueprint v2.0 | How Ecclesia is built (architecture, data, events, deployment) |
| **Design System & UX Foundation v1.0 (this document)** | How Ecclesia should *feel*, and the reusable design language every screen — Web Admin and Mobile — is built from, so that a screen is designed once and only once |

This document is downstream of the PRD and Blueprint, not parallel to them. Every persona, screen, permission boundary, and non-functional requirement referenced here traces to a specific PRD or Blueprint citation. Where a design decision has no source-document citation — a color value, a spacing scale, a component's exact interaction pattern — it is original design work performed for this document, and is marked **[Design decision — not sourced]** so that future readers can distinguish "the PRD required this" from "the design team decided this in the absence of a requirement." Nothing in this document silently reinterprets or contradicts the PRD or Blueprint; where the two undershoot what a coherent design system needs (for example, no platform-level "Super Administrator" role exists anywhere in the RBAC model as specified), that gap is named as an open question, not quietly resolved by invention.

**What this document is not.** It is not a Figma file, a component storybook, or React/React Native code. It is the product design architecture — principles, personas, information architecture, visual language, tokens, component specifications, and UX rules — that a future implementation phase (explicitly scoped as the *next* piece of work, covering `apps/web-admin` and `apps/mobile`) will build against. Building the same screen twice, once for web and once for mobile, with two different button styles and two different definitions of "what does a Church Pulse alert look like," is the specific failure this document exists to prevent.

**Scope confirmed against the current codebase.** As of this writing, both `apps/web-admin` and `apps/mobile` are Sprint-0 Nx scaffolds only — a single generated `App` component and test file each, no styling framework, no component library, and no design tokens anywhere in the repository. This document has a clean slate to work from; nothing here is retrofitted around an existing, inconsistent UI.

---

## Document Control

| Field | Value |
|---|---|
| Version | 1.0 |
| Status | Draft for review — precedes any `apps/web-admin` or `apps/mobile` implementation work |
| Owners | Design (this document), consumed by Engineering (Web Admin and Mobile implementation) |
| Companion documents | `Ecclesia_PRD.md` (v1.0), `Ecclesia_Technical_Blueprint.md` (v2.0) |

---

## Table of Contents

1. Product Philosophy
2. User Personas
3. Information Architecture
4. Dashboard Philosophy
5. Visual Design Language
6. Design Tokens
7. Component Library
8. UX Rules
9. Mobile Experience
10. Data Visualization
11. AI Experience
12. Design Governance

---
## Part 1 — Product Philosophy

### 1.1 Product vision, restated for design

The PRD's vision is "to become the world's most comprehensive Church Operating System" (PRD §2), built on the analogy that an operating system provides a small set of core abstractions that every application shares, rather than each application reinventing its own. That analogy has a direct design consequence that this document exists to enforce: **if People, Pastoral Care, Ministry, Gatherings, Stewardship, and Insights are applications running on a shared core, they must also share a visual and interaction language.** A Shepherd should not have to relearn what a "save" affordance looks like when they move from recording attendance (Gatherings) to logging a pastoral note (Pastoral Care). The Technical Blueprint enforces one shared data core, one shared event bus, and one shared permission engine (`libs/rbac`) across every domain. This document is the design-layer equivalent of that same discipline: one shared design token set and one shared component library, consumed identically by every domain's screens, on both Web Admin and Mobile.

### 1.2 UX philosophy

Ecclesia's UX philosophy is derived directly from the PRD's six Product Principles (PRD §6), translated from product requirements into interface behavior:

| PRD Principle | Design translation |
|---|---|
| **Ministry First** | Every screen must visibly serve a pastoral, discipleship, or ministry outcome. A screen that exists only to display data with no path to action (follow up, verify, approve, reassign) has failed this principle regardless of how well it presents that data. |
| **People Before Data** | Domain vocabulary (Bacenta, Basonta, Poimen, Shepherd) is never translated into generic software terms ("Group," "Team," "Member Tier") in the interface, even though the data layer genericizes them (Blueprint §5.1, the `Group` abstraction with a type discriminator). A Shepherd should never have to mentally translate the church's own language into the software's. |
| **Relationships Matter** | Every profile, record, or list view answers "who is responsible for this" and "who is this connected to" as a first-class, visible element — not a fact the user must click through to find. A Person's screen always shows their Shepherd; a Bacenta's screen always shows its leader. |
| **Configurable by Design** | The interface must visibly distinguish what is a fixed rule (cannot be changed by any role) from what is configuration (an Admin can change it here). Configuration surfaces are never hidden behind engineering-only tooling — FR-ADM-01's requirement that an Admin can rename "Basonta" without a code deployment is a design requirement as much as a technical one. |
| **Stewardship with Accountability** | Every financial and leadership action the interface allows must make its own audit trail visible to the people entitled to see it — a Treasurer sees who recorded a transaction; a verification action always requires the interface to name what is being verified and by what authority. Trust is designed in, not merely logged in the database. |
| **Built to Grow** | The interface must not visually assume a single Branch or a single Council. Every screen that will eventually need Branch- or Council-level scoping (Blueprint §7.3's Row-Level Security multi-tenancy) is designed with an explicit scope indicator from Release 1, even where only one Branch exists today, so that scope never has to be retrofitted into a screen that previously assumed it away. |

### 1.3 Design principles

1. **One screen, one job.** Every screen answers one primary question or completes one primary action. A dashboard is the exception by design (Part 4) precisely because its one job is triage — everything else follows this rule strictly.
2. **Show the next action, not just the current state.** Ecclesia's core differentiator against incumbent "records systems" (PRD §1) is that it tells a leader what to do next, not just what happened. Every list, alert, and dashboard card is designed with a visible next action, not just a data point.
3. **Speed is a pastoral feature, not a technical nicety.** NFR-PERF-01 requires attendance capture in under 60 seconds because Shepherd Kwabena's fellowship time is the thing being protected (PRD §11.4). Every interaction-cost decision in this document is made against that standard: does this design choice cost a volunteer leader time that could have gone to a person instead of a screen?
4. **Trust through transparency, not through decoration.** Financial and pastoral-care surfaces build user trust by showing provenance (who did this, when, under what authority) rather than through visual weight or color alone. A calm, quiet interface that clearly shows its own audit trail is more trustworthy than a busy one with reassuring badges.
5. **Consistency is the product, not a style guide.** Every button, table, and status color means the same thing everywhere it appears. A user who has learned one part of Ecclesia has learned all of it. This is the specific promise "design once, build twice" makes possible.

### 1.4 Simplicity principles

- **Progressive disclosure over exhaustive forms.** The PRD's own visitor-intake specification names minimal required fields at capture (name, phone, how they heard about the church), with everything else completable later (PRD §16.1, "New Person / visitor intake form"). This is the model for every capture form in the product: capture the minimum needed to act, let the rest be completed later, by whoever is best positioned to complete it.
- **Defaults do the work.** Attendance capture is a pre-populated roster with tap-to-mark-present, never a blank form (PRD §16.4, "not a blank form" is explicit PRD language). Wherever the system already knows the likely answer — the roster, the previous week's amount, the assigned Shepherd — it should be the default, not a lookup the user performs themselves.
- **One primary action per screen, visually undisputed.** Secondary actions exist, but never compete visually with the primary one. A user under time pressure (every ministry-facing persona in Section 2) should never have to read a screen to find out what it wants them to do.
- **No feature without a stated ministry rationale.** Mirroring the PRD's own discipline (PRD §6, "Ministry First" requires a stated ministry rationale per epic), no component, screen, or interaction pattern in this system is justified purely by "it's a common SaaS pattern." If it doesn't serve care, ministry, or faithful stewardship, it does not belong in Ecclesia's interface, however common it is elsewhere.

### 1.5 Accessibility standards

Accessibility in Ecclesia is a baseline requirement, not an enhancement, for two source-cited reasons: NFR-USA-02 requires WCAG 2.1 AA compliance for text contrast and resizing "to accommodate a broad age range of leaders, including older Shepherds and Pastors" (PRD §14.8), and Blueprint §14.9 requires that no user-facing string is ever hard-coded — every string routes through an i18n layer from Release 1, and accessible semantic primitives (heading hierarchy, labeled form controls, adequate touch targets for older users) are a default code-review checklist item, not a pre-release audit pass.

This document adopts **WCAG 2.1 AA as the non-negotiable floor** for every component in Part 7, with the following concrete standards, all of which trace to the two citations above:

| Standard | Requirement | Source |
|---|---|---|
| Color contrast | 4.5:1 minimum for body text, 3:1 for large text (18px+/bold 14px+) and UI component boundaries | NFR-USA-02, WCAG 2.1 AA |
| Text resizing | All text must remain legible and non-clipping at 200% browser/OS zoom | NFR-USA-02 |
| Touch targets | Minimum 44×44pt (iOS) / 48×48dp (Android) tap target on all mobile interactive elements | Blueprint §14.9 ("sufficient touch-target sizing for older users") |
| Keyboard operability | Every Web Admin action reachable and operable via keyboard alone, with a visible focus indicator | WCAG 2.1 AA (2.1.1, 2.4.7) — **[Design decision — not sourced beyond the WCAG 2.1 AA floor]** |
| Screen reader support | Semantic HTML/ARIA roles on Web Admin; accessible component props (`accessibilityLabel`, `accessibilityRole`) on Mobile | WCAG 2.1 AA — **[Design decision]** |
| Internationalization readiness | No hard-coded strings; all copy routes through an i18n resource layer from Release 1, even while only English ships | Blueprint §14.9, NFR-L10N-01 |
| Motion sensitivity | Respect OS-level "reduce motion" settings; no motion-only affordances (an action must never be indicated by animation alone) | **[Design decision — not sourced]**, consistent with WCAG 2.1 AA 2.3.3 |

### 1.6 Mobile-first philosophy

The Technical Blueprint is explicit that offline-first is "a mobile architecture requirement, not a mobile UI nicety" (Blueprint, architectural principles table, referencing NFR-OFF-01/02), and the persona data backs this up directly: five of the PRD's eight ministry-side personas are smartphone-only or smartphone-first, with variable connectivity, brief high-frequency sessions (Shepherd Kwabena, PRD §11.4), and the explicit design target of attendance capture "standing during a meeting," per NFR-PERF-01's framing. Ecclesia's mobile-first philosophy therefore means:

- Every ministry-facing capture workflow (attendance, offering recording, follow-up, pastoral notes) is **designed for mobile first, then adapted upward to Web Admin** — never the reverse. A form that works well on a laptop and is merely "responsive" on a phone does not meet this standard.
- Mobile screens assume **one hand, standing, brief attention, and possibly no connectivity** as the default operating condition, not the edge case (Part 9 details this).
- Web Admin is the mobile-first philosophy's counterpart for a different persona set — Treasurer Kofi and Admin Efua both explicitly prefer desktop/laptop for reconciliation and configuration work (PRD §11.6, §11.9) — so "mobile-first" governs *which screens* are designed mobile-first, not a blanket claim that the entire product is mobile-first.

### 1.7 Desktop philosophy (Web Admin)

Web Admin exists for a narrower, deeper set of jobs: reconciliation, configuration, cross-Bacenta and cross-Branch oversight, and any workflow that benefits from more screen space, keyboard input, and sustained attention — Treasurer Kofi's reconciliation work and Admin Efua's configuration work are the paradigm cases (PRD §11.6, §11.9), alongside the Resident Pastor's and Assistant Pastor's dashboard review sessions when not on mobile. Web Admin's philosophy is therefore **density with clarity, not density for its own sake**: it can show more per screen than Mobile, but every additional element must still serve the "what needs my attention today" standard (Part 4), not simply fill the available space because it exists.

### 1.8 Information density philosophy

Ecclesia's information density is persona- and context-dependent, not a single fixed standard:

- **Ministry-facing capture screens (mobile, in-the-moment): minimum density.** One task, one screen, minimum required fields — Shepherd Kwabena's attendance capture is the standard-bearer (PRD §11.4, §16.4).
- **Leadership dashboards (both platforms): curated density.** A ranked, bounded list of what needs attention (Part 4), never an undifferentiated data dump. Pastor Grace's stated pain point — no way to compare Bacentas to see which need the most support this week (PRD §11.3) — is precisely the failure mode of low-curation, high-density dashboards; Ecclesia's dashboards rank and prioritize instead of merely displaying.
- **Administrative and reconciliation screens (Web Admin): high, structured density.** Treasurer Kofi's verification queue and reconciliation dashboard (PRD §16.5) are allowed to be table-dense, because the persona's job at that moment is comparison and verification across many records, not triage of a few. Density here is a tool, not a compromise — but it is still bounded by clear grouping, sorting, and filtering (Part 7's Table component), never raw, unstructured volume.

### 1.9 Anti-goals

What Ecclesia's interface must never become, stated explicitly so that "simple" and "fast" have teeth in design review:

| Anti-goal | Why it's excluded |
|---|---|
| **A generic CRM with church labels pasted on.** | Directly forbidden by "People Before Data" (PRD §6) and the anti-pattern it names: forcing users to learn the software's abstractions instead of the software learning the church's vocabulary. |
| **A vanity-metrics dashboard.** | Church Pulse exists specifically because attendance-only, count-based dashboards mask disengagement (PRD §1, §8.1). Any dashboard organized around raw counts rather than actionable priority (Part 4) has regressed the product's core differentiator. |
| **A system that requires training to operate its core workflows.** | Directly forbidden by NFR-USA-01: core ministry-facing workflows must be operable by a user with no prior formal software training, within a single guided session, with a ≥90% first-time task success rate in usability testing (PRD §14.8). |
| **A cluttered, "everything visible at once" interface.** | Named directly in this document's brief; also the specific failure mode RISK-02 (PRD §20) predicts — Shepherd data-entry fatigue from a tool that is "too slow or interrupts fellowship time." Clutter costs time, and time is the resource Ecclesia exists to protect. |
| **An interface that treats AI output as equivalent to verified fact.** | Church Pulse and every Insights alert are *leading indicators for a human decision*, never an autonomous pastoral action. Part 11 defines this boundary in full; visually conflating "the system computed this" with "this is confirmed truth" is an anti-goal on its own. |
| **A financial interface that relies on user trust instead of designed-in accountability.** | "Stewardship with Accountability" (PRD §6) exists to prevent exactly this: no single role's honesty should be load-bearing where the interface could instead make the audit trail visible and the separation of duties structurally enforced. |
| **A one-size-fits-all screen that ignores persona scope.** | FR-INS-04 requires that a Shepherd's Insights view contain no data belonging to a Bacenta they do not lead (PRD §13, Functional Requirements). A dashboard or list view that shows more than a role's defined scope — even if technically "more informative" — is a permission-model violation wearing a UX justification. |
| **Decoration that outlives its usefulness.** | Illustration, animation, and iconography (Part 5) exist to aid comprehension and calm, never as unearned visual flourish. A ten-year design system (this document's own stated horizon) cannot afford trend-driven ornamentation that will look dated in two. |

---
## Part 2 — User Personas

### 2.0 Mapping note

This document was scoped to design for eight named personas: Shepherd, Bacenta Leader, Ministry Leader, Branch Pastor, Resident Pastor, Council Administrator, Finance Officer, Super Administrator. Cross-referencing against PRD §11 (the authoritative persona chapter) surfaces three mapping issues that are named here rather than silently resolved, consistent with this project's standing discipline of flagging anything not directly traceable to a source citation:

| Requested persona | PRD §11 mapping | Note |
|---|---|---|
| Shepherd / Bacenta Leader | **Same persona**: Shepherd Kwabena — Bacenta Leader (§11.4) | "Shepherd" is the informal/functional title for the Bacenta Leader role, per the PRD's own glossary (§25: "The informal/functional title for a Bacenta Leader"). Listed once below, not twice. |
| Ministry Leader | Leader Abena — Basonta (Ministry Team) Leader (§11.5) | Direct match; "Ministry Leader" is this document's generalized label for the persona the PRD names by their team type. |
| Branch Pastor | **Not a named PRD persona.** Closest analog: Pastor Grace — Assistant Pastor (§11.3), who holds delegated, cluster-level oversight *within* a Branch, distinct from the Resident Pastor's Branch-wide final authority (§11.2). | **[Open question, flagged for Product]**: if "Branch Pastor" is intended as a distinct future role (e.g., the pastor of a specific Branch within a multi-branch Council, as opposed to Assistant Pastor's cluster-within-a-branch scope), it is not yet specified anywhere in the PRD or Blueprint. This document proceeds using Assistant Pastor as the nearest cited persona and names the gap explicitly rather than inventing a role definition. |
| Resident Pastor | Pastor Emmanuel — Resident Pastor (§11.2) | Direct match. |
| Council Administrator | **Not a named PRD persona.** Nearest analogs: Admin Efua — Church Administrator (§11.9, Branch-scoped configuration) and Overseer Apostle Boateng — Council Overseer (§11.10, Horizon 3, cross-branch oversight but not configuration authority). | **[Open question, flagged for Product]**: no source document defines a role with Council-level *configuration* authority (as opposed to Council-level *oversight*, which Overseer Boateng has). This document synthesizes a persona for Council Administrator by combining Admin Efua's configuration job-to-be-done with Overseer Boateng's cross-branch scope, and marks every detail of that synthesis as inferred, not cited. |
| Finance Officer | Treasurer Kofi — Finance Team (§11.6) | Direct match; "Finance Officer" is this document's generalized label. |
| Super Administrator | **Not present anywhere in the PRD or Blueprint.** The RBAC model (Blueprint §9) is scoped to Bacenta/Cluster/Branch; no platform-wide, cross-tenant administrative role exists in the current permission matrix, and Council-level consolidation is itself still Horizon 3 (PRD §7.3). | **[Open question, flagged for Product and Engineering]**: a "Super Administrator" persona is only meaningful once Ecclesia has multiple independent tenant organizations (per the vision's "40-person congregation and a thousand-church Council on the same core," PRD §1) — a platform-operator layer above even the Council. This persona is designed below using product judgment about what a platform operator will need, explicitly disclosed as design-team invention pending a real requirements pass whenever multi-tenant platform administration is scoped as engineering work. |

The eight personas below are presented in the operational order a Bacenta's data actually flows through — Shepherd first, Super Administrator last — rather than PRD's org-chart order, because that is the order the product's screens (Part 3) are navigated in practice.

### 2.1 Shepherd (Bacenta Leader)

*Source: PRD §11.4, Shepherd Kwabena.*

**Goals.** Actually know his ~10–25 people — who's struggling, growing, or missing. Spend Bacenta meeting time shepherding, not administering. Never be the reason an offering fails to reconcile.

**Daily/weekly workflow.** Attends and leads a weekly Bacenta meeting; takes attendance in the room, live; records the offering collected immediately after; checks, a few times a week, whether anyone he's responsible for needs follow-up. Entirely mobile — a laptop session is not a realistic part of this persona's week.

**Pain points.** Attendance and follow-up currently live on paper or in memory; reconstructing "who hasn't come in three weeks" is manual. Offering recording immediately after a long meeting, while tired, is the task most likely to be skipped if the tool isn't fast (PRD §11.4).

**Dashboard expectations.** A single mobile home screen — the "Shepherd's Bacenta dashboard," PRD §16.2's own description of it as "the single most important screen in the product" — showing his roster, attendance trend, active follow-ups, and silent-drift flags, with nothing requiring more than one tap to act on.

**Critical actions.** Take attendance (sub-60-second target, NFR-PERF-01). Record an offering. Log or resolve a follow-up. Reassign a member (with reason code, PRD §16.1). Read and act on a silent-drift flag.

### 2.2 Ministry Leader (Basonta Leader)

*Source: PRD §11.5, Leader Abena.*

**Goals.** Have enough trained, available people for every service and especially major events. Know who on the team is overcommitted versus underused.

**Daily/weekly workflow.** Event-driven rather than steady-state — usage spikes ahead of a Convention or Camp, quieter between events. Manages a roster of Workers who may also belong to other Basontas and a Bacenta simultaneously.

**Pain points.** Staffing today is coordinated informally (a WhatsApp group, verbal check-ins); gaps are discovered the week of the event, not weeks ahead (PRD §11.5).

**Dashboard expectations.** A roster view showing current workers and availability, and — once staffing-adequacy is built (H2) — a staffing-gap view surfaced ahead of the event, not after.

**Critical actions.** Add/remove a worker from the roster. Set a staffing target for an upcoming Gathering. Review overcommitment flags before recruiting further.

### 2.3 Branch Pastor *(mapped to Assistant Pastor — see §2.0)*

*Source: PRD §11.3, Pastor Grace — Assistant Pastor. See the mapping note above; treat "Branch Pastor" and "Assistant Pastor" as synonymous in this document pending Product clarification.*

**Goals.** Know which Bacentas under her care need attention this week, not just this quarter. Support Shepherds without micromanaging. Identify Shepherd candidates from among Workers in her cluster.

**Daily/weekly workflow.** Reviews her cluster's standing at the start of each week; is the escalation point when a Shepherd flags a concern beyond their own capacity.

**Pain points.** Oversight today is reactive — she hears about a problem in conversation, not from a system that surfaces it; no easy way exists to compare Bacentas against each other (PRD §11.3).

**Dashboard expectations.** The "Assistant Pastor cluster view" (PRD §16.2, §16.6): every Bacenta in her cluster, ranked by Church Pulse trend, replacing informal check-ins as her primary decision tool.

**Critical actions.** Review the ranked cluster list. Open a specific Bacenta's detail to understand a decline. Respond to a Shepherd's escalation.

### 2.4 Resident Pastor

*Source: PRD §11.2, Pastor Emmanuel.*

**Goals.** Know, at a glance, whether the church is healthy — not just whether Sunday attendance is up. Make Shepherd/Pastor appointment decisions on evidence, not just tenure. Trust financial stewardship without personally auditing every transaction.

**Daily/weekly workflow.** Short, infrequent, high-value sessions — "time is the scarcest resource" (PRD §11.2) — typically a Sunday-evening or weekly review, plus reactive checks when a notification arrives.

**Pain points.** Attendance numbers give false comfort and can hide Bacenta-level hollowing-out; appointment decisions currently rely on verbal recommendation with no consolidated evidence view; tracing a financial discrepancy to its source is slow (PRD §11.2).

**Dashboard expectations.** Branch-level Church Pulse, trend, and top alerts across all clusters — one number that answers "celebrate or intervene" (PRD §11.2, §16.6).

**Critical actions.** Review the Church Pulse trend and top alerts. Forward an alert to the relevant Assistant Pastor in one tap (the PRD's own representative scenario, §11.2). Review an appointment candidate's consolidated history. Review the weekly reconciliation summary (view-only, PRD §16.5).

### 2.5 Council Administrator *(synthesized — see §2.0)*

*Source: synthesized from PRD §11.9 (Admin Efua, Church Administrator) and §11.10 (Overseer Apostle Boateng, Council Overseer), Horizon 3. Not a cited, fully-specified persona — see the open question in §2.0.*

**Goals (inferred).** Keep Council-wide configuration (Branch list, shared taxonomies, cross-branch reporting definitions) consistent, without dictating every Branch's local configuration — mirroring the "Council standardization vs. branch autonomy" tension the PRD names directly (PRD §10.5): the invariant core is what the Council compares across Branches, while the configurable layer stays Branch-owned.

**Daily/weekly workflow (inferred).** Low-frequency, high-stakes — closer to Overseer Boateng's "low-frequency, high-stakes review sessions" (PRD §11.10) than to Admin Efua's more continuous, reactive configuration work, since this persona operates one level higher than any single Branch's Admin.

**Pain points (inferred).** Without a shared core data model, Council-level consolidation requires manual reconciliation of differently-structured Branch data — the exact failure the PRD commits to designing against from Release 1 (PRD §9.5, §11.10).

**Dashboard expectations (inferred).** A Council-level rollup of every Branch's Church Pulse and configuration-compliance state, with drill-down into any Branch's own Resident Pastor dashboard.

**Critical actions (inferred).** Provision a new Branch. Manage cross-Branch shared taxonomies. Review Council-wide reconciliation status.

**This entire persona should be re-validated with Product before any Council Administrator-specific screen is designed** — everything above is this document's best-effort synthesis, not a requirement.

### 2.6 Finance Officer (Treasurer)

*Source: PRD §11.6, Treasurer Kofi.*

**Goals.** Prove, for any given week, exactly what was collected, by which Bacenta, verified by whom, and reconciled against what was banked. Prepare the weekly report without a manual, error-prone spreadsheet exercise.

**Daily/weekly workflow.** Desktop/laptop preferred for reconciliation; smartphone for on-the-go verification (PRD §11.6). A concentrated weekly cycle: verify incoming transactions as Bacenta Leaders submit them, flag discrepancies, reconcile against the bank, produce the report.

**Pain points.** Reconciling many Bacenta Leaders' offering records against the counted/banked total is manual and additive today; a discrepancy requires re-checking each Bacenta's submission individually, with no system-enforced audit trail (PRD §11.6).

**Dashboard expectations.** A verification queue (transactions awaiting accept/flag), a discrepancy queue, and a reconciliation dashboard showing verified totals against bank deposit confirmation (PRD §16.5).

**Critical actions.** Verify or flag a transaction. Investigate a discrepancy. Reconcile the week. Approve or reject an expense request. Export the weekly financial report.

### 2.7 Super Administrator *(inferred — see §2.0)*

*Source: not present in the PRD or Blueprint. Designed here using product judgment about what a platform-operator role will require once Ecclesia serves multiple independent tenant organizations, consistent with the vision's stated ambition (PRD §1–2). Entirely **[Design decision — not sourced]**; requires a real requirements pass before implementation.*

**Goals (inferred).** Onboard and manage tenant organizations (individual churches or Councils) on the Ecclesia platform. Monitor platform health and usage across tenants without visibility into any tenant's pastoral or financial *content* — a platform operator's authority should be operational, not pastoral, mirroring the same separation-of-duties instinct the PRD applies everywhere else (PRD §6, "Stewardship with Accountability").

**Daily/weekly workflow (inferred).** Infrequent, operational — provisioning a new tenant, managing platform-level billing or support escalations, monitoring system health dashboards (distinct from any single church's Church Pulse).

**Pain points (inferred).** None sourced; this role does not yet exist in any deployed context.

**Dashboard expectations (inferred).** A platform-operations view — tenant list, provisioning status, platform-level system health — structurally separate from any tenant's own data, enforced by the same Row-Level Security boundary (Blueprint §7.3) that already isolates Branches from each other.

**Critical actions (inferred).** Provision a new tenant. Suspend/restore a tenant. View platform-level (not tenant-level) operational metrics.

**Recommendation:** do not build any Super Administrator screen until this persona has gone through the same discovery-and-requirements process the PRD's other eight personas did. It is included here only so that the design system's role/scope model (Part 3) doesn't have to be re-architected the day platform administration becomes real work.

---
## Part 3 — Information Architecture

Ecclesia's information architecture is organized around the six bounded-context domains (People, Pastoral Care, Ministry, Gatherings, Stewardship, Insights — PRD §16, Blueprint §5), each already independently designed with a stated purpose, key surfaces, and domain boundary in the PRD. This document does not re-invent that structure; it turns it into navigation. Web Admin and Mobile get **separate** information architectures because they serve different personas doing different classes of work (Part 1.6–1.7), not because the underlying domain model differs — the same six domains, the same permission scopes (Blueprint §9), and the same design tokens (Part 6) underlie both.

### 3.1 Web Admin navigation

**Global navigation — persistent left sidebar**, one entry per domain the signed-in role has any access to, plus Dashboard as the default landing entry:

```
Dashboard
People
Pastoral Care
Ministry
Gatherings
Stewardship
Insights
Configuration        (Admin/Council Administrator roles only)
```

*Why a persistent sidebar, not a top nav or mega-menu:* Web Admin's primary personas (Resident/Branch Pastor, Finance Officer, Council Administrator) work in extended sessions across multiple domains in one sitting — a Finance Officer moves between the verification queue and Stewardship's reconciliation dashboard, then checks Insights for the Church Pulse trend, in a single session. A persistent sidebar keeps every domain one click away regardless of how deep the user is in another domain's workflow, which a top nav's typical single-level-visible pattern does not support as well at this domain count (six to eight, plus Configuration).

**Maximum navigation depth: 3 levels** — Domain → Surface (e.g., "Stewardship → Verification Queue") → Record detail (e.g., a specific flagged transaction). No Web Admin workflow should require a fourth level; where a workflow seems to need one (e.g., a transaction's full audit history), it is presented as a panel or tab *within* the record detail view, not a new navigation level, consistent with the "one screen, one job" principle (Part 1.3) not being violated by an ever-deepening breadcrumb.

**Context navigation.** Within a domain, a secondary tab or sub-nav row (not a second sidebar) exposes that domain's key surfaces, drawn directly from the PRD §16 surface tables — for example, Stewardship's context row is `Verification Queue | Discrepancy Queue | Reconciliation | Expenses | Projects`, matching PRD §16.5 exactly. This keeps the domain-to-surface mapping traceable straight back to the PRD's own information architecture rather than a design-team reinterpretation of it.

**Search strategy.** A single global search, always reachable (Part 7's Command Palette component), **role-scoped by default** — a Shepherd's search (Web Admin is a secondary surface for this persona, but Assistant Pastors and Admins use it daily) returns results only within their permission scope, directly implementing the PRD's own IA requirement: "a Shepherd searches within their Bacenta context by default; an Admin searches the whole Branch" (PRD §16.1). Search results are grouped by domain (People, Gatherings, Stewardship, etc.), never a flat undifferentiated list.

**Quick actions.** A persistent "+" quick-action affordance in the top bar, contents scoped to the signed-in role's most frequent critical actions (Part 2's "Critical actions" per persona) — e.g., a Finance Officer's quick actions are "Verify transaction" and "Record expense"; an Admin's are "Add Person" and "Configure Gathering type." This exists because PRD-cited personas consistently name *time* as their scarcest resource (Resident Pastor, §11.2; Finance Officer, §11.6) — a quick action saves the Domain → Surface → "new record" navigation for the actions a role performs most often.

### 3.2 Mobile navigation

**Global navigation — bottom tab bar, maximum 5 items**, chosen per-persona from the domains that persona actually operates in day to day (Part 2), not a fixed six-domain list — a Shepherd's tab bar looks different from a Finance Officer's, because showing a Shepherd a "Stewardship" tab they rarely touch, at the cost of one-tap access to something they use daily, fails the mobile-first speed principle (Part 1.6):

| Persona | Typical bottom tab bar (max 5) |
|---|---|
| Shepherd | Dashboard · Attendance · Follow-ups · Offering · Profile |
| Ministry Leader | Dashboard · Roster · Events · Profile |
| Finance Officer | Dashboard · Verify · Reconcile · Profile |
| Branch/Resident Pastor | Dashboard · Alerts · Cluster/Branch · Profile |

*Why persona-specific tabs, not one universal set:* this is a deliberate departure from Web Admin's uniform sidebar, justified by the mobile context itself (Part 1.6) — one-handed, brief, standing sessions cannot afford a tab bar with domains the persona doesn't use that day pushing their actual daily tools further away or into an overflow menu.

**Maximum navigation depth: 2 levels below a tab** — Tab → Detail (e.g., "Attendance" tab → a specific Gathering's attendance capture screen). Mobile's offline-first architecture (Part 9) and brief-session design target make a third level a design smell: if a workflow needs it, the workflow should be redesigned, not the navigation deepened.

**Search strategy.** A single search affordance, reachable from the top of the Dashboard tab, same role-scoping rule as Web Admin (PRD §16.1). Mobile search defaults to People (the most common lookup — "find this member") but is filterable by domain.

**Quick actions.** The Dashboard tab itself *is* the quick-action surface on mobile (Part 4) — there is no separate floating quick-action button, because a persona-scoped, ranked dashboard of "what needs my attention" already surfaces the highest-priority action without requiring a second, competing entry point. The one exception is a persistent, always-visible **"Take Attendance"** or **"Record Offering"** primary action button on the Shepherd's Dashboard tab specifically, because NFR-PERF-01's sub-60-second target means this specific action cannot tolerate even a single extra tap of indirection.

**Global vs. context navigation on mobile.** Global navigation is the bottom tab bar; context navigation within a detail screen is a top app bar with, at most, a back action and one contextual action (e.g., "Save," "Escalate") — never a hamburger menu, which hides actions behind an extra tap that Part 1.3's "show the next action" principle exists to prevent.

### 3.3 Domain-to-surface traceability

Every Web Admin and Mobile navigation entry in this section maps to a PRD §16 "Key surfaces" table entry, preserving one-to-one traceability from IA back to requirement:

| Domain | PRD source | Primary Web Admin surfaces | Primary Mobile surfaces |
|---|---|---|---|
| People | §16.1 | Person profile, duplicate resolution queue, reassignment flow | Person profile (read + quick reassign) |
| Pastoral Care | §16.2 | Follow-up queue, Poimen tracker (H2) | **Shepherd's Bacenta dashboard**, follow-up queue |
| Ministry | §16.3 | Basonta roster, staffing gap view (H2) | Roster view, availability self-service (H2) |
| Gatherings | §16.4 | Gathering calendar, attendance completeness report | **Attendance capture screen**, visitor intake form |
| Stewardship | §16.5 | Verification queue, discrepancy queue, reconciliation dashboard, expense workflow | **Offering recording screen**, expense request |
| Insights | §16.6 | Resident Pastor dashboard, Assistant Pastor cluster dashboard, weight configuration (H2) | Shepherd's Bacenta pulse view, alert inbox |

Screens in **bold** are the PRD's own explicitly-named highest-priority mobile surfaces (§16.2, §16.4, §16.5), and receive priority in any phased build sequence for the same reason: they are the surfaces the PRD's persona chapter names as making or breaking the product's core value for the heaviest-touch personas.

---
## Part 4 — Dashboard Philosophy

### 4.1 The one question every dashboard answers

Every Ecclesia dashboard exists to answer exactly one question: **"What needs my attention today?"** This is not a design-team preference; it is the direct interface expression of the product's stated reason for existing. The PRD is explicit that incumbent ChMS products "answer 'what happened?' competently" but "almost never answer 'what should a leader do next?'" (PRD §1) — a statistics-first dashboard *is* the incumbent pattern this product is built to replace. Church Pulse itself was designed "so that a member drifting away is detectable... before the lagging signal... confirms it" (PRD §1) — a dashboard that shows Church Pulse only as a static score, without surfacing the decline as an actionable prompt, has implemented the metric but missed the product's actual point.

**Rule: no dashboard card exists without an implied or explicit next action.** A number alone ("Attendance: 142") is not a dashboard element in this system; "Attendance: 142 (↓ from 168 three weeks ago) — Review Bacenta 12" is. This directly operationalizes FR-INS-05 (PRD §13, Functional Requirements), which requires the system to record whether a leader acted on a prompt — a card with no action has nothing for that mechanism to measure.

### 4.2 Dashboard anatomy (applies to every persona dashboard below)

Every dashboard in this system is built from the same five zones, in the same order, on both Web Admin and Mobile — this consistency is itself the point (Part 1.1):

1. **Priority zone (top).** A ranked, bounded list (never more than 5–7 items visible without a "see all") of what needs attention right now, sorted by urgency/severity, not recency or alphabetical order.
2. **Primary metric zone.** The one number this persona's job-to-be-done centers on (Church Pulse for pastoral roles, reconciliation status for Finance Officer, staffing adequacy for Ministry Leader) — never more than one hero metric, to avoid the vanity-metrics anti-goal (Part 1.9).
3. **Quick actions zone.** The persona's most frequent critical actions (Part 2), one tap/click away.
4. **Recent activity zone.** A short, reverse-chronological log of what has happened in this persona's scope since their last session — answers "what did I miss," distinct from and secondary to the priority zone's "what do I need to do."
5. **Notifications zone.** Persistent but non-intrusive — a badge/inbox pattern (Part 7), not a modal interruption, because interrupting a Shepherd mid-attendance-capture to show a notification directly threatens the sub-60-second target (NFR-PERF-01).

### 4.3 Per-persona dashboard specifications

**Shepherd's Bacenta dashboard** *(PRD §16.2's own naming; "the single most important screen in the product")*

| Zone | Content |
|---|---|
| Priority | Active follow-ups sorted by SLA urgency; silent-drift flags for this Bacenta |
| Primary metric | This Bacenta's Church Pulse score and trend |
| Quick actions | Take attendance · Record offering · Log a pastoral note |
| Recent activity | Last attendance recorded, last offering recorded, last follow-up resolved |
| Notifications | New follow-up assigned, SLA breach warning, Church Pulse decline alert for this Bacenta |
| Church Pulse placement | Primary metric zone, always visible without scrolling — this is the persona for whom the metric is most actionable, since Shepherd is "relationally positioned to reach out" (PRD §11.4) |

**Ministry Leader dashboard**

| Zone | Content |
|---|---|
| Priority | Staffing gaps for upcoming Gatherings (H2), ranked by how soon the event is |
| Primary metric | Staffing adequacy ratio for the next major Gathering |
| Quick actions | Add worker to roster · Set staffing target |
| Recent activity | Roster changes, availability updates |
| Notifications | Staffing gap alert, overcommitment flag (H2) |
| Church Pulse placement | Not primary — Ministry's PRD-defined domain boundary explicitly excludes owning engagement scoring (§16.3); if shown at all, it appears as a secondary, read-only reference, not this dashboard's hero metric |

**Branch Pastor (Assistant Pastor) dashboard** *(see Part 2.3 mapping note)*

| Zone | Content |
|---|---|
| Priority | Every Bacenta in the cluster, ranked by Church Pulse trend (PRD §16.2, §11.3's "ranked list... where I spend my limited time") |
| Primary metric | Cluster-wide Church Pulse trend |
| Quick actions | Open a specific Bacenta's detail · Respond to a Shepherd escalation |
| Recent activity | Escalations received, alerts acted on |
| Notifications | Bacenta Church Pulse decline alert, Shepherd escalation received |
| Church Pulse placement | Primary metric zone, at cluster granularity, ranked — this is literally the PRD's own described replacement for "informal check-ins" (§11.3) |

**Resident Pastor dashboard**

| Zone | Content |
|---|---|
| Priority | Top alerts across all clusters, ranked by severity/trend decline |
| Primary metric | Branch-wide Church Pulse — "the one number that tells me the true health of the church" (PRD §11.2) |
| Quick actions | Forward an alert to the relevant Assistant Pastor (one tap, per the PRD's own representative scenario, §11.2) |
| Recent activity | Appointment-relevant history surfaced contextually (not a full feed) |
| Notifications | Branch-wide Church Pulse decline, weekly reconciliation ready (view-only) |
| Church Pulse placement | Primary metric zone, Branch-wide — the PRD names this explicitly as "the first thing Pastor Emmanuel checks" (§11.2) |

**Finance Officer dashboard**

| Zone | Content |
|---|---|
| Priority | Transactions awaiting verification, ranked oldest-first; flagged discrepancies |
| Primary metric | Reconciliation status for the current week (verified vs. banked) |
| Quick actions | Verify next transaction · Review discrepancy queue |
| Recent activity | Recently verified transactions, recent expense approvals |
| Notifications | New transaction awaiting verification, discrepancy flagged, expense awaiting approval |
| Church Pulse placement | Not shown — Stewardship's domain boundary explicitly forbids exposing line-item financial data to Insights and, symmetrically, Church Pulse is not this persona's job-to-be-done (PRD §16.5, §16.6) |

**Council Dashboard** *(Council Administrator; see Part 2.5 — synthesized, not fully sourced)*

| Zone | Content |
|---|---|
| Priority | Branches with declining Church Pulse trend or configuration drift, ranked |
| Primary metric | Council-wide (cross-Branch) rollup — **[Design decision, Horizon 3]**, consistent with PRD §7.3's G3.1 goal of "consolidated cross-branch visibility with no manual aggregation step" |
| Quick actions | Drill into a specific Branch's own Resident Pastor dashboard |
| Recent activity | Branch provisioning events, cross-Branch configuration changes |
| Notifications | Branch-level Church Pulse decline (aggregated), reconciliation exceptions across Branches |
| Church Pulse placement | Primary metric zone, at Council (cross-Branch) granularity — this is a Horizon 3 surface and should not be built ahead of the underlying Council-consolidation data model (PRD §7.3) |

### 4.4 What is deliberately excluded from every dashboard

- **Raw attendance counts as a hero metric**, anywhere, for any persona — this is the specific incumbent-product pattern (Part 4.1) the product exists to move past. Attendance remains visible (it's a real, necessary number), but never as the largest or first element on a dashboard.
- **Undifferentiated activity feeds** as the top-of-screen element — recent activity is real and useful (zone 4) but is never the priority zone; a feed is not a triage tool.
- **Decorative data visualization** with no threshold or trend meaning attached — every chart on a dashboard exists to show a trend against a threshold (Part 10), not merely to visualize a static snapshot beautifully.

---
## Part 5 — Visual Design Language

Nothing in this Part has a PRD or Blueprint citation — visual language is design-team judgment by nature. Every choice below is made in service of Part 1's stated feel (professional, calm, fast, beautiful, consistent, trustworthy, never overwhelming) and the anti-goals in §1.9, and is marked once here as **[Design decision]** rather than repeated on every line.

### 5.1 Brand personality

Ecclesia's brand personality sits deliberately between two references named in this document's brief — Stripe's calm precision and Notion's warm approachability — because its user base spans a Treasurer reconciling money (Stripe's register) and a volunteer Shepherd checking in on people between full-time-job shifts (Notion's warmth). Four adjectives govern every visual decision:

| Trait | What it means in practice | What it explicitly rules out |
|---|---|---|
| **Composed** | Generous whitespace, restrained color, one focal point per screen | Dense, alarm-heavy dashboards; competing calls to attention |
| **Warm** | Human typography, a color palette with genuine warmth (not clinical blue-and-white), respectful of the product's pastoral subject matter | Corporate-cold enterprise SaaS aesthetics; sterile data-processing feel |
| **Precise** | Sharp alignment, consistent spacing, numbers that are legible and exact | Playful/casual iconography on financial or pastoral-record screens |
| **Quietly confident** | The interface states facts and next actions plainly; it does not oversell itself with decoration | Marketing-style flourishes, gratuitous animation, badge/gamification clutter |

### 5.2 Color system

**Neutral-first, accent-restrained.** The base UI (backgrounds, borders, body text, chrome) is built from a neutral gray scale; color is reserved for status, brand identity, and data visualization — never used decoratively. This is the single biggest lever for "calm, never cluttered" (Part 1).

| Token role | Purpose |
|---|---|
| `color.neutral.0`–`950` | 11-step gray scale (true neutral, not blue-tinted), backgrounds through primary text |
| `color.brand.primary` | Ecclesia's primary brand hue — a deep, warm teal-green, chosen to avoid both "generic SaaS blue" and any single denomination's typical liturgical color associations, while still reading as trustworthy and calm |
| `color.brand.primary.subtle` / `.strong` | Tint and shade steps of the primary, for hover/active/subtle-background states |
| `color.status.success` / `.warning` / `.danger` / `.info` | Reserved exclusively for status meaning (Part 5.10) — never used as arbitrary decorative accents |

Full numeric values are intentionally deferred to the implementation phase (where they will be authored directly as tokens per Part 6's format) rather than fixed here, since color science (contrast ratios against the chosen brand hue) is easier to verify correct in code with automated contrast tooling than to hand-pick in a document. The naming scheme and roles above are the binding part of this specification.

### 5.3 Typography

A single typeface family across both platforms — one for Web Admin and Mobile alike — reinforcing the "learned once, used everywhere" principle (Part 1.1). Recommended: a humanist sans-serif with excellent number legibility and wide language coverage (for the internationalization requirement, Blueprint §14.9) — e.g., Inter or a comparable open-license humanist sans. **Numerals must be tabular (fixed-width) in any table or financial context** so that columns of figures align — a small detail with outsized importance for Treasurer Kofi's reconciliation work (PRD §11.6).

| Token | Use |
|---|---|
| `type.display` | Dashboard hero metrics (Church Pulse score, primary KPI) only — used sparingly, at most once per screen |
| `type.heading.1`–`.3` | Screen titles, section headers |
| `type.body` | Default reading text |
| `type.body.small` / `.caption` | Secondary/metadata text (timestamps, helper text) |
| `type.label` | Form labels, table headers — typically uppercase-tracked, smaller, medium weight |
| `type.numeric.tabular` | Any figure in a table, financial amount, or metric — always tabular-figure variant |

### 5.4 Spacing system

An 8pt base grid (all spacing values are multiples of 4, with 8 as the primary rhythm), expressed as a scale rather than arbitrary pixel values anywhere in the codebase: `space.0` (0) through roughly `space.16` (128px), covering component-internal padding up to page-level section spacing. This is the same discipline the Blueprint applies to its own domain model (explicit, named, finite states rather than ad hoc values) — spacing is a closed vocabulary, not a value any developer picks by eye.

### 5.5 Grid system

- **Web Admin:** 12-column responsive grid, standard breakpoints (Part 6.11). Content max-width capped (readability and scan-speed on wide monitors) rather than stretching every layout edge-to-edge, consistent with the "density with clarity" desktop philosophy (Part 1.7).
- **Mobile:** single-column, 4-column grid available for card/tile layouts (e.g., a grid of quick-action tiles), 16pt outer margin as standard.

### 5.6 Elevation

Three elevation levels only, used to express hierarchy, never decoration: `elevation.0` (flat, default surface), `elevation.1` (cards, dropdowns — subtle shadow), `elevation.2` (modals, popovers — the only level allowed to visually "float" above content with a scrim). A fourth level is deliberately not defined — three is enough to express Ecclesia's flat, calm hierarchy without sliding into skeuomorphic depth.

### 5.7 Borders and corner radius

Borders are 1px, neutral-scale colored, used to separate content regions in preference to shadow wherever both would work (borders read as calmer and more precise than shadow-heavy separation). Corner radius uses a small, consistent scale: `radius.sm` (buttons, inputs, badges), `radius.md` (cards), `radius.lg` (modals, sheets) — moderate rounding throughout (not sharp-cornered enterprise-default, not overly soft/toy-like), consistent with the "composed, quietly confident" brand personality.

### 5.8 Icons

A single icon set, outline-style by default (filled variant reserved for active/selected states only), consistent stroke width across every icon in the system. Icons are never the sole carrier of meaning for a critical action (accessibility requirement, Part 1.5) — every icon-only button has an accessible label and, where space allows, a visible text label as well, especially on Web Admin.

### 5.9 Illustration style

Used sparingly — empty states (Part 7.22) and onboarding only, never as generic decoration on a working screen. Style: simple, geometric, warm-toned line illustration (not photographic, not cartoonish/mascot-driven) — reinforcing "composed" and "precise" over "playful." Illustrations depict abstracted concepts (a calendar, a growing plant for a healthy Church Pulse trend) rather than literal human figures, sidestepping any risk of misrepresenting the real, specific communities Ecclesia serves.

### 5.10 Status colors

A closed, meaning-locked palette used identically everywhere in the product — this consistency is what lets a user learn the system's status language once:

| Status color | Meaning | Example uses |
|---|---|---|
| `status.success` (green) | Verified, reconciled, resolved, on-target | Verified transaction, resolved follow-up, staffing adequacy met |
| `status.warning` (amber) | Needs attention soon, approaching a threshold | Follow-up nearing SLA, Church Pulse trending down but not yet alert-level |
| `status.danger` (red/deep red) | SLA breached, discrepancy, alert-level decline | SLA-breached follow-up, flagged transaction, Church Pulse alert |
| `status.info` (blue) | Neutral, informational | New visitor captured, configuration change logged |
| `status.neutral` (gray) | Inactive, pending, not yet started | Draft, not-yet-recorded, inactive membership |

**Rule: a status color is never reused for anything except status.** Brand color and status color are visually distinct hues specifically so a user never has to disambiguate "is this teal a brand accent or a success state" (Part 5.2's "accent-restrained" principle exists partly to protect this).

### 5.11 Dark mode strategy

Dark mode is supported on both platforms as a first-class, token-driven theme (Part 6.1's tokens are defined as semantic roles, e.g., `color.surface.default`, not literal hex values, specifically so a dark theme is a second value-set for the same token names, not a parallel design system). Dark mode is **not** the default — light mode is, because the primary usage context (a Shepherd standing in a lit room, a Treasurer at a desk) does not skew toward the low-light conditions dark mode is optimized for, and NFR-USA-02's older-user accessibility requirement is generally better served by a light, high-contrast default. Contrast ratios (Part 1.5) are independently verified for the dark theme, not merely inverted from light-theme values.

### 5.12 Accessibility requirements (visual)

Every rule from Part 1.5 applies to every visual decision above without exception — status color is never the *only* signal (an icon or label always accompanies a status color, for users with color vision deficiency); text on any brand or status background meets the 4.5:1 contrast floor; and no visual pattern in this Part (illustration, iconography, elevation) may be used in a way that substitutes for, rather than supplements, a text or semantic signal.

---
## Part 6 — Design Tokens

Design tokens are the literal implementation of Part 1.1's "one screen, one job, one shared vocabulary" — they are the single source of truth that both `apps/web-admin` and `apps/mobile` will consume, in whatever platform-native format each needs (CSS custom properties / Tailwind theme for Web, a JS theme object for React Native), generated from one shared token definition rather than hand-maintained twice. Nothing in this Part is sourced from the PRD or Blueprint; it is this document's design specification, written so precisely that the implementation phase can transcribe it directly rather than re-deciding it.

### 6.1 Naming convention

All tokens follow a three-to-four-level dot path: `category.role.variant.state`. Category and role are always semantic (what the token *means*), never literal (what it *looks like*) — this is what makes dark mode (Part 5.11) a second value set rather than a second design system, and what lets a future rebrand change values without renaming a single component prop.

```
color.surface.default          not   color.white
color.surface.raised
color.text.primary             not   color.gray900
color.text.secondary
color.text.inverse
color.border.default
color.status.success.foreground
color.status.success.background
color.brand.primary.default / .hover / .active / .disabled
```

### 6.2 Color tokens

| Token | Role |
|---|---|
| `color.surface.default` | Page/screen background |
| `color.surface.raised` | Card, panel background |
| `color.surface.overlay` | Modal/sheet scrim |
| `color.text.primary` / `.secondary` / `.disabled` / `.inverse` | Text hierarchy |
| `color.border.default` / `.subtle` / `.focus` | Borders and focus rings |
| `color.brand.primary.default` / `.hover` / `.active` / `.disabled` | Primary brand actions |
| `color.status.{success,warning,danger,info,neutral}.foreground` / `.background` / `.border` | Status system (Part 5.10) — foreground/background pairs pre-verified to meet 4.5:1 contrast |

### 6.3 Spacing tokens

`space.0` (0px) · `space.1` (4px) · `space.2` (8px) · `space.3` (12px) · `space.4` (16px) · `space.5` (20px) · `space.6` (24px) · `space.8` (32px) · `space.10` (40px) · `space.12` (48px) · `space.16` (64px) — the 8pt-rhythm scale from Part 5.4, expressed as tokens. Component internal padding uses `space.2`–`space.4`; section/page spacing uses `space.6`–`space.16`.

### 6.4 Sizing tokens

`size.icon.sm` (16px) / `.md` (20px) / `.lg` (24px) — icon dimensions matched to adjacent text size. `size.touchTarget.min` (44px, iOS) / (48px, Android) — the accessibility floor from Part 1.5, referenced directly by every interactive component's minimum hit-area in Part 7. `size.avatar.sm/md/lg` for Person avatars across contexts (list row vs. profile header).

### 6.5 Typography tokens

Each typography token bundles family, size, line-height, weight, and letter-spacing as one unit (not four separate tokens a developer must remember to combine correctly):

`type.display` · `type.heading.1` / `.2` / `.3` · `type.body` · `type.body.small` · `type.caption` · `type.label` · `type.numeric.tabular` — matching the roles defined in Part 5.3.

### 6.6 Elevation tokens

`elevation.0` (none) · `elevation.1` (card/dropdown shadow) · `elevation.2` (modal/popover shadow) — matching Part 5.6's three-level system exactly; no fourth value exists by design.

### 6.7 Animation and motion tokens

| Token | Value (target) | Use |
|---|---|---|
| `motion.duration.fast` | 100–150ms | Micro-interactions: button press, toggle, checkbox |
| `motion.duration.standard` | 200–250ms | Component transitions: dropdown open, tab switch |
| `motion.duration.slow` | 300–400ms | Screen/sheet transitions, modal open |
| `motion.easing.standard` | ease-out | Default for most transitions |
| `motion.easing.emphasized` | ease-in-out | Modal/sheet entrance-exit |
| `motion.reduceMotion` | boolean, OS-driven | When true, all durations collapse to near-zero and transform-based motion is replaced with a simple opacity crossfade — implements Part 1.5's motion-sensitivity accessibility rule |

Motion in Ecclesia is functional, never decorative (Part 1.9's anti-goal against unearned flourish): every motion token exists to communicate a state change (this opened, this was dismissed, this reordered), never to entertain.

### 6.8 Border radius tokens

`radius.sm` (4px) — buttons, inputs, badges. `radius.md` (8px) — cards. `radius.lg` (12px) — modals, bottom sheets. `radius.full` (9999px) — avatars, pill badges. Matches Part 5.7.

### 6.9 Opacity tokens

`opacity.disabled` (0.4) · `opacity.overlay` (0.5, for modal scrims) · `opacity.hover` (0.08, for subtle hover-state background tints layered over `color.brand.primary` or `color.text.primary`) · `opacity.pressed` (0.16).

### 6.10 Z-index tokens

A closed, small scale — new UI must fit one of these layers, never an arbitrary in-between value:

`z.base` (0) · `z.stickyHeader` (10) · `z.dropdown` (20) · `z.overlay` (30) · `z.modal` (40) · `z.toast` (50) — toasts always render above modals, since a save-confirmation or error toast must remain visible even if a modal is open above the base content.

### 6.11 Responsive breakpoints (Web Admin)

| Token | Width | Target |
|---|---|---|
| `breakpoint.sm` | 640px | Narrow window / tablet portrait — not a primary target, but must not break |
| `breakpoint.md` | 1024px | Tablet landscape / small laptop — sidebar may collapse to icon-only |
| `breakpoint.lg` | 1280px | Standard laptop/desktop — primary design target (Part 1.7) |
| `breakpoint.xl` | 1536px | Wide monitor — content max-width caps here (Part 5.5), extra space becomes margin, not stretched content |

Mobile does not use these breakpoints; it targets a single-column layout across the realistic device range (Blueprint NFR-PERF-02's "mid-tier Android device" baseline through modern flagship devices) with fluid, not breakpoint-based, scaling.

### 6.12 Token governance

Tokens are versioned and reviewed the same way as any other shared contract in this codebase — see Part 12 for the full governance model. No component (Part 7) may use a raw, non-token value (a literal hex code, an arbitrary pixel value) for anything this Part defines a token for; this is the enforceable rule a linter can check once implementation begins, mirroring how `libs/rbac`'s permission matrix is enforced as an executable specification rather than a convention (Blueprint §9.5).

---
## Part 7 — Component Library

Every component below is built once against the tokens in Part 6 and consumed identically by Web Admin and Mobile wherever the platform allows (some, like Command Palette, are Web Admin-only by nature; this is noted per component). This is the concrete mechanism behind the brief's "every screen built once, consistently" goal: a screen is a composition of these components plus domain content, never a one-off layout.

### 7.1 Buttons

**Purpose.** The primary mechanism for triggering an action. **Variants.** `primary` (one per screen — the single undisputed action, Part 1.3), `secondary` (outlined), `tertiary`/`text` (low-emphasis, e.g., "Cancel"), `danger` (destructive actions — reassignment, rejection, deletion — always `color.status.danger`), icon-only (always with accessible label). Sizes: `sm`/`md`/`lg`. **Behavior.** Shows a loading spinner and disables itself on press for any action with a network round-trip, preventing double-submission (directly relevant to financial actions, Part 8.2). **Accessibility.** Meets the `size.touchTarget.min` floor even where the visible button is smaller (invisible padding extends the hit area); icon-only buttons always carry an `accessibilityLabel`/`aria-label`. **Usage.** Never more than one `primary` button visible in a given view at once — a second important action is `secondary`, not a second `primary`.

### 7.2 Cards

**Purpose.** Groups related content and, on a dashboard, represents one priority or metric item. **Variants.** `default` (elevation.1), `interactive` (adds hover/press state, used when the whole card is tappable — e.g., a dashboard priority-zone item), `flat` (elevation.0, used inside already-elevated containers like modals). **Behavior.** An `interactive` card's entire surface is the tap target, not just its title, to reduce mis-taps on mobile (touch-target guidance, Part 1.5). **Accessibility.** Interactive cards are a single semantic control (button/link role), not a `div` with a click handler, so screen readers announce them correctly. **Usage.** Cards never nest inside other cards more than one level deep.

### 7.3 Forms

**Purpose.** The container and validation pattern for any data-entry screen. **Variants.** `single-step` (the default — matches "progressive disclosure," Part 1.4), `multi-step` (used only where the underlying workflow is genuinely sequential, e.g., an expense request with attachment). **Behavior.** Inline, field-level validation on blur (not only on submit); a clear, field-adjacent error message, never a top-of-form-only error summary as the sole feedback. Autosave behavior is defined in Part 8.6. **Accessibility.** Every field has a visible, associated `<label>`; error messages are programmatically associated with their field (`aria-describedby` / mobile equivalent) so a screen-reader user hears the error when the field is focused, not only visually. **Usage.** A form's required fields are the minimum needed to act (Part 1.4); optional fields are visually de-emphasized and clearly marked optional, not the reverse.

### 7.4 Inputs

**Purpose.** Single-line and multi-line text/number entry. **Variants.** `text`, `number` (always `type.numeric.tabular`), `currency` (locale-aware formatting, relevant to every Stewardship amount field), `phone`, `textarea` (pastoral notes, rejection rationale). **Behavior.** Currency and number inputs never allow a value the domain layer would reject (e.g., negative offering amounts) — client-side validation mirrors, but never replaces, server-side validation. **Accessibility.** Placeholder text is never the only label (placeholders disappear on input and are frequently skipped by screen readers). **Usage.** Currency inputs always display the currency unit adjacent to the value, never assumed from context alone.

### 7.5 Checkboxes and toggles

**Purpose.** Binary and multi-select choices. **Variants.** `checkbox` (multi-select, e.g., selecting several Persons for a bulk action), `radio` (single-select from a small set), `switch`/`toggle` (an immediate-effect binary setting, e.g., a configuration flag — distinct from checkbox specifically because a switch takes effect immediately with no separate "Save," while a checkbox inside a form does not). **Behavior.** A `switch` always shows its new state immediately and is itself the confirmation — no separate save action, consistent with Part 8.5's saving-indicator rules. **Accessibility.** Both the control and its label are tappable as one unit (larger effective hit area). **Usage.** Never use a `switch` inside a multi-field form that itself requires an explicit Save — that mixes two different commit models on one screen and will confuse users about whether their change is already saved.

### 7.6 Tables

**Purpose.** Structured, comparable, high-density data display — the Finance Officer's and Admin's primary tool (Part 1.8's "high, structured density" standard). **Variants.** `default` (Web Admin, full-featured: sort, filter, pagination), `compact-list` (Mobile's row-based equivalent — never a literal scrollable-both-directions table on Mobile). **Behavior.** Full table behavior rules are specified in Part 8.2. **Accessibility.** Proper table semantics (`<table>`/`role="table"` with headers programmatically associated to cells) on Web Admin; on Mobile, each "row" is a self-contained, individually accessible list item exposing the same fields as labeled text, not a cropped table. **Usage.** A table's default sort always matches the persona's most common need (e.g., the verification queue defaults to oldest-first, since FIFO processing is the Finance Officer's actual workflow, PRD §11.6).

### 7.7 Navigation (sidebar, top bar, tabs)

**Sidebar (Web Admin global nav, Part 3.1).** Purpose: persistent domain-level navigation. Variants: expanded (default) and icon-only-collapsed (at `breakpoint.md` and below). Behavior: the active domain is always visually distinct (background tint + text weight, never color alone). Accessibility: implemented as a `nav` landmark with a current-page indicator (`aria-current`).

**Top bar (both platforms).** Purpose: screen title, back/context action, and (Web Admin) global search + quick action + notification bell. Behavior: sticky on scroll; never grows taller than a single row on mobile, to preserve vertical space for content.

**Tabs.** Purpose: context navigation within a domain (Part 3.1) or switching between related views of the same record (e.g., a Person's Profile / History / Notes tabs). Behavior: tab state persists in the URL on Web Admin (so a link/refresh returns to the same tab), and the active tab is always visible without horizontal scroll for the primary tab set (max 5 tabs before requiring an overflow pattern). Accessibility: proper `tablist`/`tab`/`tabpanel` roles, arrow-key navigation on Web Admin.

### 7.8 Modals and dialogs

**Purpose.** Modal: a focused sub-task that must complete or cancel before returning to the parent screen (e.g., "Add Person"). Dialog: a short, single-decision confirmation (Part 8.3 governs when a dialog is required). **Variants.** `modal` (elevation.2, up to `radius.lg`, scrim at `opacity.overlay`), `dialog` (smaller, centered, no scroll), `bottom-sheet` (Mobile's equivalent of a modal — respects one-handed reachability, Part 9). **Behavior.** Focus is trapped within an open modal (Web Admin) and returned to the triggering element on close; `Esc` and scrim-click both dismiss a non-destructive modal, but a destructive-action dialog requires an explicit button press, never a dismiss-by-accident path. **Accessibility.** `role="dialog"`/`aria-modal="true"`, labelled by its heading. **Usage.** Never stack a second modal on top of an open modal — a workflow needing that should be redesigned as a multi-step form (Part 7.3) instead.

### 7.9 Badges

**Purpose.** A small, inline status or count indicator. **Variants.** `status` (uses Part 5.10's five status colors exclusively, always paired with a text label — never a bare colored dot for anything critical), `count` (e.g., unread notifications), `label` (neutral, e.g., a role or category tag). **Accessibility.** Count badges expose their number to assistive technology, not just visually (a badge showing only a colored dot with a screen-reader-invisible count fails NFR-USA-02's spirit). **Usage.** A badge is never the sole means of conveying an urgent state — SLA-breach urgency (Part 8) is always also reflected in the item's position (priority-zone ranking, Part 4.2), not badge color alone.

### 7.10 Charts

Specified in full in Part 10 (Data Visualization); the component-library entry here covers only cross-cutting rules: every chart uses the token-defined status/brand colors exclusively (never an arbitrary chart-library default palette), every chart has a text-equivalent summary available to screen readers (a sparkline is never the only way to learn "this trended down 15% over 3 weeks" — that sentence is always present as real text somewhere on screen, matching the PRD's own alert-copy style, §11.2), and no chart uses 3D or non-linear-axis effects that would misrepresent a trend.

### 7.11 Avatars

**Purpose.** Represents a Person compactly in lists, headers, and assignment contexts (reinforcing "Relationships Matter," Part 1.2). **Variants.** Photo (where available), initials-fallback (deterministic color derived from the person's name, from a small accessible palette — not the full status-color set, to avoid confusion with status meaning), size `sm`/`md`/`lg` per Part 6.4. **Accessibility.** Always paired with the person's name as text nearby or in an accessible label — an avatar is never the sole identifier.

### 7.12 Notifications

**Purpose.** Time-sensitive information requiring awareness, not necessarily immediate action. **Variants.** `toast` (transient, e.g., "Attendance saved" — auto-dismisses, `z.toast`), `inbox item` (persistent until read/dismissed — SLA breaches, Church Pulse alerts), `badge count` (Part 7.9, on the nav bell/tab icon). **Behavior.** A `toast` never blocks interaction and never carries a destructive action's only confirmation (destructive confirmations are always a `dialog`, Part 7.8). Push notifications (Mobile) respect the same status-color/urgency model as in-app notifications, so a push about an SLA breach and its in-app equivalent are visually and textually consistent. **Accessibility.** Toasts are announced via a live region (`aria-live="polite"`, or `assertive` for error toasts) so screen-reader users don't miss transient confirmations.

### 7.13 Date picker

**Purpose.** Selecting a single date, date range, or recurring pattern (relevant to Gathering scheduling, PRD §16.4). **Variants.** `single-date`, `range`, `recurrence-pattern` (a structured, not free-text, way to define a recurring Gathering series). **Behavior.** Defaults to the most likely date for context (e.g., today for attendance capture, next occurrence for a recurring Gathering) rather than an empty field — matching Part 1.4's "defaults do the work" principle. **Accessibility.** Fully keyboard-operable on Web Admin (arrow keys move between days); Mobile uses the platform-native date picker where it meets the same accessibility bar, rather than a custom control, to preserve users' existing OS-level familiarity.

### 7.14 Search

**Purpose.** Cross-domain, role-scoped lookup (Part 3.1, 3.2). **Behavior.** Debounced-as-you-type results, grouped by domain, with the role's permission scope applied server-side (never filtered only client-side, which would briefly expose out-of-scope results during the request). **Accessibility.** Results are announced to screen readers as they update (`aria-live="polite"`, throttled to avoid over-announcing on every keystroke). **Usage.** Empty search state and no-results state are both explicit, designed states (Part 7.22), never a blank white area.

### 7.15 Pagination

**Purpose.** Bounding table/list result sets. **Variants.** `page-numbered` (Web Admin tables — Treasurer-style reconciliation work benefits from "page 3 of 12" orientation), `infinite-scroll`/`load-more` (Mobile lists — matches one-handed, glance-based mobile usage better than numbered pages, Part 9). **Behavior.** Page size is a token-consistent default (e.g., 25 rows) across every Web Admin table, not decided per-screen.

### 7.16 Filters

**Purpose.** Narrowing a table or list (e.g., the Gathering calendar filterable by type and Group, PRD §16.4). **Variants.** `inline` (a filter bar above the content, Web Admin default), `sheet` (a Mobile bottom-sheet filter panel, to preserve screen space for content). **Behavior.** Active filters are always visible as removable chips/tags, never hidden inside a closed filter panel once applied — a user should never be confused about why a list looks shorter than expected.

### 7.17 Command palette *(Web Admin only)*

**Purpose.** Keyboard-first power-user navigation and action-triggering (`Cmd/Ctrl+K`), for the Web Admin personas (Finance Officer, Admin, Pastors) who work in extended desktop sessions (Part 1.7). **Behavior.** Combines global search (Part 7.14) and quick actions (Part 3.1) in one interface; fuzzy-matches against screen names, records, and actions the current role can perform. **Accessibility.** Fully keyboard-operable by definition; also mouse-usable for discoverability. **Usage.** Not built for Mobile — mobile's Dashboard-as-quick-action-surface (Part 3.2) serves the equivalent purpose within that platform's interaction model.

### 7.18 Empty states

**Purpose.** What a list, table, or dashboard zone shows when it has no content — a designed state, not a blank gap. **Variants.** `no-data-yet` (e.g., a new Bacenta with no attendance history — encouraging, with a clear first action), `no-results` (a search/filter returned nothing — offers a way to clear filters), `all-clear` (a priority zone with genuinely nothing needing attention — this is a *good* state and should read as calm reassurance, e.g., "Nothing needs your attention today," not as a broken or empty screen). **Usage.** `all-clear` states matter specifically because Part 4's priority-zone-first dashboard design means an empty priority zone is common and good news — it must never look like an error or a loading failure.

### 7.19 Loading states

**Purpose.** Communicating in-progress work without blocking comprehension. **Variants.** `skeleton` (structural placeholder matching the eventual content's layout — default for initial screen loads), `spinner` (small, inline — button loading state, Part 7.1), `progress bar` (determinate, used for known-duration operations like a multi-record sync). **Behavior.** Skeletons never appear for less than ~150ms of actual load time (a flash of skeleton on an instant load is itself a visual glitch) and never persist past ~10 seconds without escalating to a message ("This is taking longer than usual") — silence beyond that threshold reads as broken, not fast.

### 7.20 Error states

**Purpose.** Communicating failure with a path forward, never a dead end. **Variants.** `inline field error` (Part 7.3), `screen-level error` (e.g., failed to load a dashboard — offers Retry), `full failure` (e.g., no connectivity and no cached data available — explains why and what to do, distinct from the offline states in Part 9). **Behavior.** Every error state names, in plain language, what happened and what the user can do next (never a raw error code or stack trace) — directly consistent with NFR-USA-01's no-training-required standard (PRD §14.8). **Accessibility.** Error messages are announced via `aria-live="assertive"`.

---
## Part 8 — UX Rules

Universal rules that apply across every screen and domain, regardless of persona — the "constitution" for interaction design the way PRD §6's principles are the constitution for product decisions.

### 8.1 Maximum clicks/taps to important actions

| Action class | Maximum interactions from app open |
|---|---|
| A Shepherd's "Take Attendance" | 2 taps (open app → tap primary Dashboard action) — directly protects NFR-PERF-01's sub-60-second target, since every extra tap is time subtracted from that budget |
| Any persona's top-priority-zone item action | 1 tap/click from the Dashboard |
| Any domain's primary create action (new Person, new transaction) | 2 clicks/taps (nav or quick action → form) |
| Any secondary/administrative action (e.g., editing a configuration value) | 3 clicks/taps is acceptable — these are not time-pressured, in-the-moment actions |

### 8.2 Table behavior

Every Web Admin table (Part 7.6) defaults to the sort order matching its persona's actual workflow (Part 7.6's example: verification queue defaults oldest-first). Column sort is always available and always shows current sort direction visually and via `aria-sort`. Row-level actions (verify, flag, escalate) are always visible on hover/focus, never hidden behind a secondary menu when there is room to show them directly — an extra menu-open step on a Finance Officer's highest-frequency action would violate §8.1's action-cost discipline. Bulk selection (checkbox column) is available wherever a bulk action legitimately exists (e.g., bulk-reassigning several Persons) and never offered where no bulk action exists, to avoid a dead-end affordance.

### 8.3 Confirmation dialogs

A confirmation dialog (Part 7.8) is required only for actions that are **destructive, hard to reverse, or carry accountability weight** — not for routine saves, which use Part 8.5's saving indicator instead. This list is closed and traceable:

| Requires confirmation | Reasoning |
|---|---|
| Rejecting an expense request | Requires mandatory rationale on rejection per PRD §16.5 — the dialog is where that rationale is captured |
| Flagging a financial transaction as a discrepancy | Financial accountability action (PRD §11.6) |
| Reassigning a Person's Bacenta/Basonta | Requires a reason code per PRD §16.1 — captured in the same dialog |
| Closing/escalating a follow-up task | Changes SLA state and notifies other roles |
| Any Admin/Council Administrator configuration change with Branch-wide effect | High blast radius — a mistaken configuration change is hard to notice quickly given RISK-12's observation that the Admin role is often a single volunteer whose unavailability already stalls routine changes (PRD §20); a confirmation step reduces the chance of a mistake this persona alone may be slow to catch or reverse. **[Design decision, reasoning extends beyond RISK-12's literal text]** |
| Deleting any record (rare — most domains close/archive rather than delete, per the Blueprint's append-only philosophy, Blueprint §7.4–7.5) | Irreversible by definition where it exists at all |

Routine actions explicitly **excluded** from confirmation (to avoid the "are you sure?" fatigue that trains users to click through dialogs without reading them): recording attendance, recording an offering (reversible via a subsequent correction workflow, not a raw delete), saving a form, adding a roster member.

### 8.4 Undo behavior

Where an action is reversible by nature (most non-financial, non-audited actions), Ecclesia prefers an **undo toast** (Part 7.12: a toast with an "Undo" action, live for ~6–8 seconds) over a confirmation dialog — this is a deliberate, stated trade-off: undo preserves speed for the common case (NFR-PERF-01) while still protecting against mistakes, whereas a confirmation dialog protects against mistakes at the cost of speed for every single action, including the 99% that weren't mistakes. Financial and audit-relevant actions (§8.3's list) do not get undo — they get a confirmation dialog instead, because those actions must produce a deliberate, attributable audit trail (Blueprint §7.4), and a silent "undo" would itself be an unaudited state change.

### 8.5 Saving indicators

Every write action shows one of three states, always in the same location relative to the action (near the field or the primary button, never only in a far-off corner of the screen): `saving…` (in-progress), `saved` (brief, auto-dismissing confirmation — typically the Part 7.19 button loading state resolving, plus a toast for standalone forms), or an inline error (Part 7.20) if the save failed, with the entered data preserved on screen, never cleared on failure. A user must never wonder whether their attendance record or offering entry actually saved — this is a direct design response to RISK-02's named fear of Shepherd disengagement from an untrustworthy tool (PRD §20).

### 8.6 Autosave

Multi-field forms with no natural "one action" commit point (e.g., a long pastoral note, a multi-field configuration screen) autosave on a debounced interval (~2 seconds after the last keystroke) plus on field blur, with the Part 8.5 saving indicator reflecting autosave state continuously. Forms with a clear single commit action (attendance capture's "Save," an offering record) do **not** autosave partial state as if it were final — they use the explicit save flow instead, because a half-completed attendance record silently persisting as if final would corrupt the very data Church Pulse depends on (PRD §12.8).

### 8.7 Offline behavior

Full mobile offline architecture is specified in Part 9; the universal rule here is that **any screen capable of being used offline must visually indicate offline status and queued-write state at all times**, not only at the moment of failure — a persistent, calm (not alarming) connectivity indicator, plus a visible count of "queued, not yet synced" records wherever they exist, so a Shepherd always knows whether their attendance record has actually reached the server or is still local (directly serving US-D2's requirement (PRD §18, User Stories) that offline recording "never causes me to lose the record or skip recording it").

### 8.8 Search

Search (Part 7.14) always shows results as the user types (debounced), always shows which domain each result belongs to, and always respects the role-scoping rule (PRD §16.1) with no client-side-only filtering of otherwise-fetched out-of-scope data.

### 8.9 Keyboard shortcuts (Web Admin)

A small, consistent set, discoverable via the Command Palette (Part 7.17): `Cmd/Ctrl+K` (command palette / search), `Esc` (close current modal/panel), `Cmd/Ctrl+S` (save, where a form has an explicit save action) — Ecclesia does not attempt an exhaustive power-user shortcut system in v1; it defines a small, memorable set rather than a large, forgettable one, consistent with the "simplicity principles" in Part 1.4.

### 8.10 Accessibility (cross-cutting)

Every rule in Part 1.5 and Part 5.12 applies to every interaction, without a persona- or screen-specific exception. A configuration screen used only by the Admin/Council Administrator persona is not exempt from WCAG 2.1 AA merely because that persona is assumed more technical (§11.9's own persona description) — accessibility is a property of the product, not a concession made only for personas presumed to need it.

### 8.11 Consistency rules

- A given icon means the same thing everywhere it appears; a given status color means the same thing everywhere it appears (Part 5.10) — no domain-specific exception.
- The five-zone dashboard anatomy (Part 4.2) is never reordered or partially omitted per persona — zones may be empty (Part 7.18's `all-clear` state) but the structure itself is fixed.
- A component's variant set (Part 7) is exhaustive for that component; a screen needing a visual treatment outside a component's defined variants is a signal to propose a new variant through governance (Part 12), not to one-off a bespoke element.
- Copy tone is consistent across the product: plain, respectful, never alarmist even for danger-status content (an SLA breach is described factually — "This follow-up is 2 days past its due date" — never with exclamation-driven urgency language), matching the "calm, trustworthy" brand personality (Part 5.1). Insights/Church Pulse copy carries an additional, specifically-sourced rule — see Part 11.2's treatment of RISK-07 (PRD §20).

---
## Part 9 — Mobile Experience

The mobile experience is designed for one recurring physical reality named directly by this document's brief and backed by the PRD's own persona data: **a pastor or Shepherd standing, mid-meeting, phone in one hand, with an unpredictable connection.** Every workflow below is designed against that condition as the default case, not the edge case (Part 1.6).

### 9.1 Attendance

**Design target:** sub-60-second completion for a ~20-person Bacenta meeting (NFR-PERF-01, PRD §14.8, an explicit release gate per RISK-02's mitigation, §20). Screen opens directly to a pre-populated roster (never a blank form, PRD §16.4) with large, tap-to-mark-present rows — no per-person navigation, no confirmation step per person. A single "Save" commits the whole roster at once, with the Part 8.5 saving indicator confirming the write (or queuing it, §9.6). Absent members are visually distinguished but not require any extra step to leave as absent — absence is the unmarked default, presence is the one deliberate action per row, minimizing total taps for the common case (most attendees present).

### 9.2 Visitors

Digital replacement for the paper visitor card (PRD §16.1, §11.8) — minimal required fields at capture (name, phone, how they heard about the church), everything else completable later by whoever is best positioned (PRD §16.1's own stated minimal-field set). Designed to be handed to the visitor directly or completed by an usher on their behalf, both via the same form — no separate "self-serve" vs. "usher-entry" mode, since the field set is identical for both.

### 9.3 Follow-up

The follow-up task queue (PRD §16.2), sorted by SLA urgency by default (§8.2's table-behavior rule), with each task's status color (Part 5.10) immediately visible. Resolving a follow-up is a single tap plus, where relevant, a brief outcome note — not a multi-screen workflow, since the Shepherd persona's time constraint (Part 2.1) applies here exactly as much as it does to attendance.

### 9.4 Giving (offering recording)

Fast entry immediately after a Bacenta meeting, mobile-first and offline-capable (PRD §16.5, NFR-OFF-01) — a Shepherd records the collected total (and, where the church's configuration requires it, a per-category breakdown) with the currency input component (Part 7.4), defaulting to the current Gathering context so no manual date/Bacenta lookup is required. This is explicitly named in the PRD as the task most likely to be skipped if not fast enough, "while he is tired and the meeting ran long" (PRD §11.4) — every design decision here is weighted toward minimizing friction over maximizing configurability.

### 9.5 Pastoral notes

A restricted, permission-gated capture flow (NFR-PRIV-01, PRD §16.2) for a Shepherd or Pastor to record a private note against a Person's care history. Designed as a simple text-entry screen (Part 7.4's `textarea`) with autosave (Part 8.6, since a note has no single natural "done" point) rather than a rigid structured form — pastoral observations don't fit a schema the way attendance does, and forcing one would work against "People Before Data" (Part 1.2).

### 9.6 Offline mode

Directly implementing the Blueprint's offline-authentication design (Blueprint §8.4) and NFR-OFF-01/02: attendance and offering capture (and, by extension, follow-up resolution and pastoral notes) all function fully offline, queuing writes locally, stamped with the cached user identity, and are **not treated as authoritative until the server re-validates them at sync time** — the interface must never imply an offline write is "done" in the same sense an online write is; it is "recorded, pending sync," a visibly distinct state (Part 7.9's badge system, Part 8.7).

**Offline UX rules:**
- A persistent, calm connectivity indicator (not an alarming red banner) is visible at all times the app is in a state where offline capture matters.
- Every queued-but-unsynced record is visibly marked as such (a "pending sync" badge, Part 7.9) everywhere it appears, until sync confirms it.
- The user is never blocked from continuing to work because of a pending sync — queued writes accumulate and sync opportunistically.
- If the offline grace period is exceeded (the refresh token has expired, Blueprint §8.4) and re-authentication is required before sync, **queued data is preserved locally, never discarded**, and the interface explains this state in plain language (Part 7.20's error-state standard) rather than silently failing.

### 9.7 Synchronization

On reconnection, the client attempts a token refresh, then submits queued writes under the refreshed token, each passing through the same server-side authorization check an online-created request would (Blueprint §8.4) — from the UX's perspective, sync is a background process the user is informed about (a brief "Syncing 3 records…" state, using the Part 7.19 progress-bar variant for a known, small, countable queue) but never made to wait on, consistent with "the user is never blocked" (§9.6). A sync conflict or rejected record (rare, but possible if server-side validation differs from the client's optimistic check) surfaces as a specific, actionable error (Part 7.20) — never a silently dropped record.

### 9.8 One-handed operation

All primary actions on ministry-facing mobile screens (attendance rows, the Save button, quick actions) are reachable within the bottom two-thirds of the screen — the thumb-reachable zone for one-handed phone use — rather than requiring a reach to the top of the screen. This is why Mobile's primary action pattern (§3.2) favors a bottom-anchored "Take Attendance"/"Record Offering" button over a top-app-bar action, and why the bottom tab bar (§3.2), not a top or side nav, is Mobile's global navigation pattern.

### 9.9 Fast entry

Every mobile capture form in this Part shares the same fast-entry disciplines: numeric keypads auto-invoked for numeric fields (no generic keyboard requiring a manual switch), the roster/list pre-populated rather than searched from scratch, sensible defaults pre-filled (today's date, the current Gathering, the previous week's offering category breakdown as a starting point), and a single, unambiguous primary action per screen (Part 1.3) so a user under time pressure never has to read the screen to find out what to do next.

---
## Part 10 — Data Visualization

Every visualization standard here exists to serve Part 4's core rule — a chart shows a trend against a threshold, in service of a decision, never data for its own sake (Part 1.9's anti-goal against vanity metrics applies with full force to this Part).

### 10.1 Church Pulse

**Primary representation:** a single score (0–100, per FR-INS-01, PRD §13, Functional Requirements) shown as a large numeral (`type.display`, Part 5.3) with a trend line beneath it, never a gauge/dial or traffic-light-only representation — a trend line answers "is this getting better or worse," which is the question the PRD identifies as the one that actually matters (PRD §1's critique of attendance-only, point-in-time metrics). Trend line covers the trailing window the score itself is computed over (a 4-week trailing average at the congregation level, PRD §12.8, Church Pulse computation model) plus enough history before it to show direction. A decline beyond the configured alert threshold (FR-INS-03) is visually marked directly on the trend line (a shaded threshold band or marker), not merely implied by the line's slope — a user should be able to see *why* an alert fired, not just that one did.

### 10.2 Attendance

Represented as a simple bar or line chart per Gathering instance or per week, always shown alongside — never as a substitute for — Church Pulse, specifically because the PRD is explicit that attendance alone is a "lagging, partial indicator" that "can mask disengagement" (PRD §8.1). Any screen showing an attendance chart in a leadership context also shows the Bacenta-participation or Church-Pulse figure nearby, so attendance is never presented as if it were the whole picture.

### 10.3 Giving

Shown in aggregate only (weekly/monthly totals, verified vs. banked) in any leadership-facing chart — individual giving history is a Person-scoped, permission-gated view only (matching Stewardship's domain boundary against exposing line-item financial data to Insights, PRD §16.5), never rolled into a chart a Pastor or Assistant Pastor browses casually. A giving trend chart uses the `status.warning`/`status.danger` bands only for reconciliation-relevant thresholds (e.g., a discrepancy rate), never to imply moral judgment about giving levels.

### 10.4 Retention, growth, and engagement

Cohort/funnel-style visualization for the member journey (Visitor → First-Time Guest → Follow-up → Assigned to Bacenta, PRD §16.2, §11.8) — a horizontal funnel or stage-bar showing how many people are at each stage and, critically, the conversion rate between stages (PRD §8.2's "Visitor-to-Member conversion rate" metric), so a Resident Pastor or Assistant Pastor can see *where* the funnel leaks, not just the final count.

### 10.5 Silent drift

Represented primarily as a **flag list**, not a chart — silent drift is fundamentally a per-Person, actionable alert (PRD §15.8's decision tree, §11.4's representative scenario), and forcing it into an aggregate chart would obscure exactly the individual, relational information that makes it useful to a Shepherd. Where an aggregate view is useful (an Assistant Pastor's cluster-wide count of currently-flagged members, to gauge overall cluster health), it is a simple count/badge, always with a direct link into the underlying flag list — never a chart presented as if it were the actionable surface itself.

### 10.6 Follow-up

Represented as the task queue itself (Part 9.3), with an optional aggregate view (for Assistant Pastor/Resident Pastor) showing SLA-compliance rate over time as a simple trend line — again in service of a question ("are follow-ups being completed on time, trending better or worse") rather than as decoration.

### 10.7 Charts, trend lines, and heat maps — cross-cutting standards

| Standard | Rule |
|---|---|
| Chart type default | Line chart for anything trend-over-time (Church Pulse, attendance, SLA compliance); bar chart for anything comparative-at-a-point-in-time (staffing adequacy across Basontas this week); funnel for stage-based conversion (member journey) |
| Heat maps | Used only for genuinely two-dimensional comparative data (e.g., a Council Administrator's cross-Branch, cross-week reconciliation-exception grid — Horizon 3, §2.5) — never used as a decorative substitute for a simpler chart type when the underlying data is one-dimensional |
| Color | Status colors only (Part 5.10) — a chart's "good" direction is always `status.success`-toned, "bad" direction `status.danger`-toned, with no chart using an arbitrary, meaning-free color scheme |
| Text equivalence | Every chart's key takeaway exists as a plain-language sentence on screen as well (Part 7.10) — e.g., "Bacenta 12's Church Pulse has dropped 15 points over 3 weeks," matching the PRD's own alert copy style exactly (§11.2) |
| Density | A chart never displays more data points than the screen can render legibly without zooming/panning on mobile — long history is available via drill-down (§3.2's max-2-levels rule), not by cramming a wide chart into a narrow screen |

### 10.8 Alerts as a data-visualization category

Alerts (Church Pulse decline, SLA breach, staffing gap, discrepancy) are visually distinguished from routine data display everywhere they appear: an `status.danger` or `status.warning` left-border accent on the containing card, plus a badge (Part 7.9), plus their guaranteed placement in the priority zone (Part 4.2) — never merely a data point sitting inside a chart that a user must notice unaided. This redundant (border + badge + placement) signaling is deliberate: it is the interface's answer to the exact failure mode Church Pulse exists to prevent — a real signal, present in the data, that a busy leader scanning quickly does not actually see.

---
## Part 11 — AI Experience

### 11.1 A scope note, stated plainly

The PRD and Blueprint define "intelligence" in Ecclesia as the **Insights domain**: a deterministic, weighted-signal scoring engine (Church Pulse computation model, PRD §12.8) and a rule-based decision tree (silent-drift detection, PRD §15.8; the Worker service's `silent-drift-sweep`, `follow-up-sla-sweep`, and `church-pulse-recompute` jobs already built in this codebase). Nothing in either source document specifies a generative or conversational AI system, an LLM-backed chat interface, or free-text "AI summaries" written by a language model. This document's brief asks for AI summaries, recommendations, warnings, conversation panels — real product ideas, but **beyond what is currently specified anywhere in the PRD or Blueprint.**

This Part therefore does two things, kept clearly separated: §11.2–11.4 define how the product's *existing*, cited intelligence (Insights/Church Pulse) should present itself, which is binding. §11.5 sketches how a *future* generative layer (summaries, a conversational panel) would need to fit the same rules if and when it is scoped as real engineering work, which is explicitly speculative and marked as such throughout.

### 11.2 The governing rule: never replace pastoral judgment

This is not a design preference; it is the PRD's own explicitly stated risk and mitigation. RISK-07 (PRD §20) names the exact failure this rule exists to prevent: "Overreliance on automated Insights alerts leads leaders to substitute the system's flags for genuine relational discernment ('the app says my Bacenta is fine' replacing actually knowing one's people)." The PRD's own mitigation is a UX instruction, not just a policy statement: "UI language and training materials should frame alerts as 'worth a conversation,' never as a substitute for one" (PRD §20). Separately, Insights is "explicitly positioned... as a prompt to action, not a verdict" (PRD §5.2, §16.6, as cited in RISK-07's own mitigation column).

**Binding copy rule, directly from this citation:** every Insights alert, anywhere in the product, is phrased as a prompt toward a relationship, never a verdict about one. "Bacenta 12's Church Pulse has dropped 15 points over 3 weeks — worth a conversation with the Shepherd" is compliant; "Bacenta 12 is failing" or "3 members at risk of leaving" is not — the second framing states a conclusion the system cannot actually know and invites exactly the substitution-for-discernment RISK-07 warns against.

### 11.3 Always explain recommendations

Every score, alert, or flag the Insights engine produces must be explainable in the same interface surface it appears in — not merely accurate, but legible. Concretely: a Church Pulse score is never shown without its contributing signal categories being one tap/click away (matching FR-INS-02's premise that signal weights are visible, configurable data (PRD §13, Functional Requirements), not an opaque black box); a silent-drift flag always names which specific condition triggered it (e.g., "3 consecutive Bacenta meetings missed while Sunday attendance continued") rather than a bare "flagged" label. This is the direct interface expression of the PRD's own requirement that Church Pulse's weighting be "implemented as configurable parameters, not hard-coded constants" (NFR-MAINT-02, PRD §14) — a system whose logic is explicitly designed to be inspectable and tunable should never present its output as an unexplained black box.

### 11.4 Separate AI insight from factual data

Every screen that mixes a directly-recorded fact (attendance was taken, an offering was recorded) with a computed signal (Church Pulse, a silent-drift flag) visually distinguishes the two, using a consistent, small marker (an "Insight" label/icon, distinct token color from the status system, Part 5.10) next to any computed value — so a user never mistakes "the system calculated this" for "this was directly observed and entered by a person." This distinction matters most exactly where the two are adjacent: a Person's profile showing both their recorded attendance history (fact) and their Church Pulse contribution (computed) must make unmistakably clear which is which.

### 11.5 Forward-looking: conversation panels and generative summaries *(speculative — not sourced)*

If a future phase adds a generative/conversational AI layer (e.g., an LLM-generated plain-language summary of a Bacenta's trend, or a chat-style panel a Pastor can ask questions of), it must satisfy every rule above with no exception carved out for "the AI wrote it, not the deterministic engine":

- **Every generated summary cites the underlying data it was generated from**, visible on demand (matching §11.3's explainability rule) — a generated sentence with no traceable basis would be a regression from the current Insights engine's inspectable-by-design posture, not an improvement on it.
- **A conversation panel is a query tool over real data, never a source of pastoral recommendations presented as authoritative** — it answers "show me the Bacentas with declining trend this month," not "tell me who to visit this week" phrased as an instruction rather than a prompt, per §11.2's governing rule.
- **Generated content is visually marked as generated**, using the same "Insight" distinction from §11.4, extended with clear language (e.g., "Summary generated from this Bacenta's last 4 weeks of data") — never presented typographically identical to a human-authored pastoral note.
- **No generated content is ever the sole record of a pastoral decision or action** — the audit trail (Blueprint §7.4) records what a human leader actually did, never a system-generated action taken on their behalf.

This section is included so that, whenever a generative AI capability is actually scoped, the design system it is built against already has the right boundary defined — rather than that boundary being invented under time pressure after the capability already half-exists.

### 11.6 Warnings and insights — presentation summary

| Type | Presentation | Governing rule |
|---|---|---|
| Alert (SLA breach, discrepancy, staffing gap) | Priority zone (Part 4.2), status-colored, factual copy (Part 8.11) | Not AI-specific — a rule-based threshold trigger, presented plainly |
| Church Pulse trend/decline | Primary metric zone with trend line (Part 10.1), always with a "worth a conversation" framing on any decline alert | §11.2 (RISK-07) |
| Silent-drift flag | Flag list (Part 10.5), always naming the specific triggering condition | §11.3 |
| (Future) generated summary | Clearly marked as generated, citation-backed, query-only | §11.5, speculative |

---
## Part 12 — Design Governance

A design system is only as good as its ability to stay one system for ten years rather than fragmenting into per-team dialects after year one. This Part defines how it stays that way, mirroring the same engineering discipline already established elsewhere in this codebase (the RBAC permission matrix as an "executable specification," Blueprint §9.5; traceability from commit to requirement, Blueprint §14.4) — governance here is not bureaucracy for its own sake, it is the mechanism that keeps "built once, consistently" true after the first ten screens become the first hundred.

### 12.1 Versioning

This document and the token/component definitions it specifies are versioned together, using the same major.minor discipline as the PRD and Blueprint (both currently v1.0/v2.0):

- **Major version** — a breaking change to a token's meaning or a component's public contract (e.g., renaming `color.status.danger` to something else, or changing what props `Button` accepts). Requires a migration note and a deprecation window (§12.5).
- **Minor version** — additive changes: a new component, a new token, a new variant that doesn't change existing behavior.
- **Patch** — value-only corrections (e.g., a contrast-ratio fix to a color token) that don't change any name or contract.

Once implementation begins, the token definitions and component library live in a shared `libs/design-system` (or equivalent) package, versioned and published the same way `libs/contracts` and `libs/rbac` already are consumed by multiple apps in this monorepo — not copy-pasted into `apps/web-admin` and `apps/mobile` independently, which would silently reintroduce the exact "built twice, inconsistently" failure this whole document exists to prevent.

### 12.2 Contribution workflow

1. **Propose.** Any new component, variant, or token is proposed against a real screen need (Part 1.9's "no feature without a stated ministry rationale" applies here too — no component without a stated screen need) — never spec'd speculatively ahead of an actual use case.
2. **Check for an existing solution first.** Before adding anything new, the proposer confirms no existing component/variant (Part 7) already solves the need — the review checklist (§12.3) makes this the first gate specifically to prevent variant sprawl.
3. **Design review.** Checked against §12.3's checklist, including accessibility (Part 1.5) and token-only styling (no raw values, Part 6.12).
4. **Implement once, consume everywhere.** A new component or token is built once in the shared design-system package and consumed by both `apps/web-admin` and `apps/mobile`'s platform-appropriate rendering (React web components / React Native components sharing the same token values and, where feasible, the same component API shape).
5. **Document.** Purpose, variants, behavior, accessibility notes, and usage guidance (matching the Part 7 template exactly) are recorded before the component is considered done — an undocumented component is not a shipped component.

### 12.3 Review checklist

Every new or changed component/token must pass all of the following before merging:

- Does it use only existing tokens (Part 6), or does it justify a new token through the same proposal process?
- Does it meet the WCAG 2.1 AA floor (Part 1.5) — contrast, touch target, keyboard operability, screen-reader labeling?
- Does it work correctly in both light and dark themes (Part 5.11) without special-casing?
- Is its variant set closed and exhaustive, or does it invite one-off bespoke exceptions (Part 8.11)?
- Does its copy follow the tone rules in Part 8.11 and, where relevant to Insights/AI content, Part 11's explainability and framing rules?
- Is it usable on both Web Admin and Mobile, or is its platform-exclusivity explicitly justified (as with Command Palette, Part 7.17)?
- Does it degrade correctly to its offline/loading/empty/error states (Part 7.18–7.20) rather than assuming the happy path?

### 12.4 Naming conventions

- Tokens: `category.role.variant.state`, semantic not literal (Part 6.1).
- Components: PascalCase, named for what they *are* (`Card`, `StatusBadge`), not what they're *for* in one specific screen (never `BacentaDashboardCard` — a component's name must not encode a single use case, or its reuse will be discouraged by its own name).
- Domain screens (built in the next phase, on top of this system) are named for the PRD's own surface names (Part 3.3's table) exactly, preserving one-to-one traceability from this document's IA all the way back to the PRD.

### 12.5 Deprecation strategy

A deprecated token or component is never deleted outright — it is marked deprecated (with a lint warning pointing at the replacement), remains functional for a defined window (minimum one minor version cycle), and is removed only in a major version bump with a migration guide. This mirrors the Blueprint's own append-only, never-silently-destructive philosophy for financial and membership data (Blueprint §7.4–7.5): a design system that quietly breaks screens on unannounced changes would undermine the same trust this document's Part 1 asks every visual decision to build.

### 12.6 Ownership and future extension

This document, and the shared design-system package it specifies, is the joint responsibility of whoever builds `apps/web-admin` and `apps/mobile` going forward — there is no scenario in which one app's team is permitted to fork the token set or component library "just for this screen." Any perceived need to diverge is itself the signal to bring a proposal through §12.2, not to quietly build around the system. This is what makes the "design once, build twice" promise real rather than aspirational: the system stays one system because divergence is structurally the harder path, not because anyone remembers to check.

---

*End of Ecclesia Design System & UX Foundation v1.0. This document is the design-architecture foundation for the next phase of work: implementing `apps/web-admin` and `apps/mobile` against the tokens, components, and rules defined here, screen by screen, following the information architecture and dashboard specifications in Parts 3–4.*
