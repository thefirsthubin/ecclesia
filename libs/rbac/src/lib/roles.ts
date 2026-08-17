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
 *
 * `USHER` is **not** a §17.2 row - it's the Usher role milestone's own
 * addition, closing a gap §17.2/§17.3 never resolved: PRD narrative
 * (§13.1, §16.1's RACI table, §16.4's capability table, Epic A's US-A1)
 * repeatedly names "Usher" as the actor who records attendance and
 * captures visitor intake, but the formal role catalog Sprint 1.1
 * transcribed had no corresponding entry - `libs/rbac/src/lib/actions.ts`'s
 * `gatherings.visitor_intake.*` doc comment and this codebase's
 * `GATHERINGS_DESIGN_NOTES.md` both flagged this exact gap before it was
 * closed. See `USHER_ROLE_PROPOSAL.md` (repo root) for the full
 * decision record.
 *
 * `COUNCIL_TREASURER` and `SYSTEM_ADMINISTRATOR` (Multi-Tenant
 * Foundation, Phase 1) - neither is a §17.2 row; both are additions this
 * phase's own locked product decisions require:
 *
 * - `COUNCIL_TREASURER`: financial oversight across every Branch in a
 *   Council. No existing role covers this - `TREASURER` (below) is
 *   Branch-only (PRD §17.2), and `COUNCIL_OVERSEER` is explicitly
 *   administrative, not financial. A genuinely new role, not a rename.
 * - `SYSTEM_ADMINISTRATOR`: a platform role, not a church-hierarchy
 *   role - administers the Ecclesia platform itself (tenants, platform
 *   configuration, platform-level audit), deliberately separate from
 *   `ADMIN` (church-hierarchy Branch administration - "Branch
 *   Administrator" in this phase's product terminology, not yet
 *   relabeled - see `permission-matrix.ts`'s doc comment on `ADMIN`'s
 *   rows). Reusing `ADMIN` for both meanings was explicitly ruled out:
 *   `ADMIN`'s existing rows are all Branch-scoped, and Phase 1's locked
 *   instructions are explicit that platform administration and
 *   customer-data access must be deliberately separated, not collapsed
 *   into one role that happens to also carry unrestricted access to
 *   every Branch's People/Stewardship/Pastoral Care data.
 */
export const ROLES = [
  'RESIDENT_PASTOR',
  'ACTING_RESIDENT_PASTOR',
  'ASSISTANT_PASTOR',
  'BACENTA_LEADER',
  'BASONTA_LEADER',
  'TREASURER',
  'COUNCIL_TREASURER',
  'WORKER',
  'USHER',
  'MEMBER',
  'VISITOR',
  'ADMIN',
  'COUNCIL_OVERSEER',
  'SYSTEM_ADMINISTRATOR',
] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}
