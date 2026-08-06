import { Injectable } from '@nestjs/common';
import type { PoimenEnrollment, PoimenStatus } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

export interface UpdatePoimenEnrollmentRecord {
  status: PoimenStatus;
  enrolledAt?: Date;
  completedAt?: Date | null;
}

/**
 * Prisma-backed persistence for `pastoral_care.poimen_enrollments`
 * (FR-PC-06). Schema-scoped per Blueprint §6.4/§7.2 - this repository
 * only ever queries its own bounded context's tables, mirroring
 * `PersonRepository`'s own rule for `people.persons`. See
 * `PASTORAL_CARE_DESIGN_NOTES.md` for the module-boundary violation this
 * module's existence fixes (People's `RoleAssignmentRepository` used to
 * query this table directly).
 */
@Injectable()
export class PoimenEnrollmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByPersonId(personId: string): Promise<PoimenEnrollment | null> {
    return this.prisma.poimenEnrollment.findUnique({ where: { personId } });
  }

  /** `personId` is `@unique` (`db/schema.prisma`) - enrollment is
   * create-once, tracked forward via status transitions from there. */
  create(branchId: string, personId: string): Promise<PoimenEnrollment> {
    return this.prisma.poimenEnrollment.create({
      data: { branchId, personId, status: 'NOT_STARTED' },
    });
  }

  update(personId: string, input: UpdatePoimenEnrollmentRecord): Promise<PoimenEnrollment> {
    return this.prisma.poimenEnrollment.update({
      where: { personId },
      data: input,
    });
  }
}
