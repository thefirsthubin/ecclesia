import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { createPrayerNoteSchema, updatePrayerNoteStatusSchema } from '@ecclesia/contracts';
import type { CreatePrayerNoteInput, UpdatePrayerNoteStatusInput } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import {
  PrayerNoteResourceContextGuard,
  PrayerNoteStatusResourceContextGuard,
} from '../guards/prayer-note-resource-context.guard';
import { PrayerNoteService } from '../services/prayer-note.service';

/**
 * `[Milestone B: People + Pastoral + Outreach Foundation]` The private
 * pastoral domain - permission-sensitive, see the explicit ADMIN DENY
 * rules on `pastoral_care.prayer_note.*` in
 * `libs/rbac/src/lib/permission-matrix.ts`, and the author-only
 * visibility enforced inside `PrayerNoteService` itself (not expressible
 * as a Scope value). MILESTONE_B_DESIGN_NOTES.md Part 5/6.
 */
@Controller('people/:personId/prayer-notes')
export class PrayerNoteController {
  constructor(private readonly prayerNoteService: PrayerNoteService) {}

  @Post()
  @RequirePermission('pastoral_care.prayer_note.create')
  @UseGuards(PrayerNoteResourceContextGuard, RbacGuard)
  create(
    @CurrentActor() actor: ActorContext,
    @Param('personId') personId: string,
    @Body(new ZodValidationPipe(createPrayerNoteSchema)) body: CreatePrayerNoteInput,
  ) {
    return this.prayerNoteService.create(actor, personId, body);
  }

  /** Author-only - see `PrayerNoteService.listByPerson`'s own doc
   * comment. Every actor who reaches this route (organizational scope
   * already checked by the guard/RBAC) still only ever sees their own
   * authored notes. */
  @Get()
  @RequirePermission('pastoral_care.prayer_note.read')
  @UseGuards(PrayerNoteResourceContextGuard, RbacGuard)
  listByPerson(@CurrentActor() actor: ActorContext, @Param('personId') personId: string) {
    return this.prayerNoteService.listByPerson(actor, personId);
  }
}

/** Separate controller for the `:id`-keyed status update - the resource
 * this route addresses (one specific PrayerNote) is no longer scoped
 * under its subject Person's own route the way create/list are, matching
 * `FollowUpTaskController`'s own split between `people/:personId/...`
 * and flat `follow-up-tasks/:id/...` routes. */
@Controller('prayer-notes')
export class PrayerNoteStatusController {
  constructor(private readonly prayerNoteService: PrayerNoteService) {}

  @Patch(':id/status')
  @RequirePermission('pastoral_care.prayer_note.update')
  @UseGuards(PrayerNoteStatusResourceContextGuard, RbacGuard)
  updateStatus(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updatePrayerNoteStatusSchema)) body: UpdatePrayerNoteStatusInput,
  ) {
    return this.prayerNoteService.updateStatus(actor, id, body);
  }
}
