import { BadRequestException, Injectable } from '@nestjs/common';
import type { ActorContext } from '@ecclesia/rbac';
import type { BranchResponseDto } from '@ecclesia/contracts';

import { PrismaService } from '../../../platform/database/prisma.service';
import { BranchReadRepository } from '../repositories/branch-read.repository';

/**
 * `[Post-Milestone D — Portal Experiences follow-up]` Backs
 * `GET /platform/branches` - resolves the real name of every Branch in
 * the actor's own Council, closing the gap Milestone D disclosed
 * (`CouncilDashboard.tsx`/`CouncilInsightsView.tsx`'s own `branchLabel`
 * fallback, which could only ever resolve the actor's own home Branch).
 *
 * **Why a loop over `runInBranchScope`, not a single `findMany`.**
 * `platform.branches`' own RLS policy filters by the row's own `id`
 * against `app.current_branch_id` - a single session can only ever see
 * one Branch at a time under RLS, by design (the same reason
 * `ActorContextResolverService` itself needs the RLS-exempt
 * `PrismaRootService` to read `Council.branches` in the first place).
 * `GivingTrendService.getTrend`'s own `query.council` branch establishes
 * this exact "loop `actor.councilBranchIds`, one `runInBranchScope` per
 * iteration" shape for a Council-wide read - reused here, not
 * reinvented, and every read still goes through the identical
 * per-Branch RLS policy every other query in this codebase relies on
 * (no new RLS policy, no `PrismaRootService` usage here).
 */
@Injectable()
export class BranchReadService {
  constructor(
    private readonly repository: BranchReadRepository,
    private readonly prisma: PrismaService,
  ) {}

  async listForActor(actor: ActorContext): Promise<BranchResponseDto[]> {
    if (!actor.councilBranchIds || actor.councilBranchIds.length === 0) {
      throw new BadRequestException('This actor has no Council scope to list Branches for');
    }

    const branches: BranchResponseDto[] = [];
    // Sequential, not `Promise.all` - each iteration opens its own Prisma
    // interactive transaction (`runInBranchScope`), the same "N sequential
    // connections, not N simultaneous ones" discipline
    // `PrismaService.runInCouncilScope`'s own doc comment establishes for
    // this exact shape of loop.
    for (const branchId of actor.councilBranchIds) {
      const branch = await this.prisma.runInBranchScope(branchId, () => this.repository.findById(branchId));
      branches.push(branch);
    }
    return branches;
  }
}
