import { ConflictException, NotFoundException } from '@nestjs/common';
import type { ActorContext } from '@ecclesia/rbac';

import { PoimenEnrollmentService } from './poimen-enrollment.service';

const NOW = new Date('2026-08-01T00:00:00.000Z');

function buildEnrollment(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'pe-1',
    branchId: 'branch-1',
    personId: 'person-1',
    status: 'NOT_STARTED',
    enrolledAt: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe('PoimenEnrollmentService', () => {
  const actor: ActorContext = { personId: 'rp-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };

  function buildService() {
    const poimenEnrollmentRepository = { findByPersonId: jest.fn(), create: jest.fn(), update: jest.fn() };
    const service = new PoimenEnrollmentService(poimenEnrollmentRepository as never);
    return { service, poimenEnrollmentRepository };
  }

  describe('getStatus (People module\'s Poimen-gate consumer)', () => {
    it('returns the enrollment status when one exists', async () => {
      const { service, poimenEnrollmentRepository } = buildService();
      poimenEnrollmentRepository.findByPersonId.mockResolvedValue(buildEnrollment({ status: 'COMPLETE' }));

      await expect(service.getStatus('person-1')).resolves.toBe('COMPLETE');
    });

    it('returns undefined (not an error) when the candidate was never enrolled', async () => {
      const { service, poimenEnrollmentRepository } = buildService();
      poimenEnrollmentRepository.findByPersonId.mockResolvedValue(null);

      await expect(service.getStatus('person-1')).resolves.toBeUndefined();
    });
  });

  describe('enroll', () => {
    it('creates a new enrollment scoped to the actor\'s Branch', async () => {
      const { service, poimenEnrollmentRepository } = buildService();
      poimenEnrollmentRepository.findByPersonId.mockResolvedValue(null);
      poimenEnrollmentRepository.create.mockResolvedValue(buildEnrollment());

      const result = await service.enroll(actor, 'person-1');

      expect(poimenEnrollmentRepository.create).toHaveBeenCalledWith('branch-1', 'person-1');
      expect(result.status).toBe('NOT_STARTED');
    });

    it('rejects enrolling a Person who is already enrolled', async () => {
      const { service, poimenEnrollmentRepository } = buildService();
      poimenEnrollmentRepository.findByPersonId.mockResolvedValue(buildEnrollment());

      await expect(service.enroll(actor, 'person-1')).rejects.toThrow(ConflictException);
      expect(poimenEnrollmentRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getByPersonId', () => {
    it('throws NotFoundException when no enrollment exists', async () => {
      const { service, poimenEnrollmentRepository } = buildService();
      poimenEnrollmentRepository.findByPersonId.mockResolvedValue(null);

      await expect(service.getByPersonId('person-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus (FR-PC-06 status progression)', () => {
    it('throws NotFoundException when no enrollment exists', async () => {
      const { service, poimenEnrollmentRepository } = buildService();
      poimenEnrollmentRepository.findByPersonId.mockResolvedValue(null);

      await expect(service.updateStatus('person-1', 'IN_PROGRESS')).rejects.toThrow(NotFoundException);
    });

    it('rejects an unrecognized status value', async () => {
      const { service, poimenEnrollmentRepository } = buildService();
      poimenEnrollmentRepository.findByPersonId.mockResolvedValue(buildEnrollment());

      await expect(service.updateStatus('person-1', 'BOGUS')).rejects.toThrow(ConflictException);
    });

    it('rejects a transition not modeled by the pure state machine (e.g. skipping to COMPLETE)', async () => {
      const { service, poimenEnrollmentRepository } = buildService();
      poimenEnrollmentRepository.findByPersonId.mockResolvedValue(buildEnrollment({ status: 'NOT_STARTED' }));

      await expect(service.updateStatus('person-1', 'COMPLETE')).rejects.toThrow(ConflictException);
      expect(poimenEnrollmentRepository.update).not.toHaveBeenCalled();
    });

    it('applies a valid transition and stamps enrolledAt on first entry to IN_PROGRESS', async () => {
      const { service, poimenEnrollmentRepository } = buildService();
      poimenEnrollmentRepository.findByPersonId.mockResolvedValue(buildEnrollment({ status: 'NOT_STARTED', enrolledAt: null }));
      poimenEnrollmentRepository.update.mockResolvedValue(buildEnrollment({ status: 'IN_PROGRESS', enrolledAt: NOW }));

      const result = await service.updateStatus('person-1', 'IN_PROGRESS');

      expect(poimenEnrollmentRepository.update).toHaveBeenCalledWith(
        'person-1',
        expect.objectContaining({ status: 'IN_PROGRESS', enrolledAt: expect.any(Date) }),
      );
      expect(result.status).toBe('IN_PROGRESS');
    });

    it('stamps completedAt when transitioning to COMPLETE', async () => {
      const { service, poimenEnrollmentRepository } = buildService();
      poimenEnrollmentRepository.findByPersonId.mockResolvedValue(buildEnrollment({ status: 'IN_PROGRESS', enrolledAt: NOW }));
      poimenEnrollmentRepository.update.mockResolvedValue(buildEnrollment({ status: 'COMPLETE', completedAt: NOW }));

      await service.updateStatus('person-1', 'COMPLETE');

      expect(poimenEnrollmentRepository.update).toHaveBeenCalledWith(
        'person-1',
        expect.objectContaining({ status: 'COMPLETE', completedAt: expect.any(Date) }),
      );
    });
  });
});
