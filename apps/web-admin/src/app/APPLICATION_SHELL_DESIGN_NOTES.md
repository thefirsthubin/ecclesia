# Application Shell — Design Notes

Sprint: "Transform the UI Foundation into the real Ecclesia application"
(Application Shell sprint, web-admin). Mirrors the disclosure discipline
established in `apps/mobile/.../SHEPHERD_DASHBOARD_DESIGN_NOTES.md`: every
choice below is either a direct citation or an explicit `[Design Decision]`.

## 0. Reconciling the brief against the repo (STEP 1 audit)

The sprint brief's PROJECT STATUS claims **Navigation Components** and
**Layout Components** already exist and are lint/test/build green. This is
not accurate. `libs/ui/web/src/index.ts` exports exactly 12 primitives —
`ThemeProvider, Icon, utils, Text, Heading, Button, Card, Badge, Avatar,
Input, Divider, Spinner, Skeleton, EmptyState, ErrorState` — identical to
`libs/ui/native`'s inventory. There is no Sidebar, TopNav, Breadcrumbs,
Table, or Layout component anywhere in the repo. This sprint builds them
from scratch on top of the existing primitives, inside `libs/ui/web`
(shared, `scope:ui-web`) since Web Admin is the only surface that needs
them this pass.

The brief also implies routing and Cognito client auth "already exist" to
be reused ("If Cognito integration already exists, reuse it. Do not
recreate authentication."). Checked `package.json` and `node_modules`:
no `react-router*`, `aws-amplify`, `amazon-cognito-identity-js`, `oidc-*`,
`@tanstack/router`, or `wouter` is installed anywhere in the workspace.
`apps/api`'s `cognito-verifier.service.ts` is explicit that **apps/api is a
pure OIDC resource server — "it never issues or refreshes tokens itself;
Cognito does that directly with the client."** So there is no backend
login endpoint to call either. Confirmed separately (Sprint Review task)
that this sandbox has no package-registry network access — `pip install`
and `npm install` both 403. **No new dependency can be installed.**

`[Design Decision]` Given the above, this sprint hand-builds:
- a minimal, dependency-free client-side router (history API, no library)
- a minimal Cognito auth client using raw `fetch` against Cognito's public
  `AWSCognitoIdentityProviderService` JSON API (the same API any SDK would
  wrap), using `COGNITO_CLIENT_ID`/`COGNITO_REGION` (already present in
  `apps/api`'s env schema — the client ID and region are not secrets, they
  are public OAuth client identifiers safe to ship to a browser)

This is consistent with the project's existing ethos: `api-client.ts` in
`apps/mobile` already does plain-`fetch` API access with no HTTP library.

## 1. Persona/port scoping

The brief's Success Criteria section is exclusively `http://localhost:4200`
— web-admin's port. Design System §3.2 frames mobile bottom-nav as
**persona-specific** and already fully out of scope for a web-only success
path. `[Design Decision]` STEP 3's "Mobile" shell sub-bullet (Bottom Nav /
Drawer / Top Bar / Safe Area) is deferred out of this pass; this sprint
builds the **Web Admin** shell only. Mobile already has its own shell (the
Shepherd Dashboard screen renders directly under `App.tsx`, no nav chrome
yet) and gets a shell in a later sprint when a second mobile screen exists
to navigate to.

The brief's STEP 5 also says "Implement the Shepherd Dashboard... the first
production screen," but Blueprint §8.2's auth-method-by-persona table shows
Bacenta/Basonta Leaders (Shepherd) use **phone + OTP**, while Web Admin's
real primary personas — Treasurer, Assistant Pastor, Resident Pastor,
Admin — use **email + password + mandatory TOTP MFA**. Design System Part 2
already frames Web Admin as those personas' surface and mobile as
Shepherd's. Building a phone+OTP login screen inside web-admin to serve a
persona whose documented primary surface is mobile would contradict both
documents.

