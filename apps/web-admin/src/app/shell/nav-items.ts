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
 * `[Design Decision]` icon choices — the Design System names the nav
 * items but not their icons.
 */
export interface NavItemConfig {
  label: string;
  href: string;
  icon: IconName;
  /** Roles allowed to see this item. `undefined` = every authenticated role. */
  roles?: RoleDto[];
}

export const NAV_ITEMS: NavItemConfig[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'home' },
  { label: 'People', href: '/people', icon: 'users' },
  { label: 'Pastoral Care', href: '/pastoral-care', icon: 'user' },
  { label: 'Ministry', href: '/ministry', icon: 'calendar' },
  { label: 'Gatherings', href: '/gatherings', icon: 'clock' },
  { label: 'Stewardship', href: '/stewardship', icon: 'trendingUp' },
  { label: 'Insights', href: '/insights', icon: 'search' },
  // Design System §3.1: "Configuration (Admin/Council Administrator roles
  // only)". `COUNCIL_OVERSEER` is this codebase's "Council Administrator"
  // role name (`libs/rbac/src/lib/roles.ts`'s own doc comment: "Council
  // Overseer is a Horizon 3 role" — included for completeness).
  { label: 'Configuration', href: '/configuration', icon: 'settings', roles: ['ADMIN', 'COUNCIL_OVERSEER'] },
];

export function navItemsForRole(role: RoleDto): NavItemConfig[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}

const ROLE_LABELS: Record<RoleDto, string> = {
  RESIDENT_PASTOR: 'Resident Pastor',
  ACTING_RESIDENT_PASTOR: 'Acting Resident Pastor',
  ASSISTANT_PASTOR: 'Assistant Pastor',
  BACENTA_LEADER: 'Bacenta Leader',
  BASONTA_LEADER: 'Basonta Leader',
  TREASURER: 'Treasurer',
  WORKER: 'Worker',
  USHER: 'Usher',
  MEMBER: 'Member',
  VISITOR: 'Visitor',
  ADMIN: 'Admin',
  COUNCIL_OVERSEER: 'Council Overseer',
};

export function roleLabel(role: RoleDto): string {
  return ROLE_LABELS[role];
}
