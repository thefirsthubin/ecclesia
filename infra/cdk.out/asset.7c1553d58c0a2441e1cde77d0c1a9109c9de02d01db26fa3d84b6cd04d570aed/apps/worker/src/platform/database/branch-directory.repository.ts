import { Injectable } from '@nestjs/common';
import type { Branch } from '@prisma/client';

import { PrismaRootService } from './prisma-root.service';

/**
 * `[Row-Level Security sprint]` The one repository every sweep job's
 * `run()` calls before it can wrap anything in
 * `PrismaService.runInBranchScope` - discovering which Branches exist is
 * exactly the bootstrap case `PrismaRootService`'s own doc comment
 * describes: no `branchId` exists yet to scope by, because listing every
 * Branch is the whole point of this query.
 *
 * Kept as a single, narrowly-named repository rather than folded back
 * into each sweep job's own `*SweepRepository` (each of which otherwise
 * only ever injects the RLS-scoped `PrismaService` now) - so
 * `PrismaRootService` stays reachable from exactly this one call site per
 * job, matching `ActorContextResolverService`/`DevAuthService`'s
 * equivalent split in apps/api. Previously, `listBranches()` lived as an
 * unscoped method directly on each of `SilentDriftSweepRepository`,
 * `AttendanceCompletenessSweepRepository`, `FollowUpSlaSweepRepository`,
 * and `ChurchPulseRecomputeRepository` - all four now delegate to this one
 * class instead. See `db/ROW_LEVEL_SECURITY_DESIGN_NOTES.md` §2/§4.
 */
@Injectable()
export class BranchDirectoryRepository {
  constructor(private readonly prisma: PrismaRootService) {}

  listBranches(): Promise<Pick<Branch, 'id'>[]> {
    return this.prisma.branch.findMany({ select: { id: true } });
  }
}
