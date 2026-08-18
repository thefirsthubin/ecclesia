import { evaluate } from './evaluate';
import { PERMISSION_MATRIX } from './permission-matrix';
import type { ActorContext, BranchConfiguration } from './types';

/**
 * `[Milestone B: People + Pastoral + Outreach Foundation]` The mandatory
 * privacy regression test this milestone's own brief explicitly names:
 * "Pastor can see private prayer note. Bacenta Leader cannot. Basonta
 * Leader cannot. Branch Admin cannot. Treasurer cannot. System
 * Administrator cannot." A named, concrete scenario a reviewer can read
 * without cross-referencing anything else - the same reasoning
 * `council-scope-isolation.spec.ts` states for its own existence, applied
 * here to the private pastoral domain (MILESTONE_B_DESIGN_NOTES.md Part
 * 5/6's approved Option C).
 *
 * Uses the real `evaluate()` function and the real, production
 * `PERMISSION_MATRIX` - no mocked RBAC internals.
 */
describe('[Milestone B] Prayer note privacy isolation (mandatory regression test)', () => {
  const GATE_DISABLED: BranchConfiguration = { poimenGateEnabled: false };
  const RESOURCE = { branchId: 'branch-1', bacentaId: 'bacenta-1' };

  const residentPastor: ActorContext = { personId: 'rp-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };
  const assistantPastor: ActorContext = { personId: 'ap-1', role: 'ASSISTANT_PASTOR', branchId: 'branch-1', clusterBacentaIds: ['bacenta-1'] };
  const bacentaLeader: ActorContext = { personId: 'bl-1', role: 'BACENTA_LEADER', branchId: 'branch-1', bacentaId: 'bacenta-1' };
  const basontaLeader: ActorContext = { personId: 'bsl-1', role: 'BASONTA_LEADER', branchId: 'branch-1', basontaId: 'basonta-1' };
  const branchAdmin: ActorContext = { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' };
  const treasurer: ActorContext = { personId: 'treas-1', role: 'TREASURER', branchId: 'branch-1' };
  const councilOverseer: ActorContext = { personId: 'co-1', role: 'COUNCIL_OVERSEER', branchId: 'branch-1' };
  const councilTreasurer: ActorContext = { personId: 'ct-1', role: 'COUNCIL_TREASURER', branchId: 'branch-1' };
  const systemAdministrator: ActorContext = { personId: 'sa-1', role: 'SYSTEM_ADMINISTRATOR', branchId: 'branch-1' };

  it('Resident Pastor CAN read pastoral_care.prayer_note (organizational scope - author-only narrowing happens at the query layer, not here)', () => {
    const decision = evaluate(residentPastor, 'pastoral_care.prayer_note.read', RESOURCE, GATE_DISABLED, PERMISSION_MATRIX);
    expect(decision.effect).toBe('ALLOW');
  });

  it('Assistant Pastor CAN read pastoral_care.prayer_note within their own Cluster', () => {
    const decision = evaluate(assistantPastor, 'pastoral_care.prayer_note.read', RESOURCE, GATE_DISABLED, PERMISSION_MATRIX);
    expect(decision.effect).toBe('ALLOW');
  });

  it('Bacenta Leader CANNOT read pastoral_care.prayer_note - no rule at all, unlike pastoral_care.notes', () => {
    const decision = evaluate(bacentaLeader, 'pastoral_care.prayer_note.read', RESOURCE, GATE_DISABLED, PERMISSION_MATRIX);
    expect(decision.effect).toBe('DENY');
  });

  it('Basonta Leader CANNOT read pastoral_care.prayer_note', () => {
    const decision = evaluate(basontaLeader, 'pastoral_care.prayer_note.read', { branchId: 'branch-1', basontaId: 'basonta-1' }, GATE_DISABLED, PERMISSION_MATRIX);
    expect(decision.effect).toBe('DENY');
  });

  it('Branch Admin CANNOT read pastoral_care.prayer_note - explicit DENY, same NFR-PRIV-01 posture as pastoral_care.notes', () => {
    const decision = evaluate(branchAdmin, 'pastoral_care.prayer_note.read', { branchId: 'branch-1' }, GATE_DISABLED, PERMISSION_MATRIX);
    expect(decision.effect).toBe('DENY');
  });

  it('Treasurer CANNOT read pastoral_care.prayer_note - no rule at all', () => {
    const decision = evaluate(treasurer, 'pastoral_care.prayer_note.read', { branchId: 'branch-1' }, GATE_DISABLED, PERMISSION_MATRIX);
    expect(decision.effect).toBe('DENY');
  });

  it('Council Overseer CANNOT read pastoral_care.prayer_note - zero RBAC rows for this role at all', () => {
    const decision = evaluate(councilOverseer, 'pastoral_care.prayer_note.read', { branchId: 'branch-1' }, GATE_DISABLED, PERMISSION_MATRIX);
    expect(decision.effect).toBe('DENY');
  });

  it('Council Treasurer CANNOT read pastoral_care.prayer_note', () => {
    const decision = evaluate(councilTreasurer, 'pastoral_care.prayer_note.read', { branchId: 'branch-1' }, GATE_DISABLED, PERMISSION_MATRIX);
    expect(decision.effect).toBe('DENY');
  });

  it('System Administrator CANNOT read pastoral_care.prayer_note', () => {
    const decision = evaluate(systemAdministrator, 'pastoral_care.prayer_note.read', { branchId: 'branch-1' }, GATE_DISABLED, PERMISSION_MATRIX);
    expect(decision.effect).toBe('DENY');
  });

  it('the same DENY pattern holds for .create, not just .read', () => {
    expect(evaluate(bacentaLeader, 'pastoral_care.prayer_note.create', RESOURCE, GATE_DISABLED, PERMISSION_MATRIX).effect).toBe('DENY');
    expect(evaluate(branchAdmin, 'pastoral_care.prayer_note.create', { branchId: 'branch-1' }, GATE_DISABLED, PERMISSION_MATRIX).effect).toBe('DENY');
    expect(evaluate(treasurer, 'pastoral_care.prayer_note.create', { branchId: 'branch-1' }, GATE_DISABLED, PERMISSION_MATRIX).effect).toBe('DENY');
  });

  /**
   * `[Milestone B]` The approved decision: even Resident Pastor and
   * Assistant Pastor do not see each other's prayer notes. The RBAC
   * matrix cannot express this (both roles genuinely hold ALLOW at the
   * scope level, deliberately - a Resident Pastor must be able to reach
   * the endpoint for a Person, just not see an Assistant Pastor's notes
   * about them) - the real enforcement is
   * `PrayerNoteRepository.findByPersonAndAuthor`'s query filter, exercised
   * directly in `prayer-note.service.spec.ts` and `prayer-note.repository.spec.ts`.
   * Documented here so the full privacy picture (RBAC layer + query-filter
   * layer) is legible from one place, matching this file's own
   * "no cross-referencing needed" design goal.
   */
  it('both pastor roles pass the RBAC scope check for the same resource - proving author-only is enforced elsewhere, not by scope', () => {
    expect(evaluate(residentPastor, 'pastoral_care.prayer_note.read', RESOURCE, GATE_DISABLED, PERMISSION_MATRIX).effect).toBe('ALLOW');
    expect(evaluate(assistantPastor, 'pastoral_care.prayer_note.read', RESOURCE, GATE_DISABLED, PERMISSION_MATRIX).effect).toBe('ALLOW');
    // See prayer-note.repository.spec.ts's "findByPersonAndAuthor - the
    // author-only enforcement point" and prayer-note.service.spec.ts's
    // "Resident Pastor and Assistant Pastor querying the same subject
    // Person get different author-filtered queries" for the actual
    // query-layer proof that these two ALLOWs never let one pastor read
    // the other's content.
  });
});
