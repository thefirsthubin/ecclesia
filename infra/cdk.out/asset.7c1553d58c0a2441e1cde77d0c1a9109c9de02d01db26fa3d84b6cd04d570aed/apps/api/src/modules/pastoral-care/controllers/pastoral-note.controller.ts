import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { createPastoralNoteSchema } from '@ecclesia/contracts';
import type { CreatePastoralNoteInput } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import { PastoralNoteResourceContextGuard } from '../guards/pastoral-note-resource-context.guard';
import { PastoralNoteService } from '../services/pastoral-note.service';

/** §16.2, NFR-PRIV-01 (permission-sensitive - see the explicit ADMIN DENY
 * rules on `pastoral_care.notes.*` in `libs/rbac/src/lib/permission-matrix.ts`). */
@Controller('people/:personId/pastoral-notes')
export class PastoralNoteController {
  constructor(private readonly pastoralNoteService: PastoralNoteService) {}

  @Post()
  @RequirePermission('pastoral_care.notes.create')
  @UseGuards(PastoralNoteResourceContextGuard, RbacGuard)
  create(
    @CurrentActor() actor: ActorContext,
    @Param('personId') personId: string,
    @Body(new ZodValidationPipe(createPastoralNoteSchema)) body: CreatePastoralNoteInput,
  ) {
    return this.pastoralNoteService.create(actor, personId, body);
  }

  @Get()
  @RequirePermission('pastoral_care.notes.read')
  @UseGuards(PastoralNoteResourceContextGuard, RbacGuard)
  listByPerson(@Param('personId') personId: string) {
    return this.pastoralNoteService.listByPerson(personId);
  }
}
