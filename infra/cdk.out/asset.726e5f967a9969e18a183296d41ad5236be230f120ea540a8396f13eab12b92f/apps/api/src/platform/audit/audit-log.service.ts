import { Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

/**
 * One `platform.audit_log` row's worth of fields (Sprint 1.3's schema).
 * `actorUserId` is nullable because a failed-authentication event (bad or
 * expired token) may have no resolvable `platform.users` row at all -
 * exactly the case this log exists to capture, per Blueprint §9.6's
 * framing: denial/failure signals are a security-monitoring input, not
 * just a record of successful actors.
 */
export interface AuditLogEntry {
  branchId?: string;
  actorUserId?: string;
  action: string;
  effect?: 'ALLOW' | 'DENY';
  resourceType?: string;
  resourceId?: string;
  reason?: string;
  deviceId?: string;
  ipAddress?: string;
}

/**
 * Writer for `platform.audit_log` (Sprint 1.4). This table is the
 * business-meaning, long-retention record Blueprint §12.1 explicitly
 * distinguishes from short-retention operational logs (pino/CloudWatch) -
 * "who did what to church data," not "why is the system behaving this way
 * right now." Nothing here should be called for routine successful
 * request handling; see call sites (`AuthGuard`, `RbacAuditInterceptor`)
 * for exactly which events qualify.
 *
 * A single shared writer rather than one per concern (auth failures, RBAC
 * denials, and eventually financial-transaction/role-assignment audit
 * trails per Blueprint §7.4/§7.5) - one place that knows how to shape a
 * `platform.audit_log` row, reused by every caller that needs to write one.
 */
@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditLogEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        branchId: entry.branchId,
        actorUserId: entry.actorUserId,
        action: entry.action,
        effect: entry.effect,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        reason: entry.reason,
        deviceId: entry.deviceId,
        ipAddress: entry.ipAddress,
      },
    });
  }
}
