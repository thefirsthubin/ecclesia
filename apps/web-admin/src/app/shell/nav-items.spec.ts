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

  it.each(['RESIDENT_PASTOR', 'ACTING_RESIDENT_PASTOR', 'ASSISTANT_PASTOR', 'BASONTA_LEADER', 'TREASURER', 'ADMIN', 'BACENTA_LEADER'] as const)(
    'shows every ungated item to %s',
    (role) => {
      const labels = navItemsForRole(role).map((item) => item.label);
      for (const expected of UNGATED_LABELS) {
        expect(labels).toContain(expected);
      }
    },
  );

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
  it('applies the three approved terminology corrections (decisions 2 & 3)', () => {
    expect(roleLabel('ADMIN')).toBe('Super Administrator');
    expect(roleLabel('COUNCIL_OVERSEER')).toBe('Council Administrator');
    expect(roleLabel('ASSISTANT_PASTOR')).toBe('Branch Pastor');
  });

  it('leaves every other role label unchanged', () => {
    expect(roleLabel('RESIDENT_PASTOR')).toBe('Resident Pastor');
    expect(roleLabel('ACTING_RESIDENT_PASTOR')).toBe('Acting Resident Pastor');
    expect(roleLabel('BACENTA_LEADER')).toBe('Bacenta Leader');
    expect(roleLabel('BASONTA_LEADER')).toBe('Basonta Leader');
    expect(roleLabel('TREASURER')).toBe('Treasurer');
  });
});
