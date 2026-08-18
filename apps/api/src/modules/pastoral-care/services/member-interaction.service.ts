import { Injectable } from '@nestjs/common';
import type { CreateMemberInteractionInput, MemberInteractionResponseDto } from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import type { MemberInteraction } from '@prisma/client';

import { PersonScopeService } from '../../people/services/person-scope.service';
import { MemberInteractionRepository } from '../repositories/member-interaction.repository';

function toResponseDto(interaction: MemberInteraction): MemberInteractionResponseDto {
  return {
    id: interaction.id,
    branchId: interaction.branchId,
    personId: interaction.personId,
    pastorPersonId: interaction.pastorPersonId,
    type: interaction.type,
    occurredAt: interaction.occurredAt.toISOString(),
    scheduledAt: interaction.scheduledAt ? interaction.scheduledAt.toISOString() : null,
    briefNote: interaction.briefNote,
    createdAt: interaction.createdAt.toISOString(),
  };
}

/**
 * `[Milestone B: People + Pastoral + Outreach Foundation]` The
 * general-purpose pastoral activity log - see MILESTONE_B_DESIGN_NOTES.md
 * Part 9. `pastorPersonId` defaults to the acting Person, matching every
 * other authorship field in this domain's services.
 */
@Injectable()
export class MemberInteractionService {
  constructor(
    private readonly memberInteractionRepository: MemberInteractionRepository,
    private readonly personScopeService: PersonScopeService,
  ) {}

  async create(actor: ActorContext, personId: string, input: CreateMemberInteractionInput): Promise<MemberInteractionResponseDto> {
    const resource = await this.personScopeService.loadResourceContext(personId, actor);
    const interaction = await this.memberInteractionRepository.create({
      branchId: resource.branchId,
      personId,
      pastorPersonId: actor.personId,
      type: input.type,
      occurredAt: new Date(input.occurredAt),
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
      briefNote: input.briefNote,
    });
    return toResponseDto(interaction);
  }

  async listByPerson(personId: string): Promise<MemberInteractionResponseDto[]> {
    const interactions = await this.memberInteractionRepository.listByPerson(personId);
    return interactions.map(toResponseDto);
  }
}
