import { Injectable } from '@nestjs/common';
import type { Prisma, VisitorIntakeSubmission } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

export interface CreateVisitorIntakeRecord {
  branchId: string;
  gatheringId?: string;
  personId?: string;
  submittedData: Prisma.InputJsonValue;
}

/**
 * Prisma-backed persistence for `gatherings.visitor_intake_submissions`
 * (FR-GTH-04/BR-GTH-03).
 */
@Injectable()
export class VisitorIntakeRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateVisitorIntakeRecord): Promise<VisitorIntakeSubmission> {
    return this.prisma.visitorIntakeSubmission.create({ data: input });
  }
}
