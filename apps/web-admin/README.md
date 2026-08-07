# apps/web-admin

The React web console used by the Resident Pastor, Assistant Pastors, and
Church Administrators (PRD §11.9) for configuration and cross-Bacenta
oversight.

**Status:** real, Cognito-authenticated (with a `development`-mode
dev-auth fallback) application shell with a persistent sidebar/top bar
(`app/shell/AppShell.tsx`), protected routing, and one page per Design
System §3.1 nav item: Dashboard, People (list + detail + intake),
Pastoral Care (Follow-up queue), Ministry (roster + Basonta detail),
Gatherings, Stewardship (Record Transaction/Request Expense), Insights
(Branch + cluster drill-down), and Configuration. This README's earlier
"placeholder screen, no product screens yet" status line was stale well
before the Dashboard Redesign sprint — corrected here.

**Dashboard Redesign sprint:** the Resident Pastor's dashboard
(`app/pages/DashboardPage/`) was rebuilt into a premium, demo-ready
layout — Header, Church Pulse (primary metric), Members/Attendance/
Giving/Volunteers KPIs, Quick Actions, Needs Attention, Prayer Focus,
Church Growth trends, Upcoming Events, and Recent Activity. See
`app/pages/DashboardPage/DASHBOARD_REDESIGN_NOTES.md` for the full scope
decision, what's real data vs. disclosed demo data, and what was
deliberately left unmodified (`ChurchPulseCard`/`AlertPriorityCard`/
`RecentActivityCard`, shared with `InsightsPage`).

**Remaining Engineering Sprint, Milestone 11:** the other four persona
dashboards named in `Ecclesia_Design_System_UX_Foundation_v1.0.md` Part
4.3 are now built too — Ministry Leader, Finance Officer, Branch Pastor,
and Council Administrator (mapped to `ADMIN`, not `COUNCIL_OVERSEER` —
see `DashboardPage/DASHBOARD_REDESIGN_NOTES.md`'s addendum for why).
`Ministry/StaffingTargetsPanel.tsx` fills the previously-missing
Staffing Targets UI (Overview/current-vs-target/vacancy/capacity
indicators/filters/search/Edit/Assign Volunteer), embedded on both the
Basonta roster view and the Ministry Leader dashboard — see
`Ministry/MINISTRY_PAGE_DESIGN_NOTES.md` §12. `Stewardship/
ReceiptUploadPanel.tsx` completes the Receipt Upload workflow (Upload/
Preview always; Replace/Remove scoped to the pre-submit staging step,
disclosed reasoning in `Stewardship/STEWARDSHIP_PAGE_DESIGN_NOTES.md`
§10). Every role named in the Design System's persona table now has a
real dashboard; no page in this app falls back to the generic
"coming soon" stub anymore except genuinely unbuilt roles (e.g. `WORKER`).

**Product Experience Sprint I:** engineering is now considered complete;
this sprint polished the product surface instead. `docs/
ECCLESIA_DESIGN_SYSTEM.md` (new) is the single implementation-facing
reference for every token/component/pattern this app uses — read that
before building a new screen. Church Pulse is now the flagship dashboard
feature (`ChurchPulseInsightsPanel.tsx`, Resident Pastor dashboard only —
sub-metrics, an actionable insight line, a Branch Comparison preview).
Cmd/Ctrl+K opens a command palette from anywhere in the app
(`AppShell.tsx`) for fast cross-page navigation — a component that
existed since the UI Foundation sprint but was never mounted until now.
Every persona dashboard's KPI grid now shares the same responsive
column-count behavior. An audit of empty/loading/error states across
every major page found the existing three-state contract
(`Skeleton`/`ErrorState`/`EmptyState`) already consistently applied — see
`DashboardPage/DASHBOARD_REDESIGN_NOTES.md`'s own addendum for the full
account, including what was deliberately left unchanged.

See `app/router/router.tsx`'s own doc comment for why this app has a
small hand-built router instead of `react-router-dom` (no package-registry
access anywhere in this project's history), and each page's own
`*_DESIGN_NOTES.md`/`*_PAGE_DESIGN_NOTES.md` for per-page detail.
