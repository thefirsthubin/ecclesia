import { Controller, Get, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import type { BranchListResponseDto } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { BranchListResourceContextGuard } from '../guards/branch-list-resource-context.guard';
import { BranchReadService } from '../services/branch-read.service';

/**
 * `[Post-Milestone D — Portal Experiences follow-up]` `GET
 * /platform/branches` - every real Branch in the actor's own Council,
 * with its real name. `platform/` prefix matches `AuditLogController`'s
 * own convention for a Platform-owned, cross-cutting resource that isn't
 * itself business-domain data (`Branch`/`Council` are both
 * `@@schema("platform")` Prisma models).
 *
 * Closes a disclosed gap from Milestone D: the Council Dashboard/Insights
 * views could previously only resolve the acting user's own home Branch
 * name (`actor.branchName`, from the auth response) - any other Branch
 * in their Council showed a raw id. `COUNCIL_OVERSEER`/
 * `COUNCIL_TREASURER` both hold `platform.branch.read` at `COUNCIL` scope
 * (`permission-matrix.ts`).
 */
@Controller('platform/branches')
export class BranchController {
  constructor(private readonly branchReadService: BranchReadService) {}

  @Get()
  @RequirePermission('platform.branch.read')
  @UseGuards(BranchListResourceContextGuard, RbacGuard)
  list(@CurrentActor() actor: ActorContext): Promise<BranchListResponseDto> {
    return this.branchReadService.listForActor(actor);
  }
}
