import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../platform/database/prisma.service';

/**
 * `[Post-Milestone D — Portal Experiences follow-up]` Read side of
 * `platform.branches` (`db/schema.prisma`) for the new
 * `GET /platform/branches` Council-wide list. Named `BranchReadRepository`,
 * matching `AuditLogReadRepository`'s own "Read" suffix precedent (this
 * module has no writer of its own to collide with, but the naming stays
 * consistent).
 *
 * `platform.branches`' own RLS policy (`branches_self_isolation`,
 * `db/migrations/20260801000000_init_bounded_context_schemas`) compares
 * the row's own `id` to `app.current_branch_id`, not a `branch_id`
 * foreign key - so `findById` only ever returns a result at all when
 * called inside `runInBranchScope(branchId, ...)` for that exact
 * `branchId` (`BranchReadService.listForActor`'s own loop). The explicit
 * `where: { id: branchId }` below is not redundant with RLS - it is a
 * second, defense-in-depth confirmation that this call is reading the
 * Branch its own caller intended, not silently relying on RLS alone.
 */
@Injectable()
export class BranchReadRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(branchId: string): Promise<{ id: string; name: string }> {
    return this.prisma.branch.findUniqueOrThrow({
      where: { id: branchId },
      select: { id: true, name: true },
    });
  }
}
