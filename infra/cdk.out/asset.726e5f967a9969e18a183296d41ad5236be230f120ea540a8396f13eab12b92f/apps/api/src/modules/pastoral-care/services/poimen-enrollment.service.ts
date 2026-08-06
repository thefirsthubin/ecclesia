import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { checkPoimenStatusTransition, isPoimenStatus } from '@ecclesia/domain-pastoral-care';
import type { PoimenEnrollmentResponseDto } from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import type { PoimenEnrollment, PoimenStatus } from '@prisma/client';

import { PoimenEnrollmentRepository } from '../repositories/poimen-enrollment.repository';

function toResponseDto(enrollment: PoimenEnrollment): PoimenEnrollmentResponseDto {
  return {
    id: enrollment.id,
    branchId: enrollment.branchId,
    personId: enrollment.personId,
    status: enrollment.status,
    enrolledAt: enrollment.enrolledAt ? enrollment.enrolledAt.toISOString() : null,
    completedAt: enrollment.completedAt ? enrollment.completedAt.toISOString() : null,
    createdAt: enrollment.createdAt.toISOString(),
    updatedAt: enrollment.updatedAt.toISOString(),
  };
}

/**
 * FR-PC-06's orchestration layer, and Pastoral Care's public service
 * interface (Blueprint §7.2) for the one thing another bounded-context
 * module needs from this table: a candidate's current Poimen status
 * (`getStatus`), consumed by People's `RoleAssignmentService` for the
 * `POIMEN_GATE_IF_ENABLED` record-level check (`libs/rbac`) instead of
 * that module reaching into `pastoral_care.poimen_enrollments` directly -
 * see `PASTORAL_CARE_DESIGN_NOTES.md`.
 */
@Injectable()
export class PoimenEnrollmentService {
  constructor(private readonly poimenEnrollmentRepository: PoimenEnrollmentRepository) {}

  /**
   * Public service interface method. Returns `undefined` (not a
   * thrown/absent-record error) when the candidate has no enrollment row
   * yet - `libs/rbac`'s `poimenGateIfEnabled` check already treats an
   * absent/undefined `candidatePoimenStatus` as "not COMPLETE," the
   * correct behavior for a candidate who was never enrolled.
   */
  async getStatus(personId: string): Promise<PoimenStatus | undefined> {
    const enrollment = await this.poimenEnrollmentRepository.findByPersonId(personId);
    return enrollment?.status;
  }

  async enroll(actor: ActorContext, personId: string): Promise<PoimenEnrollmentResponseDto> {
    const existing = await this.poimenEnrollmentRepository.findByPersonId(personId);
    if (existing) {
      throw new ConflictException(`FR-PC-06: Person '${personId}' is already enrolled in Poimen training`);
    }
    const enrollment = await this.poimenEnrollmentRepository.create(actor.branchId, personId);
    return toResponseDto(enrollment);
  }

  async getByPersonId(personId: string): Promise<PoimenEnrollmentResponseDto> {
    const enrollment = await this.poimenEnrollmentRepository.findByPersonId(personId);
    if (!enrollment) {
      throw new NotFoundException(`No Poimen enrollment found for Person '${personId}'`);
    }
    return toResponseDto(enrollment);
  }

  /**
   * FR-PC-06's status progression, validated against
   * `libs/domain/pastoral-care`'s `checkPoimenStatusTransition` before
   * writing - same "validate the pure state machine, then persist"
   * pattern `PersonService.transitionLifecycleStage` already uses.
   */
  async updateStatus(personId: string, status: string): Promise<PoimenEnrollmentResponseDto> {
    const existing = await this.poimenEnrollmentRepository.findByPersonId(personId);
    if (!existing) {
      throw new NotFoundException(`No Poimen enrollment found for Person '${personId}'`);
    }
    if (!isPoimenStatus(status)) {
      throw new ConflictException(`'${status}' is not a recognized Poimen status`);
    }

    const check = checkPoimenStatusTransition(existing.status, status);
    if (!check.allowed) {
      throw new ConflictException(check.reason);
    }

    const now = new Date();
    const enrollment = await this.poimenEnrollmentRepository.update(personId, {
      status,
      enrolledAt: status === 'IN_PROGRESS' && !existing.enrolledAt ? now : undefined,
      completedAt: status === 'COMPLETE' ? now : undefined,
    });
    return toResponseDto(enrollment);
  }
}
