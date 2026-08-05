import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { ActorContext } from '@ecclesia/rbac';

import { RoleAssignmentService } from './role-assignment.service';

describe('RoleAssignmentService', () => {
  function buildService() {
    const roleAssignmentRepository = {
      create: jest.fn(),
      findUserIdByPersonId: jest.fn().mockResolvedValue('user-1'),
      findActiveBacentaLeader: jest.fn().mockResolvedValue(null),
      createWithSuccession: jest.fn(),
      listByPerson: jest.fn(),
    };
    const personRepository = { findById: jest.fn() };
    const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };
    const poimenEnrollmentService = { getStatus: jest.fn() };
    const eventPublisher = { publish: jest.fn() };
    const service = new RoleAssignmentService(
      roleAssignmentRepository as never,
      personRepository as never,
      branchConfigurationService as never,
      poimenEnrollmentService as never,
      eventPublisher as never,
    );
    return { service, roleAssignmentRepository, personRepository, branchConfigurationService, poimenEnrollmentService, eventPublisher };
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
    const { service, personRepository, roleAssignmentRepository, eventPublisher } = buildService();
    personRepository.findById.mockResolvedValue({ id: 'person-1', branchId: 'branch-1', lifecycleStage: 'MEMBER' });
    roleAssignmentRepository.create.mockResolvedValue(roleAssignmentRow);

    const result = await service.grant(residentPastor, 'person-1', { role: 'WORKER', scopeGroupIds: [] });

    expect(roleAssignmentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'WORKER', grantedByUserId: 'user-1' }),
    );
    expect(result.id).toBe('ra-1');
    expect(eventPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'role_assignment.active',
        branchId: 'branch-1',
        subjectPersonId: 'person-1',
        payload: { role: 'WORKER', groupId: null },
      }),
    );
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
    const { service, personRepository, roleAssignmentRepository, branchConfigurationService, poimenEnrollmentService } =
      buildService();
    personRepository.findById.mockResolvedValue({ id: 'person-1', branchId: 'branch-1', lifecycleStage: 'MEMBER' });
    branchConfigurationService.loadForBranch.mockResolvedValue({ poimenGateEnabled: true });
    poimenEnrollmentService.getStatus.mockResolvedValue('IN_PROGRESS');

    await expect(
      service.grant(residentPastor, 'person-1', { role: 'BACENTA_LEADER', scopeGroupIds: [] }),
    ).rejects.toThrow(ForbiddenException);
    expect(poimenEnrollmentService.getStatus).toHaveBeenCalledWith('person-1');
    expect(roleAssignmentRepository.create).not.toHaveBeenCalled();
  });

  it('does not apply the Poimen gate when the Branch flag is disabled (default)', async () => {
    const { service, personRepository, roleAssignmentRepository, poimenEnrollmentService } = buildService();
    personRepository.findById.mockResolvedValue({ id: 'person-1', branchId: 'branch-1', lifecycleStage: 'MEMBER' });
    poimenEnrollmentService.getStatus.mockResolvedValue('NOT_STARTED');
    roleAssignmentRepository.create.mockResolvedValue({ ...roleAssignmentRow, role: 'BACENTA_LEADER' });

    const result = await service.grant(residentPastor, 'person-1', { role: 'BACENTA_LEADER', scopeGroupIds: [] });

    expect(result.role).toBe('BACENTA_LEADER');
  });

  it('never fetches Poimen status when granting a role other than BACENTA_LEADER', async () => {
    const { service, personRepository, roleAssignmentRepository, poimenEnrollmentService } = buildService();
    personRepository.findById.mockResolvedValue({ id: 'person-1', branchId: 'branch-1', lifecycleStage: 'MEMBER' });
    roleAssignmentRepository.create.mockResolvedValue(roleAssignmentRow);

    await service.grant(residentPastor, 'person-1', { role: 'TREASURER', scopeGroupIds: [] });

    expect(poimenEnrollmentService.getStatus).not.toHaveBeenCalled();
  });

  it('PRD §17.2: closes the prior active Bacenta Leader when granting a new one for the same Bacenta', async () => {
    const { service, personRepository, roleAssignmentRepository, poimenEnrollmentService, eventPublisher } = buildService();
    personRepository.findById.mockResolvedValue({ id: 'person-2', branchId: 'branch-1', lifecycleStage: 'MEMBER' });
    poimenEnrollmentService.getStatus.mockResolvedValue('COMPLETE');
    roleAssignmentRepository.findActiveBacentaLeader.mockResolvedValue({ id: 'ra-prior' });
    roleAssignmentRepository.createWithSuccession.mockResolvedValue({
      ...roleAssignmentRow,
      id: 'ra-new',
      personId: 'person-2',
      role: 'BACENTA_LEADER',
      groupId: 'bacenta-1',
    });

    const result = await service.grant(residentPastor, 'person-2', {
      role: 'BACENTA_LEADER',
      groupId: 'bacenta-1',
      scopeGroupIds: [],
    });

    expect(roleAssignmentRepository.findActiveBacentaLeader).toHaveBeenCalledWith('bacenta-1', expect.any(Date));
    expect(roleAssignmentRepository.createWithSuccession).toHaveBeenCalledWith(
      expect.objectContaining({ personId: 'person-2', role: 'BACENTA_LEADER', groupId: 'bacenta-1' }),
      'ra-prior',
      expect.any(Date),
    );
    expect(roleAssignmentRepository.create).not.toHaveBeenCalled();
    expect(result.id).toBe('ra-new');
    expect(eventPublisher.publish).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'role_assignment.active' }));
  });

  it('grants a Bacenta Leader with no prior holder without a close step (still via createWithSuccession)', async () => {
    const { service, personRepository, roleAssignmentRepository, poimenEnrollmentService } = buildService();
    personRepository.findById.mockResolvedValue({ id: 'person-2', branchId: 'branch-1', lifecycleStage: 'MEMBER' });
    poimenEnrollmentService.getStatus.mockResolvedValue('COMPLETE');
    roleAssignmentRepository.findActiveBacentaLeader.mockResolvedValue(null);
    roleAssignmentRepository.createWithSuccession.mockResolvedValue({
      ...roleAssignmentRow,
      id: 'ra-new',
      role: 'BACENTA_LEADER',
      groupId: 'bacenta-1',
    });

    await service.grant(residentPastor, 'person-2', { role: 'BACENTA_LEADER', groupId: 'bacenta-1', scopeGroupIds: [] });

    expect(roleAssignmentRepository.createWithSuccession).toHaveBeenCalledWith(
      expect.any(Object),
      undefined,
      expect.any(Date),
    );
  });

  it('uses plain create() for a BACENTA_LEADER grant with no groupId (no succession target to check)', async () => {
    const { service, personRepository, roleAssignmentRepository, poimenEnrollmentService } = buildService();
    personRepository.findById.mockResolvedValue({ id: 'person-2', branchId: 'branch-1', lifecycleStage: 'MEMBER' });
    poimenEnrollmentService.getStatus.mockResolvedValue('COMPLETE');
    roleAssignmentRepository.create.mockResolvedValue({ ...roleAssignmentRow, role: 'BACENTA_LEADER' });

    await service.grant(residentPastor, 'person-2', { role: 'BACENTA_LEADER', scopeGroupIds: [] });

    expect(roleAssignmentRepository.findActiveBacentaLeader).not.toHaveBeenCalled();
    expect(roleAssignmentRepository.createWithSuccession).not.toHaveBeenCalled();
    expect(roleAssignmentRepository.create).toHaveBeenCalled();
  });

  describe('listForPerson (FR-PPL-07)', () => {
    it('maps every Role Assignment returned by the repository to a response DTO', async () => {
      const { service, roleAssignmentRepository } = buildService();
      roleAssignmentRepository.listByPerson.mockResolvedValue([
        roleAssignmentRow,
        { ...roleAssignmentRow, id: 'ra-2', role: 'BACENTA_LEADER', effectiveTo: new Date('2026-03-01T00:00:00Z') },
      ]);

      const result = await service.listForPerson('person-1');

      expect(roleAssignmentRepository.listByPerson).toHaveBeenCalledWith('person-1');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('ra-1');
      expect(result[1].effectiveTo).toBe('2026-03-01T00:00:00.000Z');
    });
  });
});
