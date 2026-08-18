import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreatePrayerNoteInput, PrayerNoteResponseDto, UpdatePrayerNoteStatusInput } from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import type { PrayerNote } from '@prisma/client';

import { PersonScopeService } from '../../people/services/person-scope.service';
import { PrayerNoteRepository } from '../repositories/prayer-note.repository';

function toResponseDto(note: PrayerNote): PrayerNoteResponseDto {
  return {
    id: note.id,
    branchId: note.branchId,
    personId: note.personId,
    authorPersonId: note.authorPersonId,
    content: note.content,
    followUpDate: note.followUpDate ? note.followUpDate.toISOString().slice(0, 10) : null,
    status: note.status,
    createdAt: note.createdAt.toISOString(),
  };
}

/**
 * `[Milestone B: People + Pastoral + Outreach Foundation]` The private
 * pastoral domain's core service - MILESTONE_B_DESIGN_NOTES.md Part 5/6's
 * approved Option C, implemented. Mirrors `PastoralNoteService`'s own
 * shape (same `PersonScopeService` cross-module resolution) with one
 * deliberate addition: every read is also filtered to the *acting*
 * Person as author, never just Branch/Cluster scope alone - the approved
 * author-only visibility decision.
 */
@Injectable()
export class PrayerNoteService {
  constructor(
    private readonly prayerNoteRepository: PrayerNoteRepository,
    private readonly personScopeService: PersonScopeService,
  ) {}

  async create(actor: ActorContext, personId: string, input: CreatePrayerNoteInput): Promise<PrayerNoteResponseDto> {
    const resource = await this.personScopeService.loadResourceContext(personId, actor);
    const note = await this.prayerNoteRepository.create({
      branchId: resource.branchId,
      personId,
      authorPersonId: actor.personId,
      content: input.content,
      followUpDate: input.followUpDate ? new Date(input.followUpDate) : undefined,
    });
    return toResponseDto(note);
  }

  /**
   * `[Milestone B]` **The author-only enforcement point.** Always queries
   * by `actor.personId`, never by `personId` alone - a Resident Pastor
   * with BRANCH-scope read access to this Person still only sees the
   * prayer notes *they themselves* wrote, never an Assistant Pastor's
   * (or, before this milestone existed, vice versa). This is deliberately
   * not configurable per-call - there is no parameter that widens it,
   * matching the approved decision's own "even the two pastor roles
   * don't see each other's notes" requirement exactly.
   */
  async listByPerson(actor: ActorContext, personId: string): Promise<PrayerNoteResponseDto[]> {
    const notes = await this.prayerNoteRepository.findByPersonAndAuthor(personId, actor.personId);
    return notes.map(toResponseDto);
  }

  /** `[Milestone B]` Only the authoring pastor may update their own
   * note's status - the same author-only boundary `listByPerson`
   * enforces, applied to writes too. */
  async updateStatus(actor: ActorContext, id: string, input: UpdatePrayerNoteStatusInput): Promise<PrayerNoteResponseDto> {
    const existing = await this.prayerNoteRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`No PrayerNote found with id '${id}'`);
    }
    if (existing.authorPersonId !== actor.personId) {
      throw new ForbiddenException(`Only the authoring pastor may update PrayerNote '${id}'`);
    }
    const note = await this.prayerNoteRepository.updateStatus(id, input.status);
    return toResponseDto(note);
  }
}
