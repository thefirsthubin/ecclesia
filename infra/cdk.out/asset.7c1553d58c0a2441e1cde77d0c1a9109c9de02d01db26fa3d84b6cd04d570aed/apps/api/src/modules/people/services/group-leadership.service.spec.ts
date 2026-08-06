import { GroupLeadershipService } from './group-leadership.service';

describe('GroupLeadershipService', () => {
  function buildService() {
    const roleAssignmentRepository = { findActiveBacentaLeader: jest.fn() };
    const service = new GroupLeadershipService(roleAssignmentRepository as never);
    return { service, roleAssignmentRepository };
  }

  it('returns the active Bacenta Leader\'s personId when one exists', async () => {
    const { service, roleAssignmentRepository } = buildService();
    roleAssignmentRepository.findActiveBacentaLeader.mockResolvedValue({ id: 'ra-1', personId: 'shepherd-1' });

    const result = await service.getActiveBacentaLeaderPersonId('bacenta-1', new Date('2026-08-01T00:00:00Z'));

    expect(roleAssignmentRepository.findActiveBacentaLeader).toHaveBeenCalledWith(
      'bacenta-1',
      new Date('2026-08-01T00:00:00Z'),
    );
    expect(result).toBe('shepherd-1');
  });

  it('returns undefined when the Bacenta has no active leader', async () => {
    const { service, roleAssignmentRepository } = buildService();
    roleAssignmentRepository.findActiveBacentaLeader.mockResolvedValue(null);

    const result = await service.getActiveBacentaLeaderPersonId('bacenta-1');

    expect(result).toBeUndefined();
  });
});
