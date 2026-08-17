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
   */
  it.each(['RESIDENT_PASTOR', 'ACTING_RESIDENT_PASTOR', 'BASONTA_LEADER', 'TREASURER', 'ADMIN', 'BACENTA_LEADER'] as const)(
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
   */
  it('shows the approved Branch Pastor sidebar, in the approved order, with Ministry/Stewardship/Administration absent', () => {
    const labels = navItemsForRole('ASSISTANT_PASTOR').map((item) => item.label);
    expect(labels).toEqual(['Dashboard', 'People', 'Gatherings', 'Finance', 'Insights', 'Pastoral Care']);
    expect(labels).not.toContain('Ministry');
    expect(labels).not.toContain('Stewardship');
    expect(labels).not.toContain('Configuration');
    expect(labels).not.toContain('Audit Log');
  });

  it('shows Finance only to Branch Pastor - every other role keeps Stewardship, unaffected', () => {
    expect(navItemsForRole('ASSISTANT_PASTOR').map((item) => item.label)).toContain('Finance');
    for (const role of ['RESIDENT_PASTOR', 'ACTING_RESIDENT_PASTOR', 'BASONTA_LEADER', 'TREASURER', 'ADMIN', 'BACENTA_LEADER'] as const) {
      const labels = navItemsForRole(role).map((item) => item.label);
      expect(labels).not.toContain('Finance');
      expect(labels).toContain('Stewardship');
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
