import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../platform/database/database.module';
import { RbacPlatformModule } from '../../platform/rbac/rbac-platform.module';
import { BranchConfigurationController } from './controllers/branch-configuration.controller';
import { BranchConfigurationResourceContextGuard } from './guards/branch-configuration-resource-context.guard';
import { BranchConfigurationRepository } from './repositories/branch-configuration.repository';
import { BranchConfigurationCrudService } from './services/branch-configuration.service';

/**
 * `[Branch Configuration milestone]` ConfigurationModule - PRD §17.3's
 * "Configuration: gathering/role/group types" row, the seventh bounded-
 * context module (`AppModule`'s own list). Not folded into
 * `PlatformModule` despite the `platform.*` RBAC action prefix -
 * `PlatformModule`'s own doc comment is explicit that it is
 * cross-cutting infrastructure only ("never business logic... no PRD
 * requirement is implemented by this module"), and this module
 * implements a real, named PRD capability, the same reasoning that keeps
 * every other bounded-context module (`PastoralCareModule`,
 * `StewardshipModule`, ...) separate from it.
 */
@Module({
  imports: [DatabaseModule, RbacPlatformModule],
  controllers: [BranchConfigurationController],
  providers: [BranchConfigurationRepository, BranchConfigurationCrudService, BranchConfigurationResourceContextGuard],
})
export class ConfigurationModule {}
