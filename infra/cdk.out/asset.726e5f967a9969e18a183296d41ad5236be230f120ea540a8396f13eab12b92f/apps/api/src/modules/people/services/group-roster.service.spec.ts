import { GroupRosterService } from './group-roster.service';

describe('GroupRosterService', () => {
  function buildService() {
    const groupMembershipRepository = {
      countActiveByGroup: jest.fn(),
      listActiveByGroup: jest.fn(),
      countActiveMinistryMembershipsForPerson: jest.fn(),
    };
    const service = new GroupRosterService(groupMembershipRepository as never);
    return { service, groupMembershipRepository };
  }

  it('countActiveMembers() delegates to the repository', async () => {
    const { service, groupMembershipRepository } = buildService();
    groupMembershipRepository.countActiveByGroup.mockResolvedValue(5);

    const result = await service.countActiveMembers('basonta-1');

    expect(groupMembershipRepository.countActiveByGroup).toHaveBeenCalledWith('basonta-1');
    expect(result).toBe(5);
  });

  it('listActiveMembers() delegates to the repository', async () => {
    const { service, groupMembershipRepository } = buildService();
    groupMembershipRepository.listActiveByGroup.mockResolvedValue([{ personId: 'person-1', startedAt: new Date() }]);

    const result = await service.listActiveMembers('basonta-1');

    expect(groupMembershipRepository.listActiveByGroup).toHaveBeenCalledWith('basonta-1');
    expect(result).toHaveLength(1);
  });

  it('countActiveMinistryMembershipsForPerson() delegates to the repository', async () => {
    const { service, groupMembershipRepository } = buildService();
    groupMembershipRepository.countActiveMinistryMembershipsForPerson.mockResolvedValue(3);

    const result = await service.countActiveMinistryMembershipsForPerson('person-1');

    expect(groupMembershipRepository.countActiveMinistryMembershipsForPerson).toHaveBeenCalledWith('person-1');
    expect(result).toBe(3);
  });
});
