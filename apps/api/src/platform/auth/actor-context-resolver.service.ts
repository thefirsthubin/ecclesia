import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ActorContext, Role } from '@ecclesia/rbac';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { PrismaRootService } from '../database/prisma-root.service';

/**
 * Resolves a verified Cognito access token's `sub` claim into the
 * `ActorContext` shape `libs/rbac`'s guards consume (Sprint 1.4, filling
 * exactly the gap `request-context.ts` describes: "`actor` is derived
 * from a validated JWT ... not yet implemented").
 *
 * Path: `platform.users.cognito_sub` -> `platform.users.person_id` ->
 * `people.persons` -> that Person's currently-active
 * `people.role_assignments` row(s) (Blueprint §7.5: "active" means
 * `effective_from <= now` and `effective_to` is null or in the future).
 *
 * One genuine gap remains open, deliberately NOT papered over with a
 * guessed default - see AUTH_DESIGN_NOTES.md:
 *
 * 1. **Multiple concurrent active Role Assignments.** `ActorContext.role`
 *    is a single `Role` (a Sprint 1.1 / libs/rbac design decision, out of
 *    this sprint's scope to change). Neither the Blueprint nor the PRD
 *    say what happens when a Person holds two roles at once (e.g.
 *    Treasurer and Shepherd) - this throws `ConflictException` rather
 *    than silently picking one, since a wrong silent choice is a
 *    security-relevant bug, not a cosmetic one.
 *
 * A second gap, previously open here, is now resolved (People domain
 * milestone): **CLUSTER scope.** `ActorContext.clusterBacentaIds` is now
 * populated directly from `assignment.scopeGroupIds` - `libs/rbac`'s
 * `evaluate.ts` tests set membership (is this resource's Bacenta among
 * the actor's `clusterBacentaIds`?) rather than equality against a
 * `clusterId` that nothing could ever populate. See `libs/rbac/src/lib/types.ts`'s
 * `ActorContext.clusterBacentaIds` doc comment for the full reasoning.
 *
 * `[Row-Level Security sprint]` Injects `PrismaRootService`, not
 * `PrismaService` - this is exactly the "who am I" bootstrap case
 * `PrismaRootService`'s own doc comment names: at this point in the
 * request, no `ActorContext` (and therefore no `branchId` to scope by)
 * exists yet - resolving one is this method's entire job. Using the
 * RLS-scoped `PrismaService` here would be circular: `BranchScopeInterceptor`
 * runs after `AuthGuard`, which is what calls this method in the first
 * place.
 *
 * `[Multi-Tenant Foundation, Phase 1]` A Role Assignment can now be
 * Council-scoped (`branchId` null, `councilId` set) instead of
 * Branch-scoped - see `RoleAssignment`'s own `db/schema.prisma` doc
 * comment. That case is resolved by `resolveCouncilScopedActor` below, a
 * separate branch taken before the existing Branch-scoped logic runs at
 * all - so the existing, well-tested behavior for every Branch-scoped
 * role (Branch Pastor/Administrator/Treasurer, Bacenta/Basonta Leader) is
 * provably untouched: same code path, same output shape, same existing
 * tests, still green.
 *
 * A deliberate, disclosed scope decision for this phase: `tenantId`/
 * `councilId`/`councilBranchIds` are populated ONLY for a Council-scoped
 * actor, not for every actor (even though every Branch does, in
 * principle, belong to a knowable Council/Tenant). Populating them
 * universally would mean every existing Branch-scoped `ActorContext`
 * this service already produces gains new fields, breaking every
 * existing exact-equality test in `actor-context-resolver.service.spec.ts`
 * for zero behavioral benefit this phase (nothing yet reads `tenantId`/
 * `councilId` off a Branch-scoped actor) - "preserve existing Branch-
 * scoped behavior" is read literally here, not just "the same scope
 * still works."
 */
@Injectable()
export class ActorContextResolverService {
  constructor(
    private readonly prisma: PrismaRootService,
    @InjectPinoLogger(ActorContextResolverService.name) private readonly logger: PinoLogger,
  ) {}

