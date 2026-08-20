import { Injectable } from '@nestjs/common';
import type { Tenant } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

/**
 * `[Post-Milestone D — Portal Experiences follow-up]` Read side of
 * `platform.tenants` (`db/schema.prisma`) for the new `GET
 * /platform/tenants`. Unlike `BranchReadRepository`, this queries through
 * the plain `PrismaService` connection directly - no `runInBranchScope`
 * loop needed - because `platform.tenants` deliberately carries no RLS
 * policy at all (`db/migrations/20260815000000_multi_tenant_foundation/
 * migration.sql`'s own Part 1 comment: "nothing in this phase's
 * application code queries [tenants] through the RLS-scoped connection in
 * a way that depends on tenant isolation yet"), so a plain `findMany`
 * already sees every row - exactly the GLOBAL-scope shape
 * `SYSTEM_ADMINISTRATOR`'s `platform.tenant.read` grant calls for, with
 * no `PrismaRootService` bypass needed.
 */
@Injectable()
export class TenantReadRepository {
  constructor(private readonly prisma: PrismaService) {}

  listAll(): Promise<Tenant[]> {
    return this.prisma.tenant.findMany({ orderBy: { name: 'asc' } });
  }
}
