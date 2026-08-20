import { Injectable } from '@nestjs/common';
import type { TenantListResponseDto } from '@ecclesia/contracts';

import { TenantReadRepository } from '../repositories/tenant-read.repository';

/**
 * `[Post-Milestone D — Portal Experiences follow-up]` Backs `GET
 * /platform/tenants` - every Tenant on the platform, no actor-based
 * filtering. Unlike `BranchReadService.listForActor`, this takes no
 * `ActorContext` parameter at all: `permission-matrix.ts`'s own
 * `SYSTEM_ADMINISTRATOR` row doc comment is explicit that `GLOBAL` here
 * "is the one legitimate use of GLOBAL this phase's own instructions
 * anticipate" precisely because Tenant is platform administrative data
 * with no per-actor Tenant/Council boundary to narrow by - narrowing this
 * list by the caller's own `tenantId` would misrepresent the grant.
 */
@Injectable()
export class TenantReadService {
  constructor(private readonly repository: TenantReadRepository) {}

  async list(): Promise<TenantListResponseDto> {
    const tenants = await this.repository.listAll();
    return tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      createdAt: tenant.createdAt.toISOString(),
    }));
  }
}
