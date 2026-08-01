import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { ActorContext } from '@ecclesia/rbac';

import { RoleAssignmentService } from './role-assignment.service';

describe('RoleAssignmentService', () => {
  function buildService() {
    const roleAssignmentRepository = {
      create: jest.fn(),
      findUserIdByPersonId: jest.fn().mockResolvedValue('user-1'),
      findPoimenStatus: jest.fn(),
    };
    const personRepository = { findById: jest.fn() };
    const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };
    const service = new RoleAssignmentService(
      roleAssignmentRepository as never,
      personRepository as never,
      branchConfigurationService as never,
    );
    return { service, roleAssignmentRepository, personRepository, branchConfigurationService };
  }

  const residentPastor: ActorContext = { personId: 'rp-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };
  const roleAssignmentRow = {
    id: 'ra-1',
    personId: 'person-1',
    role: 'WORKER',
    branchId: 'branch-1',
    groupId: null,
    scopeGroupIds: [],
    effectiveFrom: new Date('2026-01-01T00:00:00Z'),
    effectiveTo: null,
  };

  it('throws NotFoundException when the Person does not exist', async () => {
    const { service, personRepository } = buildService();
    personRepository.findById.mockResolvedValue(null);

    await expect(
      service.grant(residentPastor, 'missing', { role: 'WORKER', scopeGroupIds: [] }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects granting a gated role to a non-Member (BR-PPL-04/FR-PPL-06)', async () => {
    const { service, personRepository } = buildService();
    personRepository.findById.mockResolvedValue({ id: 'person-1', branchId: 'branch-1', lifecycleStage: 'VISITOR' });

    await expect(
      service.grant(residentPastor, 'person-1', { role: 'WORKER', scopeGroupIds: [] }),
    ).rejects.toThrow(ConflictException);
  });

  it('grants an ungated role (people.role_assignment.grant) to an authorized Resident Pastor', async () => {
    const { service, personRepository, roleAssignmentRepository } = buildService();
    personRepository.findById.mockResolvedValue({ id: 'person-1', branchId: 'branch-1', lifecycleStage: 'MEMBER' });
    roleAssignmentRepository.create.mockResolvedValue(roleAssignmentRow);

    const result = await service.grant(residentPastor, 'person-1', { role: 'WORKER', scopeGroupIds: [] });

    expect(roleAssignmentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'WORKER', grantedByUserId: 'user-1' }),
    );
    expect(result.id).toBe('ra-1');
  });

  it('denies a role grant from an actor with no grant authority (e.g. Worker)', async () => {
    const { service, personRepository, roleAssignmentRepository } = buildService();
    personRepository.findById.mockResolvedValue({ id: 'person-1', branchId: 'branch-1', lifecycleStage: 'MEMBER' });
    const worker: ActorContext = { personId: 'worker-1', role: 'WORKER', branchId: 'branch-1' };

    await expect(service.grant(worker, 'person-1', { role: 'WORKER', scopeGroupIds: [] })).rejects.toThrow(
      ForbiddenException,
    );
    expect(roleAssignmentRepository.create).not.toHaveBeenCalled();
  });

  it('applies the Poimen gate when granting BACENTA_LEADER and the Branch flag is enabled', async () => {
    const { service, personRepository, roleAssignmentRepository, branchConfigurationService } = buildService();
    personRepository.findById.mockResolvedValue({ id: 'person-1', branchId: 'branch-1', lifecycleStage: 'MEMBER' });
    branchConfigurationService.loadForBranch.mockResolvedValue({ poimenGateEnabled: true });
    roleAssignmentRepository.findPoimenStatus.mockResolvedValue('IN_PROGRESS');

    await expect(
      service.grant(residentPastor, 'person-1', { role: 'BACENTA_LEADER', scopeGroupIds: [] }),
    ).rejects.toThrow(ForbiddenException);
    expect(roleAssignmentRepository.findPoimenStatus).toHaveBeenCalledWith('person-1');
    expect(roleAssignmentRepository.create).not.toHaveBeenCalled();
  });

  it('does not apply the Poimen gate when the Branch flag is disabled (default)', async () => {
    const { service, personRepository, roleAssignmentRepository } = buildService();
    personRepository.findById.mockResolvedValue({ id: 'person-1', branchId: 'branch-1', lifecycleStage: 'MEMBER' });
    roleAssignmentRepository.findPoimenStatus.mockResolvedValue('NOT_STARTED');
    roleAssignmentRepository.create.mockResolvedValue({ ...roleAssignmentRow, role: 'BACENTA_LEADER' });

    const result = await service.grant(residentPastor, 'person-1', { role: 'BACENTA_LEADER', scopeGroupIds: [] });

    expect(result.role).toBe('BACENTA_LEADER');
  });

  it('never fetches Poimen status when granting a role other than BACENTA_LEADER', async () => {
    const { service, personRepository, roleAssignmentRepository } = buildService();
    personRepository.findById.mockResolvedValue({ id: 'person-1', branchId: 'branch-1', lifecycleStage: 'MEMBER' });
    roleAssignmentRepository.create.mockResolvedValue(roleAssignmentRow);

    await service.grant(residentPastor, 'person-1', { role: 'TREASURER', scopeGroupIds: [] });

    expect(roleAssignmentRepository.findPoimenStatus).not.toHaveBeenCalled();
  });
});
