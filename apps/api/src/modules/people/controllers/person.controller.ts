import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import {
  createPersonSchema,
  lifecycleTransitionRequestSchema,
  updatePersonSchema,
} from '@ecclesia/contracts';
import type { CreatePersonInput, LifecycleTransitionRequestInput, UpdatePersonInput } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import { PersonCreateResourceContextGuard, PersonResourceContextGuard } from '../guards/person-resource-context.guard';
import { PersonService } from '../services/person.service';

/**
 * PRD §17.3's "Person: create/edit profile" and "Person: assign
 * lifecycle stage" rows. Every route pairs a resource-context guard
 * (loads `ResourceContext`, this module's own inferred design - see
 * `PersonResourceContextGuard`'s doc comment) with `RbacGuard`
 * (`libs/rbac`, Blueprint §9.4's declarative pipeline) - `@RequirePermission`
 * names the exact PRD §17.3 action each route enforces.
 */
@Controller('people')
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  @Post()
  @RequirePermission('people.person.create')
  @UseGuards(PersonCreateResourceContextGuard, RbacGuard)
  create(@CurrentActor() actor: ActorContext, @Body(new ZodValidationPipe(createPersonSchema)) body: CreatePersonInput) {
    return this.personService.create(actor, body);
  }

  @Get(':id')
  @RequirePermission('people.person.read')
  @UseGuards(PersonResourceContextGuard, RbacGuard)
  getById(@Param('id') id: string) {
    return this.personService.getById(id);
  }

  @Patch(':id')
  @RequirePermission('people.person.update')
  @UseGuards(PersonResourceContextGuard, RbacGuard)
  update(@Param('id') id: string, @Body(new ZodValidationPipe(updatePersonSchema)) body: UpdatePersonInput) {
    return this.personService.update(id, body);
  }

  /**
   * FR-PPL-03. Deliberately `people.person.lifecycle_stage.update`, not a
   * bespoke action - PRD §17.3's matrix names exactly one action for
   * "assign lifecycle stage," regardless of which specific transition is
   * requested; validity of the specific transition is a business-rule
   * concern (`PersonService`, `libs/domain/people`), not an authorization
   * one.
   */
  @Post(':id/lifecycle-transitions')
  @RequirePermission('people.person.lifecycle_stage.update')
  @UseGuards(PersonResourceContextGuard, RbacGuard)
  transitionLifecycleStage(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(lifecycleTransitionRequestSchema)) body: LifecycleTransitionRequestInput,
  ) {
    return this.personService.transitionLifecycleStage(id, body);
  }
}
