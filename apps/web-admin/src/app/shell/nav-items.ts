import type { RoleDto } from '@ecclesia/contracts';
import type { IconName } from '@ecclesia/ui-core';

/**
 * The Web Admin sidebar taxonomy — Design System v1.0 §3.1's exact list:
 * "Dashboard, People, Pastoral Care, Ministry, Gatherings, Stewardship,
 * Insights, Configuration (Admin/Council Administrator roles only)."
 * (`APPLICATION_SHELL_DESIGN_NOTES.md` §2 — this supersedes the sprint
 * brief's own approximate nav list, which put Attendance/Follow-up at the
 * top level; the Design System places those as domain sub-nav instead.)
 *
 * `[UX Design Implementation]` Final UX Design Specification §12/§22
 * (decision 9) — an **Administration** group now sits below the flat
 * operational list, holding `Configuration` (moved, not renamed) and
 * `Audit Log` (new — previously reachable only by typing `/audit-log`
 * directly, per the earlier Cross-Persona Dashboards audit's own
 * finding). `Audit Log`'s `roles` list is traced against
 * `permission-matrix.ts`'s real `platform.audit_log.read` rows, not
 * assumed: `RESIDENT_PASTOR`/`ACTING_RESIDENT_PASTOR` (BRANCH — the
 * latter inherits every `RESIDENT_PASTOR` rule via
 * `ACTING_RESIDENT_PASTOR_RULES`, confirmed in `permission-matrix.ts`),
 * `TREASURER` (BRANCH, server-filtered to Stewardship entries),
 * `ADMIN` (BRANCH, full). `ASSISTANT_PASTOR`/`BACENTA_LEADER` hold a real
 * matrix row each but are structurally unreachable (no `bacentaId`
 * column on `platform.audit_log` for CLUSTER/OWN_GROUP to ever match,
 * traced and live-verified in the Audit Log milestone) — omitted from
 * this visibility list for the same reason `people.group.read`-CLUSTER
 * gaps already keep other dead-end items out of other roles' nav
 * elsewhere in this file, not a new rule invented here. This is
 * client-side *visibility* only — `RbacGuard` remains the sole
 * authorization authority; a role missing from `roles` below still gets
 * the real backend's real 403 if it reaches the route directly.
 *
 * `[Design Decision]` icon choices — the Design System names the nav
 * items but not their icons.
 */
export interface NavItemConfig {
  label: string;
  href: string;
  icon: IconName;
  /** Roles allowed to see this item. `undefined` = every authenticated role. */
  roles?: RoleDto[];
  /**
   * `[Branch Pastor portal]` The inverse of `roles` above — roles that
   * must NOT see this item, even though it's otherwise unrestricted
   * (`roles` left `undefined`). Added specifically so a single role can
   * be carved out of an item every *other* role still sees exactly as
   * before, without having to enumerate every other role explicitly (a
   * long, fragile inclusion list that silently goes stale the next time
   * a role is added) and without touching that item's `roles` field at
   * all — Ministry/Stewardship stay visible, unchanged, to every role
   * that already sees them today.
   */
  excludeRoles?: RoleDto[];
  /** `[UX Design Implementation]` Final UX Design Specification §12 — items
   * sharing a `group` render together under one heading in the sidebar,
   * separated from the flat operational list above them. Omit for the
   * ungrouped main section. */
  group?: string;
}

export const NAV_ITEMS: NavItemConfig[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'home' },
  { label: 'People', href: '/people', icon: 'users' },
  { label: 'Pastoral Care', href: '/pastoral-care', icon: 'user' },
  // `[Branch Pastor portal]` Hidden from Branch Pastor specifically - the
  // approved Branch Pastor sidebar has no standalone Bacentas/Basontas nav
  // item. Unchanged for every other role (still no `roles` restriction at
  // all) - a Bacenta/Basonta detail page is still reachable for Branch
  // Pastor by drill-down (`BranchPastorDashboard`'s own row-click already
  // navigates to `/ministry/:groupId`), just not as a top-level directory.
  { label: 'Ministry', href: '/ministry', icon: 'calendar', excludeRoles: ['ASSISTANT_PASTOR'] },
  { label: 'Gatherings', href: '/gatherings', icon: 'clock' },
  // `[Branch Pastor portal]` Hidden from Branch Pastor - replaced by the
  // dedicated read-only `Finance` item below, per the approved product
  // decision that Branch Pastor Finance is explicitly NOT the Treasurer
  // portal `StewardshipPage` (verify/flag/approve/pay/confirm-deposit
  // actions) is built around. Unchanged for every other role.
  { label: 'Stewardship', href: '/stewardship', icon: 'trendingUp', excludeRoles: ['ASSISTANT_PASTOR'] },
  // `[Branch Pastor portal]` Read-only Branch-wide giving visibility -
  // "Finance", never "Stewardship", in this role's UI (approved product
  // decision). Visible ONLY to Branch Pastor - every other role keeps
  // using `Stewardship` above, unaffected.
  { label: 'Finance', href: '/finance', icon: 'trendingUp', roles: ['ASSISTANT_PASTOR'] },
  { label: 'Insights', href: '/insights', icon: 'search' },
  // Design System §3.1: "Configuration (Admin/Council Administrator roles
  // only)". `COUNCIL_OVERSEER` is this codebase's "Council Administrator"
  // role name (`libs/rbac/src/lib/roles.ts`'s own doc comment: "Council
  // Overseer is a Horizon 3 role" — included for completeness).
  {
    label: 'Configuration',
    href: '/configuration',
    icon: 'settings',
    roles: ['ADMIN', 'COUNCIL_OVERSEER'],
    group: 'Administration',
  },
  {
    label: 'Audit Log',
    href: '/audit-log',
    icon: 'history',
    roles: ['RESIDENT_PASTOR', 'ACTING_RESIDENT_PASTOR', 'TREASURER', 'ADMIN'],
    group: 'Administration',
  },
];