`[Design Decision]` Resolution: build the web-admin login screen for
**email + password + TOTP MFA** (the method actually documented for
web-admin's personas), and make the **Resident Pastor's Branch dashboard**
(Design System §4.3, reusing the already-built `GET /insights/branch-
dashboard`) the fully-implemented "first production screen" for web-admin,
since it matches both the documented auth method and an existing endpoint
exactly. The dashboard router is still genuinely role-aware — a Bacenta
Leader who does authenticate here (e.g. an Admin impersonation/support
scenario) is routed to a stub that says the Bacenta dashboard is a mobile
surface, rather than a broken or fabricated screen. This keeps the brief's
literal ask (Shepherd Dashboard reachable, role-aware navigation) satisfied
without inventing an undocumented auth method.

## 2. Routing plan

Design System §3.1's sidebar taxonomy is the authoritative nav list (not
the brief's approximate one): **Dashboard, People, Pastoral Care, Ministry,
Gatherings, Stewardship, Insights, Configuration** (Configuration gated to
Admin/Council Administrator roles only). Brief's list included
"Attendance" and "Follow-up" as separate top-level items — Design System
places these as sub-nav rows under Gatherings/Pastoral Care respectively
(§3.1's context-nav example), not top-level, so the sidebar follows the
Design System, and sub-nav is deferred (stub pages don't need sub-nav yet).

Routes this sprint:
`/login`, `/` (redirects to `/dashboard` or `/login`), `/dashboard`,
`/people`, `/pastoral-care`, `/ministry`, `/gatherings`, `/stewardship`,
`/insights`, `/configuration` (Admin-gated).
Only `/login` and `/dashboard` are fully implemented; the rest render a
labelled `EmptyState`-based stub ("People — coming soon") behind the same
shell/nav, per the brief's own "stub pages are acceptable if clearly
identified."

## 3. Authentication plan (STEP 4)

- Login screen: email + password fields, submit calls Cognito
  `InitiateAuth` (`USER_PASSWORD_AUTH`) via raw `fetch`.
- If Cognito responds with a `SOFTWARE_TOKEN_MFA` challenge (mandatory per
  Blueprint §8.2 for these personas), show a second step collecting the
  6-digit TOTP code, submitted via `RespondToAuthChallenge`.
- Loading/validation/error states per field and per submit.
- On success: access token held in memory only (React context state, never
  persisted) — matches Blueprint §8.3's own "access token: in-memory"
  rule, stated there for mobile but the more conservative choice for web
  too. `[Design Decision]`: Blueprint §8.3's storage column is mobile-only
  (Keychain/Keystore) and does not specify a web equivalent; there is no
  backend session endpoint to issue an httpOnly cookie (apps/api is a pure
  resource server). This sprint stores the refresh token in
  `sessionStorage` (tab-lifetime only, cleared on tab close, never
  `localStorage`) as a disclosed, reviewable interim choice, not a
  citation-backed one.
- Logout: clears in-memory + `sessionStorage` state, calls Cognito
  `GlobalSignOut`, redirects to `/login`.
- Protected routes: shell checks for a live access token; absent/expired →
  redirect to `/login`, preserving the originally-requested path.
- Session restoration: on load, if a refresh token is present in
  `sessionStorage`, silently call `InitiateAuth`
  (`REFRESH_TOKEN_AUTH`) before rendering protected routes.
- Role-aware redirect: **correction found while implementing** — the
  Cognito ID token carries no role claim in this system.
  `ActorContextResolverService.resolve()` (`apps/api`) derives
  `ActorContext.role` entirely server-side, from a DB lookup keyed by the
  verified access token's `cognitoSub` (`platform.users` →
  `people.persons` → active `role_assignments`) — there is no client-known
  role at all until the backend says so, and no existing endpoint returns
  it (confirmed: no `/me`/`whoami` route anywhere in `apps/api`). Per
  STEP 6 ("if additional endpoints are required, document them before
  implementation"), this sprint adds **`GET /auth/me`** to
  `apps/api/src/platform/auth` — a thin read returning the already-resolved
  `ActorContext` via the existing `@CurrentActor()` decorator, no new
  business logic, automatically protected by the existing global
  `AuthGuard`. Web-admin calls it once after login (and once on session
  restoration) and uses the returned `role` to drive nav/dashboard/
  redirect. See `apps/api/src/platform/auth/AUTH_DESIGN_NOTES.md` for the
  endpoint's own notes.

## 4. Shell plan (STEP 3)

New `libs/ui/web` components: `Sidebar`, `TopBar`, `Breadcrumbs`,
`UserMenu`, `NotificationBell`. Layout composed in a new `AppShell`
component in `apps/web-admin` (app-specific composition, not a generic
library component, since its nav list is Design-System-specific business
content). Responsive collapse: below `libs/ui/tokens`' `md` breakpoint
(1024px, Design System §6.11's tablet boundary), the sidebar hides by
default and becomes a toggled overlay via the top bar's hamburger button;
at/above `md` it is always visible. `[Design Decision]`: an icon-only
rail (visible-but-narrow, rather than hidden-until-toggled) is a plausible
finer-grained middle state the Design System doesn't specify pixel
behaviour for — not built this pass; `Sidebar`'s own `collapsed` prop
already exists for a future sprint to wire up.

## 5. Dashboard plan (STEP 5)

Resident Pastor dashboard (Design System §4.3, full citation already in
the sprint summary): Priority = alerts from `GET /insights/branch-
dashboard`'s `alerts[]`, sorted `triggeredAt` descending (`[Design
Decision]`: the spec says "ranked by severity/trend decline" but
`AlertResponseDto` has no severity field — `alertType`/`message`/`status`/
`triggeredAt` only — so newest-first is the closest honest proxy available
without inventing a severity scoring scheme). Primary metric =
`pulseScore.score` badge-styled like the mobile Church Pulse card. Quick
actions = **Resolve** (`PATCH /insights/alerts/:id/resolve`, the endpoint
that actually exists). The spec's "forward alert to Assistant Pastor"
action has no backing endpoint anywhere in `apps/api` — per STEP 6
("document new endpoints before implementation, never invent undocumented
business behaviour"), this action is **not built**; the quick actions row
ships with Resolve only, and the gap is documented here and in the
sprint's follow-up recommendations. Recent activity = resolved alerts from
the same payload (client-filtered by `status !== 'OPEN'`). Notifications =
same alerts list, `status === 'OPEN'`, since no separate notifications
endpoint exists (mirrors the Shepherd Dashboard's own precedent of
deriving Notifications from the same data source rather than a dedicated
feed).

Shepherd's own dashboard (`ShepherdDashboardScreen`, `apps/mobile`) is not
duplicated into web-admin — its component tree is `ui-native`-based and
can't render in `ui-web`. For role coverage/consistency, a Bacenta/Basonta
Leader who reaches `/dashboard` on web-admin sees a stub explaining the
Bacenta dashboard lives on mobile, rather than a broken or faked screen
(§1 above).

## 7. What was actually built (STEP 10 — architecture/routes/component hierarchy)

**Routes** (`app.tsx`, hand-built router in `app/router/router.tsx`):

| Path | Auth | Renders |
|---|---|---|
| `/` | either | `RootRedirect` → `/dashboard` if authenticated, `/login` otherwise |
| `/login` | public | `LoginPage` (email+password, then TOTP MFA step) |
| `/dashboard` | protected | `DashboardPage` (role-branches to `ResidentPastorDashboard`, a mobile-redirect stub, or a coming-soon stub) |
| `/people`, `/pastoral-care`, `/ministry`, `/gatherings`, `/stewardship`, `/insights` | protected | `StubPage` |
| `/configuration` | protected, role-gated | `ConfigurationPage` (Admin/Council Overseer only, else an access-denied `EmptyState`) |

**Component hierarchy:**

```
App
 └─ ThemeProvider → AuthProvider → RouterProvider → AppRoutes
     ├─ LoginPage (public)
     └─ ProtectedRoute (session-restore spinner / redirect-to-login / AppShell)
         └─ AppShell (Sidebar + TopBar[Breadcrumbs, NotificationBell, UserMenu] + <main>)
             └─ <route's page component>
```

**New backend surface:** `GET /auth/me` (`apps/api/src/platform/auth/controllers/auth.controller.ts`) — see §3 above and `AUTH_DESIGN_NOTES.md`.

**New `libs/contracts` schema:** `auth.schemas.ts` (`actorContextResponseSchema`).

**New `libs/ui/web` components:** `Sidebar`, `TopBar`, `Breadcrumbs`, `UserMenu`, `NotificationBell` — all framework-agnostic (no router dependency), all with their own `.spec.tsx`.

**Extension points for the next sprint:**
- Each `StubPage` is a one-line swap for a real domain page once that domain's Web Admin surface is built.
- `Sidebar`'s `collapsed` prop is unused today — wiring it up gives the icon-rail middle breakpoint state noted in §4.
- `AppShell`'s `notifications` prop currently only ever receives data on `/dashboard` (the only page that fetches alerts) — a shared "current alerts" context would let the bell reflect Branch-wide alerts on every page, not just Dashboard.
- `DashboardPage`'s role branches are a natural place to add Assistant Pastor's cluster dashboard (`GET /insights/cluster-dashboard/:groupId`) and Treasurer's Stewardship dashboard once those are scoped.

## 8. Known sandbox limitation

Same category of gap as every prior sprint's own notes: `pnpm install`/`lint`/`test`/`build` cannot be run in this sandbox (no `pnpm` binary here; network-dependent installs also blocked). This sprint's code has not been compiled or test-run for real — it needs the same real-machine `pnpm lint && pnpm test && pnpm build` pass every previous sprint in this project has gone through before being considered done. `COGNITO_CLIENT_ID`/`COGNITO_REGION`/a real User Pool are also still required (same gap `AUTH_DESIGN_NOTES.md` already discloses) before the login screen can be exercised against real Cognito rather than a mocked one.

## 9. Deferred / explicitly out of scope this pass

- Mobile application shell (bottom nav / drawer) — §1.
- "Forward alert" quick action — no endpoint exists — §5.
- Sub-navigation rows (Verification Queue, etc.) — stub pages don't need
  them yet.
- People/Ministry/Gatherings/Stewardship/Insights full pages — stubs only.
