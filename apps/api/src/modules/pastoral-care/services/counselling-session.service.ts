import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CounsellingSessionResponseDto,
  CreateCounsellingSessionInput,
  UpdateCounsellingSessionStatusInput,
} from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import type { CounsellingSession } from '@prisma/client';

import { PersonScopeService } from '../../people/services/person-scope.service';
import { CounsellingSessionRepository } from '../repositories/counselling-session.repository';

function toResponseDto(session: CounsellingSession): CounsellingSessionResponseDto {
  return {
    id: session.id,
    branchId: session.branchId,
    personId: session.personId,
    counsellorPersonId: session.counsellorPersonId,
    scheduledAt: session.scheduledAt.toISOString(),
    status: session.status,
    briefNote: session.briefNote,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

/**
 * `[Milestone B: People + Pastoral + Outreach Foundation]` Deliberately
 * operational-only - see `CounsellingSession`'s own schema.prisma doc
 * comment. `counsellorPersonId` defaults to the acting Person (matching
 * `PrayerNoteService.create`'s own "never client-supplied" discipline for
 * authorship), but unlike `PrayerNoteService.listByPerson`, reads here are
 * organizational (Branch/Cluster) scope only, not author-filtered.
 */
@Injectable()
export class CounsellingSessionService {
  constructor(
    private readonly counsellingSessionRepository: CounsellingSessionRepository,
    private readonly personScopeService: PersonScopeService,
  ) {}

  async create(actor: ActorContext, personId: string, input: CreateCounsellingSessionInput): Promise<CounsellingSessionResponseDto> {
    const resource = await this.personScopeService.loadResourceContext(personId, actor);
    const session = await this.counsellingSessionRepository.create({
      branchId: resource.branchId,
      personId,
      counsellorPersonId: actor.personId,
      scheduledAt: new Date(input.scheduledAt),
      briefNote: input.briefNote,
    });
    return toResponseDto(session);
  }

  async listByPerson(personId: string): Promise<CounsellingSessionResponseDto[]> {
    const sessions = await this.counsellingSessionRepository.listByPerson(personId);
    return sessions.map(toResponseDto);
  }

  async updateStatus(id: string, input: UpdateCounsellingSessionStatusInput): Promise<CounsellingSessionResponseDto> {
    const existing = await this.counsellingSessionRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`No CounsellingSession found with id '${id}'`);
    }
    const session = await this.counsellingSessionRepository.updateStatus(id, input.status);
    return toResponseDto(session);
  }
}
