import { Injectable } from '@nestjs/common';
import type { CreatePastoralNoteInput, PastoralNoteResponseDto } from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import type { PastoralNote } from '@prisma/client';

import { PersonScopeService } from '../../people/services/person-scope.service';
import { PastoralNoteRepository } from '../repositories/pastoral-note.repository';

function toResponseDto(note: PastoralNote): PastoralNoteResponseDto {
  return {
    id: note.id,
    branchId: note.branchId,
    personId: note.personId,
    authorPersonId: note.authorPersonId,
    content: note.content,
    createdAt: note.createdAt.toISOString(),
  };
}

/**
 * §16.2's pastoral notes capability. Injects `PersonScopeService` for the
 * subject Person's `branchId`, same cross-module consumption pattern as
 * `FollowUpTaskService`/`PoimenEnrollmentResourceContextGuard`.
 */
@Injectable()
export class PastoralNoteService {
  constructor(
    private readonly pastoralNoteRepository: PastoralNoteRepository,
    private readonly personScopeService: PersonScopeService,
  ) {}

  async create(actor: ActorContext, personId: string, input: CreatePastoralNoteInput): Promise<PastoralNoteResponseDto> {
    const resource = await this.personScopeService.loadResourceContext(personId, actor);
    const note = await this.pastoralNoteRepository.create({
      branchId: resource.branchId,
      personId,
      authorPersonId: actor.personId,
      content: input.content,
    });
    return toResponseDto(note);
  }

  async listByPerson(personId: string): Promise<PastoralNoteResponseDto[]> {
    const notes = await this.pastoralNoteRepository.findByPersonId(personId);
    return notes.map(toResponseDto);
  }
}