/**
 * `[Branch Pastor portal]` The approved Branch Pastor sidebar order -
 * Dashboard / People / Gatherings / Finance / Insights / Pastoral Care -
 * genuinely differs from `NAV_ITEMS`' own array order (which every other
 * role still renders in unchanged: Dashboard / People / Pastoral Care /
 * Gatherings / Insights for this role once Ministry/Stewardship are
 * excluded, Pastoral Care third rather than last). A per-role override
 * keyed by `href`, applied only when one exists for the current role,
 * rather than reordering `NAV_ITEMS` itself - reordering the shared array
 * would change every other role's sidebar order too, which "do not
 * redesign the navigation... of [other roles]" rules out.
 */
const ROLE_SPECIFIC_ORDER: Partial<Record<RoleDto, string[]>> = {
  ASSISTANT_PASTOR: ['/dashboard', '/people', '/gatherings', '/finance', '/insights', '/pastoral-care'],
};

export function navItemsForRole(role: RoleDto): NavItemConfig[] {
  const visible = NAV_ITEMS.filter((item) => (!item.roles || item.roles.includes(role)) && !item.excludeRoles?.includes(role));
  const order = ROLE_SPECIFIC_ORDER[role];
  if (!order) return visible;
  return [...visible].sort((a, b) => order.indexOf(a.href) - order.indexOf(b.href));
}

/**
 * `[UX Design Implementation]` Final UX Design Specification §18
 * (decisions 2 & 3) — the approved, final user-facing terminology.
 * `ADMIN` → "Super Administrator", `COUNCIL_OVERSEER` → "Council
 * Administrator" (previously ambiguous — both this role and `ADMIN`'s
 * own dashboard were informally called "Council Administrator"
 * somewhere in this codebase's comments; that ambiguity is resolved by
 * this rule, not by picking a winner: the label now means
 * `COUNCIL_OVERSEER`, and only `COUNCIL_OVERSEER`, everywhere it
 * appears). `ASSISTANT_PASTOR` → "Branch Pastor", replacing "Assistant
 * Pastor" as the primary product-facing label. Technical identifiers are
 * unchanged in code, RBAC rows, and logs — this is a presentation-layer
 * rule only, per the decision's own explicit scope.
 */
/**
 * `[Multi-Tenant Foundation, Phase 1]` `COUNCIL_TREASURER`/
 * `SYSTEM_ADMINISTRATOR` labels added because `Record<RoleDto, string>`
 * is exhaustive. `ADMIN`/`TREASURER` were deliberately left unchanged in
 * Phase 1 ("do not relabel ADMIN/TREASURER yet... first establish
 * SYSTEM_ADMINISTRATOR so ADMIN is no longer carrying the platform-admin
 * meaning").
 *
 * `[Multi-Tenant Foundation, Phase 2]` That precondition is now met -
 * `SYSTEM_ADMINISTRATOR` exists and is intentionally restricted (one
 * `platform.tenant.read` row, no customer-data access) - so `ADMIN` ->
 * "Branch Administrator" and `TREASURER` -> "Branch Treasurer" now land,
 * per the approved nine-persona terminology. Technical identifiers are
 * unchanged in code, RBAC rows, and logs - this is a presentation-layer
 * rule only, same scope as the `ASSISTANT_PASTOR`/`COUNCIL_OVERSEER`
 * relabels above it.
 */
const ROLE_LABELS: Record<RoleDto, string> = {
  RESIDENT_PASTOR: 'Resident Pastor',
  ACTING_RESIDENT_PASTOR: 'Acting Resident Pastor',
  ASSISTANT_PASTOR: 'Branch Pastor',
  BACENTA_LEADER: 'Bacenta Leader',
  BASONTA_LEADER: 'Basonta Leader',
  TREASURER: 'Branch Treasurer',
  COUNCIL_TREASURER: 'Council Treasurer',
  WORKER: 'Worker',
  USHER: 'Usher',
  MEMBER: 'Member',
  VISITOR: 'Visitor',
  ADMIN: 'Branch Administrator',
  COUNCIL_OVERSEER: 'Council Administrator',
  SYSTEM_ADMINISTRATOR: 'System Administrator',
};

export function roleLabel(role: RoleDto): string {
  return ROLE_LABELS[role];
}
