import { Injectable } from '@nestjs/common';
import type { AuditLog } from '@prisma/client';

import { PrismaService } from '../../platform/database/prisma.service';

export interface CreateAuditLogRecord {
  branchId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  occurredAt: Date;
}

/**
 * apps/worker's own copy of `platform.audit_log` persistence - the same
 * "own repository, not a cross-app import" split as
 * `WorkerEngagementSignalRepository` (see that file's doc comment; the
 * reasoning is identical). Deliberately a narrower field set than
 * `apps/api/src/platform/audit/audit-log.service.ts`'s `AuditLogEntry` -
 * `actorUserId`/`effect`/`reason`/`deviceId`/`ipAddress` are all
 * request-shaped fields (Blueprint §8.5's login/logout/MFA logging,
 * `libs/rbac`'s allow/deny decisions) that don't apply to a bus message
 * with no HTTP request or authenticated actor behind it - see
 * `AuditConsumer`'s own doc comment for why this consumer never has an
 * `actorUserId` to record.
 */
@Injectable()
export class WorkerAuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: CreateAuditLogRecord): Promise<AuditLog> {
    return this.prisma.auditLog.create({
      data: {
        branchId: entry.branchId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        occurredAt: entry.occurredAt,
      },
    });
  }
}
