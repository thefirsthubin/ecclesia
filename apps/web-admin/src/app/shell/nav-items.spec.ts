import { navItemsForRole, roleLabel } from './nav-items';

/**
 * `[UX Design Implementation]` Final UX Design Specification §19 (Phase 2
 * shell verification) - no test file existed for `navItemsForRole`/
 * `roleLabel` before this, despite these being exactly the two functions
 * that decide what each of the six Web Admin personas sees in the
 * sidebar. Locks in the persona/RBAC-alignment verification done during
 * that pass: the seven ungated items are visible to every role
 * (`permission-matrix.ts`'s own per-page/per-action rows, not a nav-level
 * gate, are what actually restrict what each role can *do* there - the
 * established "don't pre-empt the backend" pattern this whole codebase
 * follows); `Configuration`/`Audit Log` are the only two nav-level gates,
 * each traced against real `platform.configuration.read`/
 * `platform.audit_log.read` rows.
 */
describe('navItemsForRole', () => {
  const UNGATED_LABELS = ['Dashboard', 'People', 'Pastoral Care', 'Ministry', 'Gatherings', 'Stewardship', 'Insights'];

  /**
   * `[Branch Pastor portal]` `ASSISTANT_PASTOR` removed from this shared
   * "sees everything ungated" list - Ministry/Stewardship are now
   * deliberately hidden from this one role (`excludeRoles`) as part of
   * the approved Branch Pastor sidebar. Every other role's visibility is
   * unaffected - still asserted here exactly as before.
   *
   * `[Milestone D — Portal Experiences]` `TREASURER` also removed - the
   * Stewardship item is still present and ungated for this role, just
   * relabeled "Finance" (`labelOverrides`), so it can no longer match the
   * literal string `'Stewardship'` this shared list checks for. Asserted
   * on its own below instead.
   *
   * `[Milestone D, Portal 2: Branch Administrator]` `ADMIN` also removed -
   * Portal 2's read-only Finance requirement now excludes this role from
   * `Stewardship` entirely (`excludeRoles`), routing it to the dedicated
   * `Finance` item instead. Asserted on its own below.
   */
  it.each(['RESIDENT_PASTOR', 'ACTING_RESIDENT_PASTOR', 'BASONTA_LEADER', 'BACENTA_LEADER'] as const)(
    'shows every ungated item to %s',
    (role) => {
      const labels = navItemsForRole(role).map((item) => item.label);
      for (const expected of UNGATED_LABELS) {
        expect(labels).toContain(expected);
      }
    },
  );

  /**
   * `[Branch Pastor portal]` The approved sidebar, exactly: Dashboard /
   * People / Gatherings / Finance / Insights / Pastoral Care, in that
   * order - Ministry, Stewardship, Administration (Configuration/Audit
   * Log) all absent, and no Bacentas/Basontas standalone item (there
   * never was one - Bacenta/Basonta detail is reached by drill-down from
   * `/ministry/:groupId`, not a top-level nav entry for any role).
   *
   * `[Milestone D — Portal Experiences, Portal 3: Bacenta Leader]`
   * `Outreaches` appended at the end - `ROLE_SPECIFIC_ORDER.ASSISTANT_PASTOR`
   * places `/outreach` last, after `/pastoral-care`.
   */
  it('shows the approved Branch Pastor sidebar, in the approved order, with Ministry/Stewardship/Administration absent', () => {
    const labels = navItemsForRole('ASSISTANT_PASTOR').map((item) => item.label);
    expect(labels).toEqual(['Dashboard', 'People', 'Gatherings', 'Finance', 'Insights', 'Pastoral Care', 'Outreaches']);
    expect(labels).not.toContain('Ministry');
    expect(labels).not.toContain('Stewardship');
    expect(labels).not.toContain('Configuration');
    expect(labels).not.toContain('Audit Log');
  });

  it('shows the dedicated read-only Finance item to Branch Pastor and Branch Administrator - every other role keeps Stewardship, unaffected', () => {
    expect(navItemsForRole('ASSISTANT_PASTOR').map((item) => item.label)).toContain('Finance');
    expect(navItemsForRole('ADMIN').map((item) => item.label)).toContain('Finance');
    for (const role of ['RESIDENT_PASTOR', 'ACTING_RESIDENT_PASTOR', 'BASONTA_LEADER', 'BACENTA_LEADER'] as const) {
      const labels = navItemsForRole(role).map((item) => item.label);
      expect(labels).not.toContain('Finance');
      expect(labels).toContain('Stewardship');
    }
  });

  /** `[Milestone D, Portal 2: Branch Administrator]` Portal 2's own rule:
   * "read-only financial visibility... do NOT expose Treasurer-only
   * mutation controls." `ADMIN` must never see `Stewardship` (the
   * mutation-heavy `StewardshipPage`) - only the dedicated read-only
   * `Finance` item, and never both at once. */
  it('routes Branch Administrator to the read-only Finance item, never the mutation-heavy Stewardship item', () => {
    const labels = navItemsForRole('ADMIN').map((item) => item.label);
    expect(labels).toContain('Finance');
    expect(labels).not.toContain('Stewardship');
  });

  /**
   * `[Milestone D — Portal Experiences, Portal 1: Branch Treasurer]`
   * `TREASURER` sees the Stewardship item's real `/stewardship` route
   * relabeled "Finance" (`labelOverrides`), not Branch Pastor's separate
   * dedicated `/finance` item - same page, same route, only the label
   * changes for this one role.
   */
  it('relabels Stewardship to Finance for Branch Treasurer, without adding a second nav item or changing the route', () => {
    const items = navItemsForRole('TREASURER');
    const labels = items.map((item) => item.label);
    expect(labels).toContain('Finance');
    expect(labels).not.toContain('Stewardship');
    expect(items.filter((item) => item.href === '/stewardship' || item.href === '/finance')).toHaveLength(1);
    expect(items.find((item) => item.label === 'Finance')?.href).toBe('/stewardship');
  });

  /** `[Milestone D — Portal Experiences, Portal 3: Bacenta Leader]`
   * Traced against `permission-matrix.ts`'s real `outreach.event.read`
   * rows, not assumed. `ADMIN` holds no grant at all for this domain. */
  it('shows Outreaches only to the roles holding a real outreach.event.read grant', () => {
    for (const role of ['BACENTA_LEADER', 'BASONTA_LEADER', 'ASSISTANT_PASTOR', 'RESIDENT_PASTOR', 'ACTING_RESIDENT_PASTOR'] as const) {
      expect(navItemsForRole(role).map((i) => i.label)).toContain('Outreaches');
    }
    for (const role of ['ADMIN', 'TREASURER', 'COUNCIL_OVERSEER'] as const) {
      expect(navItemsForRole(role).map((i) => i.label)).not.toContain('Outreaches');
    }
  });

  it('shows Configuration only to ADMIN and COUNCIL_OVERSEER - matches this codebase\'s "Council Administrator roles" client gate (ConfigurationPage.tsx\'s own ALLOWED_ROLES)', () => {
    expect(navItemsForRole('ADMIN').map((i) => i.label)).toContain('Configuration');
    expect(navItemsForRole('COUNCIL_OVERSEER').map((i) => i.label)).toContain('Configuration');
    for (const role of ['RESIDENT_PASTOR', 'ACTING_RESIDENT_PASTOR', 'ASSISTANT_PASTOR', 'BASONTA_LEADER', 'TREASURER', 'BACENTA_LEADER'] as const) {
      expect(navItemsForRole(role).map((i) => i.label)).not.toContain('Configuration');
    }
  });

  it('shows Audit Log only to the roles holding a real, reachable platform.audit_log.read row (RESIDENT_PASTOR/ACTING_RESIDENT_PASTOR/TREASURER/ADMIN) - ASSISTANT_PASTOR/BACENTA_LEADER hold a row too but are structurally unreachable (CLUSTER/OWN_GROUP scope with no matching column), so are correctly omitted', () => {
    for (const role of ['RESIDENT_PASTOR', 'ACTING_RESIDENT_PASTOR', 'TREASURER', 'ADMIN'] as const) {
      expect(navItemsForRole(role).map((i) => i.label)).toContain('Audit Log');
    }
    for (const role of ['ASSISTANT_PASTOR', 'BASONTA_LEADER', 'BACENTA_LEADER', 'COUNCIL_OVERSEER'] as const) {
      expect(navItemsForRole(role).map((i) => i.label)).not.toContain('Audit Log');
    }
  });

  /** `[Milestone D — Portal Experiences, Portal 8: System Administrator]`
   * This role holds exactly one grant in the entire matrix
   * (`platform.tenant.read`, GLOBAL) - traced against
   * `permission-matrix.ts`, not assumed. It previously saw
   * People/Pastoral Care/Ministry/Gatherings/Stewardship purely via the
   * "no `roles` array = every role" default fallthrough, a real bug: the
   * backend already 403s every one of those routes for this role, so
   * each was a dead-end nav item pointing at a page that could only ever
   * show an error. Only Dashboard (its own honest "nothing to administer
   * yet" state) and Insights (the honest generic "not available for this
   * role" stub - also not a broken page) remain. */
  it('shows only Dashboard and Insights for SYSTEM_ADMINISTRATOR - no church-operational nav items this role holds zero RBAC grant for', () => {
    const labels = navItemsForRole('SYSTEM_ADMINISTRATOR').map((i) => i.label);
    expect(labels).toEqual(['Dashboard', 'Insights']);
  });

  it('groups Configuration and Audit Log under one "Administration" heading, in that order', () => {
    const items = navItemsForRole('ADMIN');
    const configuration = items.find((i) => i.label === 'Configuration');
    const auditLog = items.find((i) => i.label === 'Audit Log');
    expect(configuration?.group).toBe('Administration');
    expect(auditLog?.group).toBe('Administration');
    expect(items.indexOf(configuration!)).toBeLessThan(items.indexOf(auditLog!));
  });
});

