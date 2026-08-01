import { Injectable, NotFoundException } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';
import { PersonRepository } from '../repositories/person.repository';

/**
 * Loads the `ResourceContext` for a route acting on an existing Person
 * (`GET/PATCH /v1/people/:id`, `POST /v1/people/:id/lifecycle-transitions`).
 * See `EcclesiaContextGuardBase`'s doc comment for why this must be a
 * Guard, not an Interceptor.
 *
 * **`basontaId` is resolved from the actor's perspective, not the
 * Person's.** PRD §17.2: "A Person may lead more than one Basonta," and a
 * Person being read/updated may likewise hold several concurrent active
 * Basonta memberships (BR-PPL-02) - but `libs/rbac`'s `ResourceContext`
 * only has room for one `basontaId` to compare against the acting
 * Basonta Leader's own `actor.basontaId`. Rather than picking an
 * arbitrary one of the Person's several Basontas (which could produce a
 * wrong ALLOW or a wrong DENY depending on which one got picked), this
 * guard checks whether the *specific* Basonta the actor leads is among
 * the Person's active memberships and only then reports that one as
 * `resource.basontaId` - the correct answer for `resourceInScope`'s
 * single-value equality check, computed using information (the actor)
 * only this guard has access to at resource-load time. This is a design
 * choice, not a citation - see `PEOPLE_DESIGN_NOTES.md`.
 */
/**
 * Shared by `PersonResourceContextGuard` and the Group Membership /
 * Role Assignment modules' own resource-context guards - every one of
 * them targets "the Person identified by a route param" and needs the
 * identical `bacentaId`/`basontaId` resolution described above, just
 * from a different param name (`:id` vs `:personId`).
 */
export async function loadPersonResourceContext(
  personRepository: PersonRepository,
  actor: ActorContext,
  personId: string,
): Promise<ResourceContext> {
  const person = await personRepository.findById(personId);
  if (!person) {
    throw new NotFoundException(`No Person found with id '${personId}'`);
  }

  const activeMemberships = await personRepository.findActiveGroupMemberships(personId);
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

@Injectable()
export class PersonResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    private readonly personRepository: PersonRepository,
  ) {
    super(branchConfigurationService);
  }

  protected loadResource(request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    const id = (request.params as Record<string, string>).id;
    return loadPersonResourceContext(this.personRepository, actor, id);
  }
}

/**
 * `POST /v1/people` has no `:id` to load - PRD §17.3's `people.person.create`
 * row grants only ADMIN, at BRANCH scope, so the resource is trivially
 * "the actor's own Branch." No database read is needed.
 */
@Injectable()
export class PersonCreateResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(branchConfigurationService: BranchConfigurationService) {
    super(branchConfigurationService);
  }

  protected async loadResource(_request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    return { branchId: actor.branchId };
  }
}
