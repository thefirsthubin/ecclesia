import { DEV_USER_SEEDS, roleAssignmentScopeKindFor } from './dev-users';

/**
 * `[Multi-Tenant Foundation, Phase 2]` Static, DB-free coverage for the
 * nine-persona roster and its RoleAssignment-scope decision. Everything
 * here is checkable without a live Postgres connection - the actual
 * database-backed properties (re-running the seed doesn't duplicate
 * rows, a seeded persona's real ActorContext resolves correctly, dev
 * login authenticates end-to-end) are exercised by `db/seed-dev-users.ts`
 * itself and need a real database this suite intentionally does not
 * pretend to have.
 */
describe('DEV_USER_SEEDS', () => {
  const EXPECTED_PERSONAS: Record<string, string> = {
    'dev-resident-pastor': 'RESIDENT_PASTOR',
    'dev-council-administrator': 'COUNCIL_OVERSEER',
    'dev-council-treasurer': 'COUNCIL_TREASURER',
    'dev-assistant-pastor': 'ASSISTANT_PASTOR',
    'dev-super-administrator': 'ADMIN',
    'dev-treasurer': 'TREASURER',
    'dev-bacenta-leader': 'BACENTA_LEADER',
    'dev-basonta-leader': 'BASONTA_LEADER',
    'dev-system-administrator': 'SYSTEM_ADMINISTRATOR',
  };

  it('exposes exactly the nine approved portal personas, one role each', () => {
    expect(DEV_USER_SEEDS).toHaveLength(9);
    const roles = DEV_USER_SEEDS.map((seed) => seed.role);
    expect(new Set(roles).size).toBe(9); // no role repeated
    for (const seed of DEV_USER_SEEDS) {
      expect(EXPECTED_PERSONAS[seed.id]).toBe(seed.role);
    }
  });

  it('has no standalone Usher persona', () => {
    expect(DEV_USER_SEEDS.find((seed) => seed.id === 'dev-usher')).toBeUndefined();
    // `DevUserRole` (dev-users.ts) no longer even has a `'USHER'` member -
    // a `seed.role === 'USHER'` comparison would now be a TypeScript
    // compile error, which is itself a stronger guarantee than a runtime
    // check could give: no persona in this file's type can hold that role.
    expect(DEV_USER_SEEDS.find((seed) => seed.label.toLowerCase().includes('usher'))).toBeUndefined();
  });

  it('every persona has a stable id, a non-empty label, and a unique email', () => {
    const ids = new Set<string>();
    const emails = new Set<string>();
    for (const seed of DEV_USER_SEEDS) {
      expect(seed.id.length).toBeGreaterThan(0);
      expect(seed.label.length).toBeGreaterThan(0);
      expect(ids.has(seed.id)).toBe(false);
      expect(emails.has(seed.email)).toBe(false);
      ids.add(seed.id);
      emails.add(seed.email);
    }
  });

  it('Bacenta Leader and Basonta Leader carry a contextual Bacenta/Basonta label; Council-scoped and platform personas do not', () => {
    const bacentaLeader = DEV_USER_SEEDS.find((seed) => seed.id === 'dev-bacenta-leader');
    const basontaLeader = DEV_USER_SEEDS.find((seed) => seed.id === 'dev-basonta-leader');
    expect(bacentaLeader?.context).toBe('Grace Bacenta');
    expect(basontaLeader?.context).toBe('Ushering');

    for (const id of ['dev-resident-pastor', 'dev-council-administrator', 'dev-council-treasurer', 'dev-system-administrator']) {
      const seed = DEV_USER_SEEDS.find((s) => s.id === id);
      expect(seed?.context).toBeUndefined();
    }
  });

  it('Branch-scoped personas carry the Headquarters context label, not folded into the role identifier', () => {
    for (const id of ['dev-assistant-pastor', 'dev-super-administrator', 'dev-treasurer']) {
      const seed = DEV_USER_SEEDS.find((s) => s.id === id);
      expect(seed?.context).toBe('River of Life Headquarters');
      // The role/label fields themselves must stay exactly the canonical
      // persona name - context is a separate field, never appended to them.
      expect(seed?.role).not.toMatch(/Headquarters/);
      expect(seed?.label).not.toMatch(/Headquarters/);
    }
  });
});

describe('roleAssignmentScopeKindFor()', () => {
  it('classifies Resident Pastor, Council Administrator, and Council Treasurer as COUNCIL', () => {
    expect(roleAssignmentScopeKindFor('RESIDENT_PASTOR')).toBe('COUNCIL');
    expect(roleAssignmentScopeKindFor('COUNCIL_OVERSEER')).toBe('COUNCIL');
    expect(roleAssignmentScopeKindFor('COUNCIL_TREASURER')).toBe('COUNCIL');
  });

  it('classifies Branch Pastor, Branch Administrator, Branch Treasurer, Bacenta Leader, and Basonta Leader as BRANCH', () => {
    expect(roleAssignmentScopeKindFor('ASSISTANT_PASTOR')).toBe('BRANCH');
    expect(roleAssignmentScopeKindFor('ADMIN')).toBe('BRANCH');
    expect(roleAssignmentScopeKindFor('TREASURER')).toBe('BRANCH');
    expect(roleAssignmentScopeKindFor('BACENTA_LEADER')).toBe('BRANCH');
    expect(roleAssignmentScopeKindFor('BASONTA_LEADER')).toBe('BRANCH');
  });

  it('classifies System Administrator as PLATFORM', () => {
    expect(roleAssignmentScopeKindFor('SYSTEM_ADMINISTRATOR')).toBe('PLATFORM');
  });

  it('agrees with every seeded persona\'s actual role - the roster and the scope decision can never silently disagree', () => {
    for (const seed of DEV_USER_SEEDS) {
      const kind = roleAssignmentScopeKindFor(seed.role);
      expect(['COUNCIL', 'BRANCH', 'PLATFORM']).toContain(kind);
    }
  });
});
