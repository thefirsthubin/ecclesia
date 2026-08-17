# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Ecclesia Web Admin serves nine church-leadership personas (Resident Pastor, Council Administrator, Council Treasurer, Branch Pastor, Branch Administrator, Branch Treasurer, Bacenta Leader, Basonta Leader, System Administrator), each with a role-scoped portal. This product-context file covers Web Admin as a whole; the current active work is scoped to one persona only — see `## Current Scope`.

**Branch Pastor** (technical role: `ASSISTANT_PASTOR`) is an operating-and-pastoral user, not an administrator. They lead one Branch of a Council-structured church (River of Life Cathedral, the reference deployment — a cell-model church using Bacenta/small-group and Basonta/ministry-team structures). They open this product to answer two questions in seconds: "how is my branch doing?" and "what needs my attention?" — then act on it (create a follow-up, check giving, review a Bacenta's health). This is a daily-use operational tool, not an occasional reporting screen.

## Product Purpose

Ecclesia is a Church Operating System — PRD's own framing: "the world's most comprehensive Church Operating System," differentiated from incumbent church-management tools that "answer 'what happened?' competently" but "almost never answer 'what should a leader do next?'" Its flagship mechanism is **Church Pulse**, a leading-indicator engagement score meant to surface a drifting member before the lagging signal (attendance dropping to zero) confirms it.

Success for the Branch Pastor persona specifically: they can assess branch health and act on pastoral needs faster and with more confidence than a paper register, a spreadsheet, or a generic CRM would let them.

## Positioning

Decision support over record-keeping. A neighboring generic CRM or admin dashboard could copy Ecclesia's tables and forms; it could not truthfully copy Church Pulse's engagement-decline detection or the Council/Branch/Bacenta/Basonta domain model this product is built around natively.

## Operating Context

Six bounded-context domains: People, Pastoral Care, Ministry, Gatherings, Stewardship (branded "Finance" in the Branch Pastor UI), Insights. A Branch Pastor's daily rhythm: check Sunday attendance and giving after a service, review which Bacentas need attention, create/assign pastoral follow-ups, and check in on people who are lapsing. Real seeded reference organization: "River of Life," 1 Council, 2 Branches (Headquarters, Asokwa), each with multiple Bacentas/Basontas, real members, attendance, and financial records.

## Capabilities and Constraints

- Real, RBAC-scoped API data only — every figure on screen must trace to a real endpoint this role's grant actually reaches. No fabricated metrics, charts, users, or activity, ever, at any redesign fidelity.
- RBAC/RLS (row-level security, Branch/Council/Cluster isolation) is backend-enforced and authoritative; UI work must never appear to grant access it doesn't have, and must never widen a permission to make a screen look more complete.
- Pastoral privacy is a hard product constraint: prayer notes, counselling information, and pastoral interactions are Pastor-only and must never become reachable by Branch Administrator, Council Administrator, Council Treasurer, Bacenta/Basonta Leader, System Administrator, or any other non-pastoral role.
- The Branch Pastor is explicitly not the Treasurer: Finance is read-only financial visibility, never transaction recording, approval, reconciliation, expense management, or bank operations.
- `Gathering.type` is a free-text backend field with no enum — only `CELL_MEETING` (Bacenta meeting) and `SUNDAY_SERVICE` currently exist in real data; any UI grouping must derive from real observed values, never a hardcoded taxonomy of invented types.
- Current backend data does not support: per-Bacenta multi-week historical trends, Offering/Tithe-type-differentiated giving, Sunday-Service-specific giving, or a Branch-level member-inactivity/lapsing trend. Where the ideal visualization needs one of these, the honest constraint is disclosed in-UI, not worked around with fabricated data.

## Brand Commitments

Product name: **Ecclesia**. The current visual implementation (design tokens in `libs/ui/tokens`, components in `libs/ui/web`) is real, considered incumbent work — a muted deep green brand color (deliberately chosen over an earlier teal to avoid "generic SaaS" and denominational-color cliché), Inter for interface text with Fraunces reserved for display/heading moments, an 8pt spacing rhythm, tight 4/6/8px radii, and restrained/flat elevation. Per this session's explicit redesign brief, this incumbent system is evidence and a starting point for the Branch Pastor portal, not a binding constraint going forward — `new-work` decides how much of it a redesign preserves versus replaces.

## Evidence on Hand

Real seeded data (verified live against Postgres this session): 1 Tenant, 1 Council, 2 Branches, 5 Bacentas, 3 Basontas, ~80 Persons, real attendance/gathering/financial records for the current reporting period. No stock photography, no fabricated testimonials/customers exist or should be introduced. Existing production API endpoints (traced this session, not assumed) back the Branch Pastor's Dashboard, People, Gatherings, Finance, and Insights surfaces.

## Product Principles

1. Decision support over data display — every screen should shorten the path from "look at this" to "here's what to do."
2. Real data or an honest absence — never a decorative fabrication standing in for a metric the backend can't yet produce.
3. Privacy boundaries are load-bearing product truth, not a detail to design around later.
4. Calm, premium, pastoral — this is leadership software used daily by a person caring for people, not a generic admin console.
5. One role's redesign must never visually or functionally change another role's experience of the same shared shell/components.

## Accessibility & Inclusion

No project-specific accessibility requirement beyond standard WCAG AA (contrast, keyboard navigation, focus visibility) has been established; treat that as the floor.

## Current Scope

**This redesign work covers only the Branch Pastor (`ASSISTANT_PASTOR`) portal**: Dashboard, People (incl. member profile), Gatherings, Finance, Insights, Pastoral Care, the shared shell/navigation exactly as it renders for this role, and the Login page. Every other persona's portal is explicitly out of scope and must render unchanged.
