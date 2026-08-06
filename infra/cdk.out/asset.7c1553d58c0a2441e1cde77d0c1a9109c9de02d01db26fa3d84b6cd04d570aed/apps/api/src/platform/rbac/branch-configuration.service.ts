import { Injectable } from '@nestjs/common';
import type { BranchConfiguration } from '@ecclesia/rbac';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { PrismaService } from '../database/prisma.service';

/**
 * Loads the `BranchConfiguration` shape `libs/rbac`'s `evaluate()` needs
 * (currently just `poimenGateEnabled`, PRD §24 OQ-02 / Blueprint §9.3)
 * from `platform.configurations` for a given Branch. This is
 * infrastructure any future bounded-context module will need identically
 * - not People-specific - which is why it lives in
 * `apps/api/src/platform/rbac/`, not `apps/api/src/modules/people/`.
 *
 * `libs/config` (Blueprint §6.2) is the library ultimately meant to own
 * "typed configuration loading," but it is still Sprint 0 scaffolding
 * with no defined contract for *how* a Prisma-backed load should be
 * shaped or where the database dependency should sit (see that library's
 * own README). Redesigning `libs/config`'s contract without evidence for
 * its exact intended shape would be scope creep beyond this milestone -
 * this service is deliberately built directly in `apps/api` for now, and
 * migrating it into `libs/config` is recommended as a follow-up, not done
 * here. See `PEOPLE_DESIGN_NOTES.md`.
 */
@Injectable()
export class BranchConfigurationService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectPinoLogger(BranchConfigurationService.name) private readonly logger: PinoLogger,
  ) {}

  async loadForBranch(branchId: string): Promise<BranchConfiguration> {
    const configuration = await this.prisma.configuration.findUnique({ where: { branchId } });

    if (!configuration) {
      // Not a citation - a reasonable, disclosed fail-safe default. PRD
      // §24 OQ-02's own resolution text says the Poimen gate defaults to
      // "soft-input (advisory)" (i.e. disabled) for a Branch that has not
      // explicitly configured it - a Branch with no `configurations` row
      // yet (e.g. freshly onboarded, before an Admin has visited the
      // configuration screen) is exactly that case, not an error.
      this.logger.warn(
        { branchId },
        'No platform.configurations row for this Branch - defaulting poimenGateEnabled to false (PRD §24 OQ-02 default)',
      );
      return { poimenGateEnabled: false };
    }

    return { poimenGateEnabled: configuration.poimenGateEnabled };
  }
}
