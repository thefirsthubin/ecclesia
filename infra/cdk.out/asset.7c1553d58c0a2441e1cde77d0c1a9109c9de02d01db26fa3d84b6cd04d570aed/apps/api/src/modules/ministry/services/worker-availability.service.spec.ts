import type { ActorContext } from '@ecclesia/rbac';

import { WorkerAvailabilityService } from './worker-availability.service';

const NOW = new Date('2026-08-01T00:00:00.000Z');

function buildAvailability(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'availability-1',
    branchId: 'branch-1',
    personId: 'person-1',
    unavailableFrom: new Date('2026-09-01'),
    unavailableTo: new Date('2026-09-14'),
    reason: 'travel',
    createdAt: NOW,
    ...overrides,
  };
}

describe('WorkerAvailabilityService', () => {
  const worker: ActorContext = { personId: 'person-1', role: 'WORKER', branchId: 'branch-1' };

  function buildService() {
    const workerAvailabilityRepository = { create: jest.fn(), listByPerson: jest.fn() };
    const service = new WorkerAvailabilityService(workerAvailabilityRepository as never);
    return { service, workerAvailabilityRepository };
  }

  it('create() always attributes the window to the acting Person, never a client-supplied personId', async () => {
    const { service, workerAvailabilityRepository } = buildService();
    workerAvailabilityRepository.create.mockResolvedValue(buildAvailability());

    await service.create(worker, { unavailableFrom: '2026-09-01', unavailableTo: '2026-09-14', reason: 'travel' });

    expect(workerAvailabilityRepository.create).toHaveBeenCalledWith({
      branchId: 'branch-1',
      personId: 'person-1',
      unavailableFrom: new Date('2026-09-01'),
      unavailableTo: new Date('2026-09-14'),
      reason: 'travel',
    });
  });

  it('create() formats the response dates as date-only strings', async () => {
    const { service, workerAvailabilityRepository } = buildService();
    workerAvailabilityRepository.create.mockResolvedValue(buildAvailability());

    const result = await service.create(worker, { unavailableFrom: '2026-09-01', unavailableTo: '2026-09-14' });

    expect(result.unavailableFrom).toBe('2026-09-01');
    expect(result.unavailableTo).toBe('2026-09-14');
  });

  it('listForActor() lists only the acting Person\'s own windows', async () => {
    const { service, workerAvailabilityRepository } = buildService();
    workerAvailabilityRepository.listByPerson.mockResolvedValue([buildAvailability()]);

    const result = await service.listForActor(worker);

    expect(workerAvailabilityRepository.listByPerson).toHaveBeenCalledWith('person-1');
    expect(result).toHaveLength(1);
  });
});
