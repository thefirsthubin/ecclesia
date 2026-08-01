import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ActorContext, Role } from '@ecclesia/rbac';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { PrismaService } from '../database/prisma.service';

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
 * Two genuine gaps found while building this, both deliberately NOT
 * papered over with a guessed default - see AUTH_DESIGN_NOTES.md:
 *
 * 1. **Multiple concurrent active Role Assignments.** `ActorContext.role`
 *    is a single `Role` (a Sprint 1.1 / libs/rbac design decision, out of
 *    this sprint's scope to change). Neither the Blueprint nor the PRD
 *    say what happens when a Person holds two roles at once (e.g.
 *    Treasurer and Shepherd) - this throws `ConflictException` rather
 *    than silently picking one, since a wrong silent choice is a
 *    security-relevant bug, not a cosmetic one.
 * 2. **CLUSTER scope has no resolvable identifier.** `ActorContext.clusterId`
 *    is compared against `ResourceContext.clusterId` by
 *    `libs/rbac`'s `evaluate.ts` (`actor.clusterId === resource.clusterId`),
 *    but `db/schema.prisma` has no Cluster entity and no `cluster_id`
 *    column anywhere (PRD §17.2's own words: "cluster assignment is
 *    itself a configuration, not a hard-coded structure" -
 *    `db/DESIGN_NOTES.md` Open Question #1). This resolver therefore
 *    never populates `clusterId`, which means any `CLUSTER`-scope
 *    permission rule (Assistant Pastor's grants) will always evaluate to
 *    DENY via `evaluate.ts`'s own `actor.clusterId !== undefined` check -
 *    a fail-closed default, not a fail-open guess, but a real product gap
 *    that needs a decision (either add a real cluster identifier to the
 *    schema, or change `libs/rbac`'s `Scope`/`ActorContext` shape to
 *    match a set of Bacenta ids) before Assistant Pastor's day-to-day
 *    cluster-scoped actions can work at all.
 */
@Injectable()
export class ActorContextResolverService {
  constructor(
    private readonly prisma: PrismaService,
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

    // clusterId deliberately left undefined - see this class's doc
    // comment, point 2. `assignment.scopeGroupIds` (when non-empty) is
    // the cluster-scoped Bacenta set this Role Assignment covers, but
    // there is nowhere in ActorContext to put a *set* of ids, and no
    // resource-side clusterId to compare it against even if there were.
    if (assignment.scopeGroupIds.length > 0) {
      this.logger.warn(
        { personId: user.person.id, role: assignment.role, scopeGroupIds: assignment.scopeGroupIds },
        'Role Assignment has a non-empty scope_group_ids (cluster scope) - CLUSTER-scope permission checks for ' +
          'this actor will always deny until the schema/libs/rbac CLUSTER model gap is resolved (see ' +
          'AUTH_DESIGN_NOTES.md, Open Question #1)',
      );
    }

    return actor;
  }
}
