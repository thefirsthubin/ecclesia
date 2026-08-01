import { Injectable } from '@nestjs/common';
import type { WorkerAvailability } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

export interface CreateWorkerAvailabilityRecord {
  branchId: string;
  personId: string;
  unavailableFrom: Date;
  unavailableTo: Date;
  reason?: string;
}

/** Prisma-backed persistence for `ministry.worker_availability` (§16.3
 * H2: "lets a worker mark themselves unavailable for a date range"). */
@Injectable()
export class WorkerAvailabilityRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateWorkerAvailabilityRecord): Promise<WorkerAvailability> {
    return this.prisma.workerAvailability.create({ data: input });
  }

  listByPerson(personId: string): Promise<WorkerAvailability[]> {
    return this.prisma.workerAvailability.findMany({
      where: { personId },
      orderBy: { unavailableFrom: 'desc' },
    });
  }
}
