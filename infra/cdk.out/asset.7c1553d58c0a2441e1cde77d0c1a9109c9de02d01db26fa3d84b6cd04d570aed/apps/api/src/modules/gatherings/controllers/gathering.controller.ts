import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { createGatheringSchema, listGatheringsQuerySchema, updateGatheringSchema } from '@ecclesia/contracts';
import type { CreateGatheringInput, ListGatheringsQuery, UpdateGatheringInput } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import {
  GatheringCreateResourceContextGuard,
  GatheringListResourceContextGuard,
  GatheringResourceContextGuard,
} from '../guards/gathering-resource-context.guard';
import { GatheringService } from '../services/gathering.service';

/** PRD §17.3's "Gathering: create/configure" row, §12.4. */
@Controller('gatherings')
export class GatheringController {
  constructor(private readonly gatheringService: GatheringService) {}

  @Post()
  @RequirePermission('gatherings.gathering.create')
  @UseGuards(GatheringCreateResourceContextGuard, RbacGuard)
  create(@CurrentActor() actor: ActorContext, @Body(new ZodValidationPipe(createGatheringSchema)) body: CreateGatheringInput) {
    return this.gatheringService.create(actor, body);
  }

  /** `GET /gatherings` - `ownerGroupId` present (Shepherd Dashboard
   * sprint, see `SHEPHERD_DASHBOARD_DESIGN_NOTES.md` STEP 6) or absent
   * (Gatherings Web Admin sprint's BRANCH-wide calendar). Declared before
   * `:id` so Nest's router does not attempt to match the literal
   * query-only path against the `:id` param route - not actually a
   * conflict here since Nest matches `GET /gatherings` (no path segment)
   * against this route and `GET /gatherings/:id` against the one below
   * regardless of declaration order, but kept in this order for
   * readability (list before single-record read, the same order every
   * other module's list + getById pair already follows, e.g.
   * `FinancialTransactionController`). */
  @Get()
  @RequirePermission('gatherings.gathering.read')
  @UseGuards(GatheringListResourceContextGuard, RbacGuard)
  list(@CurrentActor() actor: ActorContext, @Query(new ZodValidationPipe(listGatheringsQuerySchema)) query: ListGatheringsQuery) {
    return this.gatheringService.list(actor, query);
  }

  @Get(':id')
  @RequirePermission('gatherings.gathering.read')
  @UseGuards(GatheringResourceContextGuard, RbacGuard)
  getById(@Param('id') id: string) {
    return this.gatheringService.getById(id);
  }

  @Patch(':id')
  @RequirePermission('gatherings.gathering.update')
  @UseGuards(GatheringResourceContextGuard, RbacGuard)
  update(@Param('id') id: string, @Body(new ZodValidationPipe(updateGatheringSchema)) body: UpdateGatheringInput) {
    return this.gatheringService.update(id, body);
  }
}
