import { ConflictException, UnauthorizedException } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';

import { ActorContextResolverService } from './actor-context-resolver.service';
// `[Row-Level Security sprint]` `PrismaRootService`, not `PrismaService` -
// the service under test now injects the unscoped root client (see its
// own doc comment). Mocked the same way either type would be.
import type { PrismaRootService } from '../database/prisma-root.service';

function buildLogger(): PinoLogger {
  return { info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as PinoLogger;
}

function buildPrisma(overrides: {
  user?: unknown;
  roleAssignments?: unknown[];
  council?: unknown;
}): PrismaRootService {
  return {
    user: {
      findUnique: jest.fn().mockResolvedValue(overrides.user ?? null),
    },
    roleAssignment: {
      findMany: jest.fn().mockResolvedValue(overrides.roleAssignments ?? []),
    },
    // `[Multi-Tenant Foundation, Phase 1]` Only consulted by
    // `resolveCouncilScopedActor` - `overrides.council` defaults to
    // `undefined` (Prisma's own "not found" shape), not `null`, matching
    // every other mock in this file that leaves an unused override unset
    // rather than guessing a default that happens to pass.
    council: {
      findUnique: jest.fn().mockResolvedValue(overrides.council),
    },
  } as unknown as PrismaRootService;
}

const PERSON_ID = 'person-1';
const BRANCH_ID = 'branch-1';

describe('ActorContextResolverService', () => {
  it('throws UnauthorizedException when no platform.users row matches the cognito sub', async () => {
    const prisma = buildPrisma({ user: null });
    const service = new ActorContextResolverService(prisma, buildLogger());

    await expect(service.resolve('unknown-sub')).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when the user is not linked to a Person', async () => {
    const prisma = buildPrisma({ user: { id: 'user-1', person: null } });
    const service = new ActorContextResolverService(prisma, buildLogger());

    await expect(service.resolve('sub-1')).rejects.toThrow(UnauthorizedException);
  });

  it('falls back to MEMBER when lifecycle_stage is MEMBER and there is no active Role Assignment', async () => {
    const prisma = buildPrisma({
      user: { id: 'user-1', person: { id: PERSON_ID, branchId: BRANCH_ID, lifecycleStage: 'MEMBER' } },
      roleAssignments: [],
    });
    const service = new ActorContextResolverService(prisma, buildLogger());

    const actor = await service.resolve('sub-1');

    expect(actor).toEqual({ personId: PERSON_ID, role: 'MEMBER', branchId: BRANCH_ID });
  });

  it('falls back to VISITOR (not a guessed higher role) for any non-MEMBER lifecycle stage', async () => {
    const prisma = buildPrisma({
      user: { id: 'user-1', person: { id: PERSON_ID, branchId: BRANCH_ID, lifecycleStage: 'FOLLOW_UP' } },
      roleAssignments: [],
    });
    const service = new ActorContextResolverService(prisma, buildLogger());

    const actor = await service.resolve('sub-1');

    expect(actor.role).toBe('VISITOR');
  });

  it('resolves a Bacenta Leader Role Assignment to bacentaId, not basontaId', async () => {
    const prisma = buildPrisma({
      user: { id: 'user-1', person: { id: PERSON_ID, branchId: BRANCH_ID, lifecycleStage: 'MEMBER' } },
      roleAssignments: [
        {
          role: 'BACENTA_LEADER',
          branchId: BRANCH_ID,
          scopeGroupIds: [],
          group: { id: 'group-1', type: 'PASTORAL_CARE' },
        },
      ],
    });
    const service = new ActorContextResolverService(prisma, buildLogger());

    const actor = await service.resolve('sub-1');

    expect(actor).toEqual({
      personId: PERSON_ID,
      role: 'BACENTA_LEADER',
      branchId: BRANCH_ID,
      bacentaId: 'group-1',
    });
  });

  it('resolves a Basonta Leader Role Assignment to basontaId, not bacentaId', async () => {
    const prisma = buildPrisma({
      user: { id: 'user-1', person: { id: PERSON_ID, branchId: BRANCH_ID, lifecycleStage: 'MEMBER' } },
      roleAssignments: [
        {
          role: 'BASONTA_LEADER',
          branchId: BRANCH_ID,
          scopeGroupIds: [],
          group: { id: 'group-2', type: 'MINISTRY' },
        },
      ],
    });
    const service = new ActorContextResolverService(prisma, buildLogger());

    const actor = await service.resolve('sub-1');

    expect(actor).toEqual({
      personId: PERSON_ID,
      role: 'BASONTA_LEADER',
      branchId: BRANCH_ID,
      basontaId: 'group-2',
    });
  });

  it('populates clusterBacentaIds from a non-empty scope_group_ids (CLUSTER scope, now resolved)', async () => {
    const prisma = buildPrisma({
      user: { id: 'user-1', person: { id: PERSON_ID, branchId: BRANCH_ID, lifecycleStage: 'MEMBER' } },
      roleAssignments: [
        {
          role: 'ASSISTANT_PASTOR',
          branchId: BRANCH_ID,
          scopeGroupIds: ['bacenta-a', 'bacenta-b'],
          group: null,
        },
      ],
    });
    const service = new ActorContextResolverService(prisma, buildLogger());

    const actor = await service.resolve('sub-1');

    expect(actor).toEqual({
      personId: PERSON_ID,
      role: 'ASSISTANT_PASTOR',
      branchId: BRANCH_ID,
      clusterBacentaIds: ['bacenta-a', 'bacenta-b'],
    });
  });

  it('leaves clusterBacentaIds undefined (not an empty array) for a Role Assignment with an empty scope_group_ids', async () => {
    const prisma = buildPrisma({
      user: { id: 'user-1', person: { id: PERSON_ID, branchId: BRANCH_ID, lifecycleStage: 'MEMBER' } },
      roleAssignments: [
        { role: 'ASSISTANT_PASTOR', branchId: BRANCH_ID, scopeGroupIds: [], group: null },
      ],
    });
    const service = new ActorContextResolverService(prisma, buildLogger());

    const actor = await service.resolve('sub-1');

    expect(actor.clusterBacentaIds).toBeUndefined();
  });

  it('resolves a Branch-scoped Role Assignment (no group) without a bacenta/basonta id', async () => {
    const prisma = buildPrisma({
      user: { id: 'user-1', person: { id: PERSON_ID, branchId: BRANCH_ID, lifecycleStage: 'MEMBER' } },
      roleAssignments: [
        { role: 'TREASURER', branchId: BRANCH_ID, scopeGroupIds: [], group: null },
      ],
    });
    const service = new ActorContextResolverService(prisma, buildLogger());

    const actor = await service.resolve('sub-1');

    expect(actor).toEqual({ personId: PERSON_ID, role: 'TREASURER', branchId: BRANCH_ID });
  });

  it('throws ConflictException, not a silent pick, when more than one Role Assignment is concurrently active', async () => {
    const prisma = buildPrisma({
      user: { id: 'user-1', person: { id: PERSON_ID, branchId: BRANCH_ID, lifecycleStage: 'MEMBER' } },
      roleAssignments: [
        { role: 'TREASURER', branchId: BRANCH_ID, scopeGroupIds: [], group: null },
        { role: 'BACENTA_LEADER', branchId: BRANCH_ID, scopeGroupIds: [], group: { id: 'g1', type: 'PASTORAL_CARE' } },
      ],
    });
    const logger = buildLogger();
    const service = new ActorContextResolverService(prisma, logger);

    await expect(service.resolve('sub-1')).rejects.toThrow(ConflictException);
    expect(logger.error).toHaveBeenCalled();
  });

  /**
   * `[Multi-Tenant Foundation, Phase 1]` A Council-scoped Role Assignment
   * (branchId null, councilId set) - the new path this phase adds. Kept
   * as its own describe block, separate from the Branch-scoped tests
   * above, mirroring how `resolve()` itself branches early rather than
   * threading this case through the existing logic.
   */
  describe('Council-scoped Role Assignments', () => {
    const COUNCIL_ID = 'council-1';
    const TENANT_ID = 'tenant-1';

    it('resolves tenantId, councilId, and councilBranchIds, with branchId from the Person (not the assignment)', async () => {
      const prisma = buildPrisma({
        user: { id: 'user-1', person: { id: PERSON_ID, branchId: BRANCH_ID, lifecycleStage: 'MEMBER' } },
        roleAssignments: [
          { role: 'COUNCIL_TREASURER', branchId: null, councilId: COUNCIL_ID, scopeGroupIds: [], group: null },
        ],
        council: {
          tenantId: TENANT_ID,
          branches: [{ id: 'branch-a' }, { id: 'branch-b' }, { id: 'branch-c' }],
        },
      });
      const service = new ActorContextResolverService(prisma, buildLogger());

      const actor = await service.resolve('sub-1');

      expect(actor).toEqual({
        personId: PERSON_ID,
        role: 'COUNCIL_TREASURER',
        branchId: BRANCH_ID, // the Person's own home Branch, not the (nonexistent) assignment.branchId
        tenantId: TENANT_ID,
        councilId: COUNCIL_ID,
        councilBranchIds: ['branch-a', 'branch-b', 'branch-c'],
      });
    });

    it('resolves an empty councilBranchIds array (not undefined) for a Council with no Branches', async () => {
      const prisma = buildPrisma({
        user: { id: 'user-1', person: { id: PERSON_ID, branchId: BRANCH_ID, lifecycleStage: 'MEMBER' } },
        roleAssignments: [
          { role: 'COUNCIL_OVERSEER', branchId: null, councilId: COUNCIL_ID, scopeGroupIds: [], group: null },
        ],
        council: { tenantId: TENANT_ID, branches: [] },
      });
      const service = new ActorContextResolverService(prisma, buildLogger());

      const actor = await service.resolve('sub-1');

      expect(actor.councilBranchIds).toEqual([]);
    });

    it('throws ConflictException when the assignment references a Council that no longer exists', async () => {
      const prisma = buildPrisma({
        user: { id: 'user-1', person: { id: PERSON_ID, branchId: BRANCH_ID, lifecycleStage: 'MEMBER' } },
        roleAssignments: [
          { role: 'COUNCIL_TREASURER', branchId: null, councilId: COUNCIL_ID, scopeGroupIds: [], group: null },
        ],
        council: undefined,
      });
      const service = new ActorContextResolverService(prisma, buildLogger());

      await expect(service.resolve('sub-1')).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when a Role Assignment has neither branchId nor councilId (should be unreachable given the DB CHECK constraint)', async () => {
      const prisma = buildPrisma({
        user: { id: 'user-1', person: { id: PERSON_ID, branchId: BRANCH_ID, lifecycleStage: 'MEMBER' } },
        roleAssignments: [
          { role: 'COUNCIL_TREASURER', branchId: null, councilId: null, scopeGroupIds: [], group: null },
        ],
      });
      const service = new ActorContextResolverService(prisma, buildLogger());

      await expect(service.resolve('sub-1')).rejects.toThrow(ConflictException);
    });
  });
});
