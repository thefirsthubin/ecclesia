import { Injectable } from '@nestjs/common';
import type { ActorContext } from '@ecclesia/rbac';
import type { AuditLogEntryResponseDto } from '@ecclesia/contracts';
import type { AuditLog } from '@prisma/client';

import { AuditLogReadRepository } from '../repositories/audit-log-read.repository';

/**
 * `[Audit Log milestone]` PRD §17.3's Audit Log matrix row. Only
 * TREASURER's "Stewardship entries only" restriction is implementable
 * here - RESIDENT_PASTOR/ADMIN's BRANCH scope is already fully enforced by
 * `AuditLogResourceContextGuard`+`RbacGuard` before this service ever
 * runs, and ASSISTANT_PASTOR (CLUSTER)/BACENTA_LEADER (OWN_GROUP) can
 * never reach this service at all - `RbacGuard` denies both before the
 * controller method is invoked, since `platform.audit_log` has no
 * `bacentaId`/cluster dimension for `evaluateRoleAndScope`'s
 * `resourceInScope` to match against a Branch-wide resource context (see
 * `AuditLogController`'s own doc comment for the full explanation - not
 * something this service can or should work around).
 */
@Injectable()
export class AuditLogReadService {
  constructor(private readonly repository: AuditLogReadRepository) {}

  async listForActor(actor: ActorContext): Promise<AuditLogEntryResponseDto[]> {
    const actionPrefix = actor.role === 'TREASURER' ? 'stewardship.' : undefined;
    const rows = await this.repository.findForBranch(actor.branchId, actionPrefix);
    return rows.map(AuditLogReadService.toResponseDto);
  }

  private static toResponseDto(row: AuditLog): AuditLogEntryResponseDto {
    return {
      id: row.id,
      branchId: row.branchId,
      actorUserId: row.actorUserId,
      action: row.action,
      effect: row.effect,
      resourceType: row.resourceType,
      resourceId: row.resourceId,
      reason: row.reason,
      deviceId: row.deviceId,
      ipAddress: row.ipAddress,
      occurredAt: row.occurredAt.toISOString(),
    };
  }
}
