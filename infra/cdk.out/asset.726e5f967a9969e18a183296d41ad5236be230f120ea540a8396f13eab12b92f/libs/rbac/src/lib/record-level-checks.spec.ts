import { RECORD_LEVEL_CHECKS } from './record-level-checks';
import type { ActorContext, BranchConfiguration, ResourceContext } from './types';

const actor: ActorContext = { personId: 'person-1', role: 'TREASURER', branchId: 'branch-1' };
const GATE_DISABLED: BranchConfiguration = { poimenGateEnabled: false };
const GATE_ENABLED: BranchConfiguration = { poimenGateEnabled: true };

describe('DIFFERENT_ACTOR_THAN_RECORDER (PRD §17.4 / BR-STW-04)', () => {
  const check = RECORD_LEVEL_CHECKS.DIFFERENT_ACTOR_THAN_RECORDER;

  it('fails when the verifying actor is the same Person who recorded the transaction', () => {
    const resource: ResourceContext = { branchId: 'branch-1', recordedByPersonId: 'person-1' };
    expect(check(actor, resource, GATE_DISABLED).passed).toBe(false);
  });

  it('passes when the verifying actor differs from the recorder', () => {
    const resource: ResourceContext = { branchId: 'branch-1', recordedByPersonId: 'person-2' };
    expect(check(actor, resource, GATE_DISABLED).passed).toBe(true);
  });

  it('fails closed when the resource carries no recordedByPersonId at all', () => {
    const resource: ResourceContext = { branchId: 'branch-1' };
    expect(check(actor, resource, GATE_DISABLED).passed).toBe(false);
  });

  it('does not depend on Branch configuration', () => {
    const resource: ResourceContext = { branchId: 'branch-1', recordedByPersonId: 'person-2' };
    expect(check(actor, resource, GATE_ENABLED).passed).toBe(true);
  });
});

describe('POIMEN_GATE_IF_ENABLED (resolved PRD §24 OQ-02)', () => {
  const check = RECORD_LEVEL_CHECKS.POIMEN_GATE_IF_ENABLED;
  const pastor: ActorContext = { personId: 'pastor-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };

  it('always passes when the Branch has not enabled the gate, regardless of Poimen status', () => {
    const notStarted: ResourceContext = { branchId: 'branch-1', candidatePoimenStatus: 'NOT_STARTED' };
    expect(check(pastor, notStarted, GATE_DISABLED).passed).toBe(true);
  });

  it('passes when the gate is enabled and the candidate has COMPLETE Poimen status', () => {
    const complete: ResourceContext = { branchId: 'branch-1', candidatePoimenStatus: 'COMPLETE' };
    expect(check(pastor, complete, GATE_ENABLED).passed).toBe(true);
  });

  it('fails when the gate is enabled and the candidate has not completed Poimen', () => {
    const inProgress: ResourceContext = { branchId: 'branch-1', candidatePoimenStatus: 'IN_PROGRESS' };
    expect(check(pastor, inProgress, GATE_ENABLED).passed).toBe(false);
  });

  it('fails when the gate is enabled and the resource carries no Poimen status at all', () => {
    const noStatus: ResourceContext = { branchId: 'branch-1' };
    expect(check(pastor, noStatus, GATE_ENABLED).passed).toBe(false);
  });
});
