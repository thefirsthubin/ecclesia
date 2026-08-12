import { Controller, Get, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import type { AuditLogEntryResponseDto } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { AuditLogResourceContextGuard } from '../guards/audit-log-resource-context.guard';
import { AuditLogReadService } from '../services/audit-log-read.service';

/**
 * `[Audit Log milestone]` `GET /platform/audit-log` - PRD §17.3's Audit
 * Log matrix row, "single view, attributed+timestamped" (FR-ADM-02, R1).
 * `platform/` prefix matches the convention `BranchConfigurationController`
 * already established for a Platform-owned, cross-cutting resource that
 * isn't itself business-domain data.
 *
 * **Known, disclosed limitation - not silently narrowed to look complete.**
 * PRD §17.3 also grants ASSISTANT_PASTOR (CLUSTER, "cluster-relevant
 * entries") and BACENTA_LEADER (OWN_GROUP, "own-Bacenta-relevant entries")
 * read access, but `platform.audit_log` (`db/schema.prisma`) has no
 * `bacentaId`/group column at all, and this list is Branch-wide by
 * necessity (a single audit log view, not one query per resource). Every
 * `libs/rbac` scope check resolves against the *resource* being acted on
 * (`resourceInScope`, `evaluate.ts`) - a Branch-wide resource context (the
 * only shape this endpoint can produce) can never satisfy CLUSTER's
 * `resource.bacentaId` membership check or OWN_GROUP's `resource.bacentaId
 * === actor.bacentaId` check, so `RbacGuard` denies both roles
 * unconditionally today. Closing this gap would require either a schema
 * change (a `groupId`/`bacentaId` column on `AuditLog`, itself requiring a
 * product decision on how a Financial Transaction or Role Assignment event
 * - neither of which is Group-scoped - would populate it) or a policy
 * decision to grant those two roles the same BRANCH-wide view as
 * RESIDENT_PASTOR/ADMIN. Neither is this milestone's call to make.
 */
@Controller('platform/audit-log')
export class AuditLogController {
  constructor(private readonly auditLogReadService: AuditLogReadService) {}

  @Get()
  @RequirePermission('platform.audit_log.read')
  @UseGuards(AuditLogResourceContextGuard, RbacGuard)
  list(@CurrentActor() actor: ActorContext): Promise<AuditLogEntryResponseDto[]> {
    return this.auditLogReadService.listForActor(actor);
  }
}
