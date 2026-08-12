import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

import { GroupMembershipService } from './group-membership.service';

describe('GroupMembershipService', () => {
  function buildService() {
    const groupMembershipRepository = {
      findGroupById: jest.fn(),
      applyChange: jest.fn(),
      listByPerson: jest.fn(),
      countDistinctActiveMinistryMembersByBranch: jest.fn(),
    };
    const personRepository = {
      findById: jest.fn(),
      findActiveGroupMemberships: jest.fn().mockResolvedValue([]),
    };
    const eventPublisher = { publish: jest.fn() };
    const service = new GroupMembershipService(groupMembershipRepository as never, personRepository as never, eventPublisher as never);
    return { service, groupMembershipRepository, personRepository, eventPublisher };
  }

  const membershipRow = {
    id: 'membership-1',
    personId: 'person-1',
    groupId: 'bacenta-2',
    groupType: 'PASTORAL_CARE',
    startedAt: new Date('2026-01-01T00:00:00Z'),
    endedAt: null,
    reason: null,
  };

  it('throws NotFoundException when the Person does not exist', async () => {
    const { service, personRepository } = buildService();
    personRepository.findById.mockResolvedValue(null);

    await expect(service.assign('missing', { groupId: 'bacenta-2' })).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when the Group does not exist', async () => {
    const { service, personRepository, groupMembershipRepository } = buildService();
    personRepository.findById.mockResolvedValue({ id: 'person-1', branchId: 'branch-1', lifecycleStage: 'MEMBER' });
    groupMembershipRepository.findGroupById.mockResolvedValue(null);

    await expect(service.assign('person-1', { groupId: 'missing-group' })).rejects.toThrow(NotFoundException);
  });

  it('requires a reason when the assignment closes an existing active Bacenta membership', async () => {
    const { service, personRepository, groupMembershipRepository } = buildService();
    personRepository.findById.mockResolvedValue({ id: 'person-1', branchId: 'branch-1', lifecycleStage: 'MEMBER' });
    personRepository.findActiveGroupMemberships.mockResolvedValue([
      { id: 'membership-old', groupId: 'bacenta-1', groupType: 'PASTORAL_CARE' },
    ]);
    groupMembershipRepository.findGroupById.mockResolvedValue({ id: 'bacenta-2', type: 'PASTORAL_CARE' });

    await expect(service.assign('person-1', { groupId: 'bacenta-2' })).rejects.toThrow(BadRequestException);
    expect(groupMembershipRepository.applyChange).not.toHaveBeenCalled();
  });

  it('rejects re-joining the same active group as a ConflictException', async () => {
    const { service, personRepository, groupMembershipRepository } = buildService();
    personRepository.findById.mockResolvedValue({ id: 'person-1', branchId: 'branch-1', lifecycleStage: 'MEMBER' });
    personRepository.findActiveGroupMemberships.mockResolvedValue([
      { id: 'membership-old', groupId: 'bacenta-1', groupType: 'PASTORAL_CARE' },
    ]);
    groupMembershipRepository.findGroupById.mockResolvedValue({ id: 'bacenta-1', type: 'PASTORAL_CARE' });

    await expect(service.assign('person-1', { groupId: 'bacenta-1' })).rejects.toThrow(ConflictException);
  });

  it('applies the change and requests a lifecycle-stage update when the Person is in FOLLOW_UP (PRD §19.1 step 6)', async () => {
    const { service, personRepository, groupMembershipRepository, eventPublisher } = buildService();
    personRepository.findById.mockResolvedValue({ id: 'person-1', branchId: 'branch-1', lifecycleStage: 'FOLLOW_UP' });
    groupMembershipRepository.findGroupById.mockResolvedValue({ id: 'bacenta-2', type: 'PASTORAL_CARE' });
    groupMembershipRepository.applyChange.mockResolvedValue(membershipRow);

    const result = await service.assign('person-1', { groupId: 'bacenta-2' });

    expect(groupMembershipRepository.applyChange).toHaveBeenCalledWith(
      expect.objectContaining({ personLifecycleStageUpdate: 'ASSIGNED_TO_BACENTA' }),
    );
    expect(result.id).toBe('membership-1');
    // Bacenta (PASTORAL_CARE) engagement itself is signalled via
    // attendance, not roster membership - see AttendanceRecordService's
    // bacenta_meeting.attendance_recorded and this service's own doc
    // comment on basonta_roster.updated - but the PRD §19.1 step 6
    // lifecycle-stage side effect (FOLLOW_UP -> ASSIGNED_TO_BACENTA,
    // asserted above) is itself a lifecycle_stage.transitioned signal.
    expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
    expect(eventPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'lifecycle_stage.transitioned',
        subjectPersonId: 'person-1',
        payload: { fromStage: 'FOLLOW_UP', toStage: 'ASSIGNED_TO_BACENTA' },
      }),
    );
  });

  it('does not request a lifecycle-stage update for a Member being reassigned, and publishes no signal', async () => {
    const { service, personRepository, groupMembershipRepository, eventPublisher } = buildService();
    personRepository.findById.mockResolvedValue({ id: 'person-1', branchId: 'branch-1', lifecycleStage: 'MEMBER' });
    personRepository.findActiveGroupMemberships.mockResolvedValue([
      { id: 'membership-old', groupId: 'bacenta-1', groupType: 'PASTORAL_CARE' },
    ]);
    groupMembershipRepository.findGroupById.mockResolvedValue({ id: 'bacenta-2', type: 'PASTORAL_CARE' });
    groupMembershipRepository.applyChange.mockResolvedValue(membershipRow);

    await service.assign('person-1', { groupId: 'bacenta-2', reason: 'moved house' });

    expect(groupMembershipRepository.applyChange).toHaveBeenCalledWith(
      expect.objectContaining({ personLifecycleStageUpdate: undefined }),
    );
    expect(eventPublisher.publish).not.toHaveBeenCalled();
  });

  it('never requests a lifecycle-stage update for a MINISTRY (Basonta) assignment, but does publish basonta_roster.updated', async () => {
    const { service, personRepository, groupMembershipRepository, eventPublisher } = buildService();
    personRepository.findById.mockResolvedValue({ id: 'person-1', branchId: 'branch-1', lifecycleStage: 'FOLLOW_UP' });
    groupMembershipRepository.findGroupById.mockResolvedValue({ id: 'basonta-1', type: 'MINISTRY' });
    groupMembershipRepository.applyChange.mockResolvedValue({ ...membershipRow, groupId: 'basonta-1', groupType: 'MINISTRY' });

    await service.assign('person-1', { groupId: 'basonta-1' });

    expect(groupMembershipRepository.applyChange).toHaveBeenCalledWith(
      expect.objectContaining({ personLifecycleStageUpdate: undefined }),
    );
    expect(eventPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'basonta_roster.updated',
        branchId: 'branch-1',
        subjectPersonId: 'person-1',
        subjectGroupId: 'basonta-1',
      }),
    );
  });

  describe('listForPerson (FR-PPL-07)', () => {
    it('maps every membership returned by the repository to a response DTO', async () => {
      const { service, groupMembershipRepository } = buildService();
      groupMembershipRepository.listByPerson.mockResolvedValue([membershipRow, { ...membershipRow, id: 'membership-2', endedAt: new Date('2026-02-01T00:00:00Z') }]);

      const result = await service.listForPerson('person-1');

      expect(groupMembershipRepository.listByPerson).toHaveBeenCalledWith('person-1');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('membership-1');
      expect(result[1].endedAt).toBe('2026-02-01T00:00:00.000Z');
    });
  });

  describe('countDistinctActiveMinistryMembersByBranch (Resident Pastor Dashboard - Volunteers milestone)', () => {
    it('delegates directly to groupMembershipRepository.countDistinctActiveMinistryMembersByBranch', async () => {
      const { service, groupMembershipRepository } = buildService();
      const asOf = new Date('2026-08-01T00:00:00.000Z');
      groupMembershipRepository.countDistinctActiveMinistryMembersByBranch.mockResolvedValue(67);

      const result = await service.countDistinctActiveMinistryMembersByBranch('branch-1', asOf);

      expect(groupMembershipRepository.countDistinctActiveMinistryMembersByBranch).toHaveBeenCalledWith('branch-1', asOf);
      expect(result).toBe(67);
    });
  });
});
