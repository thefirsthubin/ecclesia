import { Injectable, NotFoundException } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { PersonRepository } from '../repositories/person.repository';

/**
 * People module's public service interface (Blueprint §4.3 rule 1 /
 * §7.2: "if it needs data owned by another module, it calls that
 * module's public service interface... not by the caller reaching across
 * schema boundaries itself") for the one thing every other bounded
 * -context module that references a Person needs: that Person's RBAC
 * scope identifiers (`branchId`, `bacentaId`, `basontaId`), for building
 * an `EcclesiaRequestContext`'s `resource` half.
 *
 * Exported by `PeopleModule` specifically so Pastoral Care (and future
 * domain modules whose resources - FollowUpTask, PastoralNote,
 * PoimenEnrollment - are all "about a Person") can build their own
 * resource-context guards without reaching into People's
 * `PersonRepository`/Prisma layer directly, which would violate the
 * schema-ownership rule even though `people.persons` and the caller's
 * own tables both ultimately get queried by the same Postgres instance.
 *
 * **`basontaId` is resolved from the actor's perspective, not the
 * Person's** - see the original `PersonResourceContextGuard` doc
 * comment history (`PEOPLE_DESIGN_NOTES.md`) for the full reasoning: a
 * Person may hold several concurrent active Basonta memberships
 * (BR-PPL-02), but `ResourceContext.basontaId` only holds one value, so
 * this method reports the specific Basonta the *acting* Basonta Leader
 * leads, if the target Person is actually in it.
 */
@Injectable()
export class PersonScopeService {
  constructor(private readonly personRepository: PersonRepository) {}

  async loadResourceContext(personId: string, actor: ActorContext): Promise<ResourceContext> {
    const person = await this.personRepository.findById(personId);
    if (!person) {
      throw new NotFoundException(`No Person found with id '${personId}'`);
    }

    const activeMemberships = await this.personRepository.findActiveGroupMemberships(personId);
    const bacentaMembership = activeMemberships.find((m) => m.groupType === 'PASTORAL_CARE');
    const actorLedBasontaMembership =
      actor.basontaId !== undefined
        ? activeMemberships.find((m) => m.groupType === 'MINISTRY' && m.groupId === actor.basontaId)
        : undefined;

    return {
      branchId: person.branchId,
      ownerId: person.id,
      bacentaId: bacentaMembership?.groupId,
      basontaId: actorLedBasontaMembership?.groupId,
    };
  }
}
