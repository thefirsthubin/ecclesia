/**
 * Role catalog (PRD §17.2). One entry per row of that table, plus
 * `ACTING_RESIDENT_PASTOR` (Blueprint §8.6): the succession runbook
 * models interim authority as an ordinary, time-bound Role Assignment
 * holding this role, not a new entity type - so it must exist here, in
 * the same catalog, rather than as special-cased logic elsewhere.
 *
 * `VISITOR` and `COUNCIL_OVERSEER` are included for completeness with
 * PRD §17.2 even though neither has any ALLOW rows in the §17.3 matrix
 * today (Visitor is typically unauthenticated; Council Overseer is a
 * Horizon 3 role) - omitting them here would make the catalog silently
 * incomplete relative to its cited source.
 */
export const ROLES = [
  'RESIDENT_PASTOR',
  'ACTING_RESIDENT_PASTOR',
  'ASSISTANT_PASTOR',
  'BACENTA_LEADER',
  'BASONTA_LEADER',
  'TREASURER',
  'WORKER',
  'MEMBER',
  'VISITOR',
  'ADMIN',
  'COUNCIL_OVERSEER',
] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}