describe('roleLabel', () => {
  it('applies the three Phase 1 terminology corrections (decisions 2 & 3)', () => {
    expect(roleLabel('COUNCIL_OVERSEER')).toBe('Council Administrator');
    expect(roleLabel('ASSISTANT_PASTOR')).toBe('Branch Pastor');
  });

  /**
   * `[Multi-Tenant Foundation, Phase 2]` `ADMIN`/`TREASURER` relabeled
   * now that `SYSTEM_ADMINISTRATOR` exists and is intentionally
   * restricted - the precondition Phase 1 named for this exact change.
   */
  it('applies the Phase 2 Branch Administrator/Branch Treasurer relabel', () => {
    expect(roleLabel('ADMIN')).toBe('Branch Administrator');
    expect(roleLabel('TREASURER')).toBe('Branch Treasurer');
  });

  it('leaves every other role label unchanged', () => {
    expect(roleLabel('RESIDENT_PASTOR')).toBe('Resident Pastor');
    expect(roleLabel('ACTING_RESIDENT_PASTOR')).toBe('Acting Resident Pastor');
    expect(roleLabel('BACENTA_LEADER')).toBe('Bacenta Leader');
    expect(roleLabel('BASONTA_LEADER')).toBe('Basonta Leader');
  });

  it('resolves the two new Phase 1 roles to their approved Phase 2 labels', () => {
    expect(roleLabel('COUNCIL_TREASURER')).toBe('Council Treasurer');
    expect(roleLabel('SYSTEM_ADMINISTRATOR')).toBe('System Administrator');
  });
});
