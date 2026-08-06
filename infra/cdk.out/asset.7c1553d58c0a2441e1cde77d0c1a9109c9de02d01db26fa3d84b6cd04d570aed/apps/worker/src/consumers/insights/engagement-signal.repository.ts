import { Injectable } from '@nestjs/common';
import type { EngagementSignal, Prisma } from '@prisma/client';

import { PrismaService } from '../../platform/database/prisma.service';

export interface CreateEngagementSignalRecord {
  branchId: string;
  personId?: string;
  groupId?: string;
  signalType: string;
  payload: Prisma.InputJsonValue;
  occurredAt: Date;
}

/**
 * apps/worker's own copy of `insights.engagement_signals` persistence -
 * deliberately **not** an import of
 * `apps/api/src/modules/insights/repositories/engagement-signal.repository.ts`,
 * even though the write shape is identical. Both apps generate their own
 * `PrismaClient` from the same `db/schema.prisma` and connect to the same
 * physical database (Blueprint ADR-003), but Nx's `enforce-module-
 * boundaries` lint rule (already active workspace-wide) forbids one app
 * importing another app's code directly - only `libs/*` are meant to be
 * shared. This mirrors the same "own repository, shared `libs/domain`/
 * `libs/contracts` only" split `WORKER_DESIGN_NOTES.md` documents for
 * every worker-side data access this milestone adds.
 */
@Injectable()
export class WorkerEngagementSignalRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateEngagementSignalRecord): Promise<EngagementSignal> {
    return this.prisma.engagementSignal.create({ data: input });
  }
}
