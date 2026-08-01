import { Injectable } from '@nestjs/common';
import type { Gathering, GatheringStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

export interface CreateGatheringRecord {
  branchId: string;
  type: string;
  ownerGroupId?: string;
  seriesId?: string;
  scheduledStart: Date;
  scheduledEnd?: Date;
  venue?: string;
  config?: Prisma.InputJsonValue;
  createdByPersonId: string;
}

export interface UpdateGatheringRecord {
  scheduledStart?: Date;
  scheduledEnd?: Date | null;
  venue?: string | null;
  status?: GatheringStatus;
  config?: Prisma.InputJsonValue | typeof Prisma.JsonNull;
}

/**
 * Prisma-backed persistence for `gatherings.gatherings` (§12.4/FR-GTH-01).
 * Schema-scoped per Blueprint §6.4/§7.2.
 */
@Injectable()
export class GatheringRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateGatheringRecord): Promise<Gathering> {
    return this.prisma.gathering.create({ data: input });
  }

  findById(id: string): Promise<Gathering | null> {
    return this.prisma.gathering.findUnique({ where: { id } });
  }

  update(id: string, input: UpdateGatheringRecord): Promise<Gathering> {
    return this.prisma.gathering.update({ where: { id }, data: input });
  }
}