  async resolve(cognitoSub: string): Promise<ActorContext> {
    const user = await this.prisma.user.findUnique({
      where: { cognitoSub },
      include: { person: true },
    });

    if (!user) {
      throw new UnauthorizedException('No platform.users record matches this authenticated identity');
    }
    if (!user.person) {
      throw new UnauthorizedException('Authenticated user is not yet linked to a Person record');
    }

    const now = new Date();
    const activeAssignments = await this.prisma.roleAssignment.findMany({
      where: {
        personId: user.person.id,
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
      },
      include: { group: true },
    });

    if (activeAssignments.length > 1) {
      this.logger.error(
        { personId: user.person.id, roles: activeAssignments.map((a) => a.role) },
        'Person has more than one concurrently active Role Assignment - ActorContext.role cannot represent this ' +
          '(see AUTH_DESIGN_NOTES.md, Open Question #1)',
      );
      throw new ConflictException(
        'This Person holds more than one active Role Assignment concurrently, which the current authorization ' +
          'model cannot represent as a single acting role. This requires a product decision, not a client retry.',
      );
    }

    if (activeAssignments.length === 0) {
      // No explicit Role Assignment - fall back to a lifecycle-derived
      // baseline role, per PRD's own framing of Member as a "baseline
      // authenticated role" (PRD ~line 1169) distinct from the five
      // Role-Assignment-granted roles BR-PPL-04 names. Every stage other
      // than MEMBER maps to VISITOR (the zero-ALLOW-rows default,
      // libs/rbac/roles.ts's own comment) rather than guessing a more
      // privileged role for an in-progress lifecycle stage - fail closed.
      const role: Role = user.person.lifecycleStage === 'MEMBER' ? 'MEMBER' : 'VISITOR';
      return {
        personId: user.person.id,
        role,
        branchId: user.person.branchId,
      };
    }

    const assignment = activeAssignments[0];

    if (assignment.branchId === null) {
      // `[Multi-Tenant Foundation, Phase 1]` A Council-scoped assignment -
      // no group/scopeGroupIds logic below applies to it (a Council-scoped
      // role is never also Bacenta/Basonta/cluster-scoped), so this
      // returns directly rather than falling through.
      return this.resolveCouncilScopedActor(user.person, assignment);
    }

    const actor: ActorContext = {
      personId: user.person.id,
      role: assignment.role,
      branchId: assignment.branchId,
    };

    if (assignment.group) {
      if (assignment.group.type === 'PASTORAL_CARE') {
        actor.bacentaId = assignment.group.id;
      } else if (assignment.group.type === 'MINISTRY') {
        actor.basontaId = assignment.group.id;
      }
    }

    // `assignment.scopeGroupIds` (Blueprint-adjacent/PRD-derived,
    // db/schema.prisma) is exactly the cluster-scoped Bacenta set a
    // CLUSTER-scoped Role Assignment covers - populate it directly.
    // Left undefined (not an empty array) when there is nothing to
    // populate, matching evaluate.ts's `actor.clusterBacentaIds !==
    // undefined` guard for a Role Assignment that isn't CLUSTER-scoped at
    // all (e.g. an Assistant Pastor configured Branch-wide, PRD §17.2:
    // "or Branch-wide by configuration").
    if (assignment.scopeGroupIds.length > 0) {
      actor.clusterBacentaIds = assignment.scopeGroupIds;
    }

    return actor;
  }

  /**
   * `[Multi-Tenant Foundation, Phase 1]` See this class's own doc comment
   * for why `branchId` comes from the Person, not the assignment, and why
   * `tenantId`/`councilId`/`councilBranchIds` are populated here and
   * nowhere else in this service.
   */
  private async resolveCouncilScopedActor(
    person: { id: string; branchId: string },
    assignment: { role: Role; councilId: string | null },
  ): Promise<ActorContext> {
    // Guaranteed non-null here by the migration's own
    // `role_assignments_branch_xor_council_check` CHECK constraint
    // (exactly one of branch_id/council_id, never neither) - this guard
    // exists only so a database-level inconsistency this service cannot
    // itself have caused fails loudly (ConflictException) rather than
    // silently, the same "fail closed, don't guess" discipline the
    // existing multiple-active-assignments check above already applies.
    if (!assignment.councilId) {
      throw new ConflictException(
        `Role Assignment for role '${assignment.role}' has neither a branchId nor a councilId - this violates ` +
          'the branch_id/council_id CHECK constraint and should be unreachable; indicates database corruption.',
      );
    }

    const council = await this.prisma.council.findUnique({
      where: { id: assignment.councilId },
      select: { tenantId: true, branches: { select: { id: true } } },
    });

    if (!council) {
      throw new ConflictException(
        `Role Assignment references Council '${assignment.councilId}', which no longer exists - this violates ` +
          'the council_id foreign key and should be unreachable.',
      );
    }

    return {
      personId: person.id,
      role: assignment.role,
      branchId: person.branchId,
      tenantId: council.tenantId,
      councilId: assignment.councilId,
      councilBranchIds: council.branches.map((branch) => branch.id),
    };
  }
}
