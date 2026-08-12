import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { createBranchConfigurationSchema, updateBranchConfigurationSchema } from '@ecclesia/contracts';
import type { CreateBranchConfigurationInput, UpdateBranchConfigurationInput } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import { BranchConfigurationResourceContextGuard } from '../guards/branch-configuration-resource-context.guard';
import { BranchConfigurationCrudService } from '../services/branch-configuration.service';

/**
 * `[Branch Configuration milestone]` PRD §17.3's "Configuration:
 * gathering/role/group types" row - no controller existed for it before
 * this milestone (`platform.configurations` had only a read-only
 * internal consumer, `apps/api/src/platform/rbac/branch-configuration.service.ts`).
 * A per-Branch singleton (`branchId` unique) - no `:id` route param
 * anywhere, `branchId` always comes from `ActorContext`, never the
 * client.
 */
@Controller('platform/configuration')
export class BranchConfigurationController {
  constructor(private readonly branchConfigurationCrudService: BranchConfigurationCrudService) {}

  @Get()
  @RequirePermission('platform.configuration.read')
  @UseGuards(BranchConfigurationResourceContextGuard, RbacGuard)
  get(@CurrentActor() actor: ActorContext) {
    return this.branchConfigurationCrudService.getForBranch(actor.branchId);
  }

  @Post()
  @RequirePermission('platform.configuration.create')
  @UseGuards(BranchConfigurationResourceContextGuard, RbacGuard)
  create(@CurrentActor() actor: ActorContext, @Body(new ZodValidationPipe(createBranchConfigurationSchema)) body: CreateBranchConfigurationInput) {
    return this.branchConfigurationCrudService.create(actor.branchId, body);
  }

  @Patch()
  @RequirePermission('platform.configuration.update')
  @UseGuards(BranchConfigurationResourceContextGuard, RbacGuard)
  update(@CurrentActor() actor: ActorContext, @Body(new ZodValidationPipe(updateBranchConfigurationSchema)) body: UpdateBranchConfigurationInput) {
    return this.branchConfigurationCrudService.update(actor.branchId, body);
  }
}
