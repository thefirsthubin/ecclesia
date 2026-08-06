import type { ActorContext } from '@ecclesia/rbac';

import { VisitorIntakeService } from './visitor-intake.service';

const NOW = new Date('2026-08-01T00:00:00.000Z');

function buildPerson(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'person-1',
    branchId: 'branch-1',
    firstName: 'Jane',
    lastName: 'Doe',
    phone: null,
    email: null,
    dateOfBirth: null,
    address: null,
    lifecycleStage: 'VISITOR',
    guardianPersonId: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function buildSubmission(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'vis-1',
    branchId: 'branch-1',
    gatheringId: null,
    personId: 'person-1',
    submittedData: {},
    createdAt: NOW,
    ...overrides,
  };
}

describe('VisitorIntakeService', () => {
  const actor: ActorContext = { personId: 'usher-1', role: 'BACENTA_LEADER', branchId: 'branch-1' };

  function buildService() {
    const visitorIntakeRepository = { create: jest.fn() };
    const personService = { create: jest.fn(), transitionLifecycleStage: jest.fn() };
    const groupLeadershipService = { getActiveBacentaLeaderPersonId: jest.fn() };
    const followUpTaskService = { create: jest.fn() };
    const service = new VisitorIntakeService(
      visitorIntakeRepository as never,
      personService as never,
      groupLeadershipService as never,
      followUpTaskService as never,
    );
    return { service, visitorIntakeRepository, personService, groupLeadershipService, followUpTaskService };
  }

  it('always creates the Person via PersonService.create (reusing FR-PPL-01/FR-PPL-02)', async () => {
    const { service, personService, visitorIntakeRepository } = buildService();
    personService.create.mockResolvedValue(buildPerson());
    visitorIntakeRepository.create.mockResolvedValue(buildSubmission());

    await service.submit(actor, { firstName: 'Jane', lastName: 'Doe', firstTimeGuest: false } as never);

    expect(personService.create).toHaveBeenCalledWith(
      actor,
      expect.objectContaining({ firstName: 'Jane', lastName: 'Doe', overrideDuplicateCheck: false }),
    );
  });

  it('transitions the Person to FIRST_TIME_GUEST only when firstTimeGuest is true', async () => {
    const { service, personService, visitorIntakeRepository } = buildService();
    personService.create.mockResolvedValue(buildPerson());
    visitorIntakeRepository.create.mockResolvedValue(buildSubmission());

    await service.submit(actor, { firstName: 'Jane', lastName: 'Doe', firstTimeGuest: false } as never);
    expect(personService.transitionLifecycleStage).not.toHaveBeenCalled();

    personService.create.mockClear();
    personService.transitionLifecycleStage.mockClear();
    personService.create.mockResolvedValue(buildPerson());

    await service.submit(actor, { firstName: 'Jane', lastName: 'Doe', firstTimeGuest: true } as never);
    expect(personService.transitionLifecycleStage).toHaveBeenCalledWith('person-1', { toStage: 'FIRST_TIME_GUEST' });
  });

  it('auto-creates a Follow-up task when firstTimeGuest and a Bacenta preference resolves to an active Shepherd (US-A2)', async () => {
    const { service, personService, groupLeadershipService, followUpTaskService, visitorIntakeRepository } = buildService();
    personService.create.mockResolvedValue(buildPerson());
    groupLeadershipService.getActiveBacentaLeaderPersonId.mockResolvedValue('shepherd-1');
    visitorIntakeRepository.create.mockResolvedValue(buildSubmission());

    const result = await service.submit(actor, {
      firstName: 'Jane',
      lastName: 'Doe',
      firstTimeGuest: true,
      bacentaPreferenceGroupId: 'bacenta-1',
    } as never);

    expect(groupLeadershipService.getActiveBacentaLeaderPersonId).toHaveBeenCalledWith('bacenta-1');
    expect(followUpTaskService.create).toHaveBeenCalledWith(
      actor,
      'person-1',
      expect.objectContaining({ assignedToPersonId: 'shepherd-1', groupId: 'bacenta-1', trigger: 'FIRST_TIME_GUEST' }),
    );
    expect(result.followUpTaskCreated).toBe(true);
  });

  it('does not auto-create a Follow-up task when no Bacenta preference is supplied', async () => {
    const { service, personService, followUpTaskService, visitorIntakeRepository } = buildService();
    personService.create.mockResolvedValue(buildPerson());
    visitorIntakeRepository.create.mockResolvedValue(buildSubmission());

    const result = await service.submit(actor, { firstName: 'Jane', lastName: 'Doe', firstTimeGuest: true } as never);

    expect(followUpTaskService.create).not.toHaveBeenCalled();
    expect(result.followUpTaskCreated).toBe(false);
  });

  it('does not auto-create a Follow-up task when the Bacenta preference has no active Shepherd (unresolved rotation gap)', async () => {
    const { service, personService, groupLeadershipService, followUpTaskService, visitorIntakeRepository } = buildService();
    personService.create.mockResolvedValue(buildPerson());
    groupLeadershipService.getActiveBacentaLeaderPersonId.mockResolvedValue(undefined);
    visitorIntakeRepository.create.mockResolvedValue(buildSubmission());

    const result = await service.submit(actor, {
      firstName: 'Jane',
      lastName: 'Doe',
      firstTimeGuest: true,
      bacentaPreferenceGroupId: 'bacenta-1',
    } as never);

    expect(followUpTaskService.create).not.toHaveBeenCalled();
    expect(result.followUpTaskCreated).toBe(false);
  });

  it('persists the raw submitted form data alongside the created personId', async () => {
    const { service, personService, visitorIntakeRepository } = buildService();
    personService.create.mockResolvedValue(buildPerson());
    visitorIntakeRepository.create.mockResolvedValue(buildSubmission());

    await service.submit(actor, {
      firstName: 'Jane',
      lastName: 'Doe',
      howTheyHeard: 'Friend',
      firstTimeGuest: false,
    } as never);

    expect(visitorIntakeRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        branchId: 'branch-1',
        personId: 'person-1',
        submittedData: expect.objectContaining({ firstName: 'Jane', lastName: 'Doe', howTheyHeard: 'Friend' }),
      }),
    );
  });
});
