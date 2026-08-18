import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { ActorContext } from '@ecclesia/rbac';
import type {
  CreateOutreachContactInput,
  OutreachContactResponseDto,
  PromoteOutreachContactInput,
  UpdateOutreachContactOutcomeInput,
} from '@ecclesia/contracts';
import type { OutreachContact } from '@prisma/client';

import { PersonService } from '../../people/services/person.service';
import { OutreachContactRepository } from '../repositories/outreach-contact.repository';
import { OutreachRepository } from '../repositories/outreach.repository';

function toResponseDto(contact: OutreachContact): OutreachContactResponseDto {
  return {
    id: contact.id,
    outreachId: contact.outreachId,
    branchId: contact.branchId,
    personId: contact.personId,
    firstName: contact.firstName,
    lastName: contact.lastName,
    phone: contact.phone,
    howReached: contact.howReached,
    outcome: contact.outcome,
    createdAt: contact.createdAt.toISOString(),
  };
}

/**
 * `[Milestone B: People + Pastoral + Outreach Foundation]` Orchestrates
 * the "people reached at an Outreach" use cases, including the approved
 * lazy/deferred Person-promotion design (MILESTONE_B_DESIGN_NOTES.md
 * Part 4) - a contact starts as lightweight, unpromoted data on this row
 * alone (`personId: null`); `promote()` is the one explicit action that
 * turns it into a real `Person`, reusing `PersonService.create`'s
 * existing duplicate-detection logic (FR-PPL-02) rather than
 * reimplementing it, so a contact re-approached across multiple outreach
 * events doesn't create a second Person record.
 */
@Injectable()
export class OutreachContactService {
  constructor(
    private readonly outreachContactRepository: OutreachContactRepository,
    private readonly outreachRepository: OutreachRepository,
    private readonly personService: PersonService,
  ) {}

  async addContact(outreachId: string, input: CreateOutreachContactInput): Promise<OutreachContactResponseDto> {
    const outreach = await this.outreachRepository.findById(outreachId);
    if (!outreach) {
      throw new NotFoundException(`No Outreach found with id '${outreachId}'`);
    }
    const contact = await this.outreachContactRepository.create({
      outreachId,
      branchId: outreach.branchId,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      howReached: input.howReached,
      outcome: input.outcome,
    });
    return toResponseDto(contact);
  }

  async listForOutreach(outreachId: string): Promise<OutreachContactResponseDto[]> {
    const contacts = await this.outreachContactRepository.listByOutreach(outreachId);
    return contacts.map(toResponseDto);
  }

  async updateOutcome(id: string, input: UpdateOutreachContactOutcomeInput): Promise<OutreachContactResponseDto> {
    const existing = await this.requireContact(id);
    const contact = await this.outreachContactRepository.updateOutcome(existing.id, input.outcome);
    return toResponseDto(contact);
  }

  /**
   * `[Milestone B]` The one explicit promotion action. `input.lastName`
   * is required only when the contact itself never captured one (the
   * lightweight capture form allows an optional `lastName` - see
   * `createOutreachContactSchema`'s own doc comment - but `PersonService.create`
   * requires one, matching every other Person-creation path in this
   * codebase). Rejects re-promoting an already-promoted contact - `personId`
   * is set exactly once, never overwritten.
   */
  async promote(actor: ActorContext, id: string, input: PromoteOutreachContactInput): Promise<OutreachContactResponseDto> {
    const existing = await this.requireContact(id);
    if (existing.personId) {
      throw new ConflictException(`OutreachContact '${id}' has already been promoted to Person '${existing.personId}'`);
    }
    const lastName = input.lastName ?? existing.lastName;
    if (!lastName) {
      throw new BadRequestException(
        `OutreachContact '${id}' has no lastName captured - supply one in the promote request to create a Person`,
      );
    }

    const person = await this.personService.create(actor, {
      firstName: existing.firstName,
      lastName,
      phone: existing.phone ?? undefined,
      overrideDuplicateCheck: input.overrideDuplicateCheck ?? false,
    });

    const contact = await this.outreachContactRepository.setPersonId(existing.id, person.id);
    return toResponseDto(contact);
  }

  private async requireContact(id: string): Promise<OutreachContact> {
    const existing = await this.outreachContactRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`No OutreachContact found with id '${id}'`);
    }
    return existing;
  }
}
