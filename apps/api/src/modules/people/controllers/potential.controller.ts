import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { createPotentialSchema, listPotentialsQuerySchema, updatePotentialSchema } from '@ecclesia/contracts';
import type { CreatePotentialInput, ListPotentialsQuery, UpdatePotentialInput } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import {
  PotentialCreateResourceContextGuard,
  PotentialListResourceContextGuard,
  PotentialResourceContextGuard,
} from '../guards/potential-resource-context.guard';
import { PotentialService } from '../services/potential.service';

/** `[Milestone C.1.1: Complete Read Models]` See `PotentialService`'s own
 * doc comment and `db/schema.prisma`'s `Potential` model doc comment for
 * the full design. */
@Controller('potentials')
export class PotentialController {
  constructor(private readonly potentialService: PotentialService) {}

  @Post()
  @RequirePermission('people.potential.create')
  @UseGuards(PotentialCreateResourceContextGuard, RbacGuard)
  create(@CurrentActor() actor: ActorContext, @Body(new ZodValidationPipe(createPotentialSchema)) body: CreatePotentialInput) {
    return this.potentialService.create(actor, body);
  }

  @Get()
  @RequirePermission('people.potential.read')
  @UseGuards(PotentialListResourceContextGuard, RbacGuard)
  list(@CurrentActor() actor: ActorContext, @Query(new ZodValidationPipe(listPotentialsQuerySchema)) query: ListPotentialsQuery) {
    return this.potentialService.list(actor, query);
  }

  @Get(':id')
  @RequirePermission('people.potential.read')
  @UseGuards(PotentialResourceContextGuard, RbacGuard)
  getById(@Param('id') id: string) {
    return this.potentialService.getById(id);
  }

  @Patch(':id')
  @RequirePermission('people.potential.update')
  @UseGuards(PotentialResourceContextGuard, RbacGuard)
  update(@Param('id') id: string, @Body(new ZodValidationPipe(updatePotentialSchema)) body: UpdatePotentialInput) {
    return this.potentialService.update(id, body);
  }
}
