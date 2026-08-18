import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import {
  createPersonSchema,
  lifecycleTransitionRequestSchema,
  listPeopleQuerySchema,
  updatePersonSchema,
} from '@ecclesia/contracts';
import type { CreatePersonInput, LifecycleTransitionRequestInput, ListPeopleQuery, UpdatePersonInput } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import {
  PersonCreateResourceContextGuard,
  PersonListResourceContextGuard,
  PersonResourceContextGuard,
} from '../guards/person-resource-context.guard';
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

  /** `GET /people` (PRD §16.1's "Search & directory"). Declared before
   * `:id` for readability, same convention `GatheringController` follows -
   * not required for correctness (Nest matches the path-segment-free
   * `GET /people` here and `GET /people/:id` below regardless of
   * declaration order). */
  @Get()
  @RequirePermission('people.person.read')
  @UseGuards(PersonListResourceContextGuard, RbacGuard)
  list(@CurrentActor() actor: ActorContext, @Query(new ZodValidationPipe(listPeopleQuerySchema)) query: ListPeopleQuery) {
    return this.personService.list(actor, query);
  }

  /**
   * `[Milestone B: People + Pastoral + Outreach Foundation]` `GET
   * /people/without-bacenta` - **must stay declared before `@Get(':id')`
   * below**, same reason `GET /financial-transactions/summary` was
   * declared before its own `:id` route in Milestone A: `without-bacenta`
   * is a literal path segment that would otherwise be swallowed by the
   * `:id` wildcard.
   */
  @Get('without-bacenta')
  @RequirePermission('people.person.read')
  @UseGuards(PersonListResourceContextGuard, RbacGuard)
  listWithoutBacenta(@CurrentActor() actor: ActorContext, @Query('search') search?: string) {
    return this.personService.listWithoutActiveBacenta(actor, search);
  }

  /** `GET /people/organized-by-bacenta` - same ordering requirement as
   * `without-bacenta` above. */
  @Get('organized-by-bacenta')
  @RequirePermission('people.person.read')
  @UseGuards(PersonListResourceContextGuard, RbacGuard)
  listOrganizedByBacenta(@CurrentActor() actor: ActorContext) {
    return this.personService.listOrganizedByBacenta(actor);
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
