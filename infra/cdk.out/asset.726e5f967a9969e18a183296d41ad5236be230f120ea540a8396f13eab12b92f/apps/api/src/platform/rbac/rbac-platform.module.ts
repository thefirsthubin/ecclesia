import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { BranchConfigurationService } from './branch-configuration.service';

/**
 * Shared RBAC-supporting infrastructure (People domain milestone):
 * `BranchConfigurationService`, consumed by every domain module's own
 * `EcclesiaContextGuardBase` subclass (`ecclesia-context.guard-base.ts`).
 * Not `AuthModule` (Sprint 1.4, actor resolution) - this module is
 * downstream of authentication, upstream of every bounded-context
 * module's own authorization wiring.
 */
@Module({
  imports: [DatabaseModule],
  providers: [BranchConfigurationService],
  exports: [BranchConfigurationService],
})
export class RbacPlatformModule {}
