import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../platform/database/database.module';
import { RbacPlatformModule } from '../../platform/rbac/rbac-platform.module';
import { BranchController } from './controllers/branch.controller';
import { BranchListResourceContextGuard } from './guards/branch-list-resource-context.guard';
import { BranchReadRepository } from './repositories/branch-read.repository';
import { BranchReadService } from './services/branch-read.service';

/**
 * `[Post-Milestone D — Portal Experiences follow-up]` The read-side
 * bounded-context module for `GET /platform/branches`, mirroring
 * `AuditLogModule`'s own reasoning for why this is a standalone module
 * rather than folded into `PlatformModule` despite the `platform.*` RBAC
 * action prefix: this module implements one real, named capability
 * (Council-wide Branch-name resolution), not cross-cutting
 * infrastructure.
 */
@Module({
  imports: [DatabaseModule, RbacPlatformModule],
  controllers: [BranchController],
  providers: [BranchReadRepository, BranchReadService, BranchListResourceContextGuard],
})
export class BranchesModule {}
