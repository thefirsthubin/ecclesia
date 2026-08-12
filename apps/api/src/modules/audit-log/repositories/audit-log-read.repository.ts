import { Injectable } from '@nestjs/common';
import type { AuditLog } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

/**
 * `[Audit Log milestone]` Read side of `platform.audit_log` (the write
 * side, `AuditLogService.record`, lives in `platform/audit` since it is
 * called from cross-cutting infrastructure - `AuthGuard`,
 * `AllExceptionsFilter` - not from this domain module). Named
 * `AuditLogReadRepository`, not `AuditLogRepository`, to avoid colliding
 * with that writer's own class name.
 *
 * `branchId = branchId OR branchId IS NULL` is not a defensive
 * belt-and-suspenders filter - it is required. RLS
 * (`20260810000000_audit_log_null_branch_carve_out`) already makes
 * NULL-branch rows visible regardless of `app.current_branch_id`, but an
 * explicit `WHERE branch_id = $1` (this repository's usual
 * explicit-filtering convention, see `GroupRepository`) would silently
 * drop them again at the Prisma query-building layer, undoing the RLS
 * fix's own intent that a NULL-branch auth-failure record "carries no
 * Branch to leak across" and should stay readable to every Branch's own
 * audit-log viewers.
 */
@Injectable()
export class AuditLogReadRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * `actionPrefix` implements TREASURER's PRD §17.3 "Stewardship entries
   * only" restriction (`AuditLogReadService` passes `'stewardship.'` for
   * that role) - every `libs/rbac` `Action` string for the Stewardship
   * bounded context starts with that prefix (`libs/rbac/src/lib/actions.ts`),
   * so a `startsWith` match is a real structural property of the action
   * catalog, not an invented heuristic.
   */
  findForBranch(branchId: string, actionPrefix?: string): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: {
        OR: [{ branchId }, { branchId: null }],
        ...(actionPrefix ? { action: { startsWith: actionPrefix } } : {}),
      },
      orderBy: { occurredAt: 'desc' },
    });
  }
}
