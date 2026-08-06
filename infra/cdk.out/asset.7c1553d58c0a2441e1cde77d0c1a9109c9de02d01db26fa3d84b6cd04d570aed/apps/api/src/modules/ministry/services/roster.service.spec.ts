import { RosterService } from './roster.service';

describe('RosterService', () => {
  function buildService() {
    const groupRosterService = { listActiveMembers: jest.fn(), countActiveMinistryMembershipsForPerson: jest.fn() };
    const service = new RosterService(groupRosterService as never);
    return { service, groupRosterService };
  }

  describe('listRoster', () => {
    it('maps active members onto the roster response shape', async () => {
      const { service, groupRosterService } = buildService();
      const startedAt = new Date('2026-08-01T00:00:00.000Z');
      groupRosterService.listActiveMembers.mockResolvedValue([{ personId: 'person-1', startedAt }]);

      const result = await service.listRoster('basonta-1');

      expect(result).toEqual([{ personId: 'person-1', startedAt: startedAt.toISOString() }]);
    });
  });

  describe('listOvercommitmentFlags', () => {
    it('returns only members at or above the overcommitment threshold', async () => {
      const { service, groupRosterService } = buildService();
      groupRosterService.listActiveMembers.mockResolvedValue([
        { personId: 'person-1', startedAt: new Date() },
        { personId: 'person-2', startedAt: new Date() },
      ]);
      groupRosterService.countActiveMinistryMembershipsForPerson.mockImplementation((personId: string) =>
        Promise.resolve(personId === 'person-1' ? 5 : 1),
      );

      const result = await service.listOvercommitmentFlags('basonta-1');

      expect(result).toEqual([
        { personId: 'person-1', concurrentCommitmentCount: 5, threshold: 4, overcommitted: true },
      ]);
    });

    it('returns an empty list when no member is overcommitted', async () => {
      const { service, groupRosterService } = buildService();
      groupRosterService.listActiveMembers.mockResolvedValue([{ personId: 'person-1', startedAt: new Date() }]);
      groupRosterService.countActiveMinistryMembershipsForPerson.mockResolvedValue(1);

      const result = await service.listOvercommitmentFlags('basonta-1');

      expect(result).toEqual([]);
    });
  });
});
