import { Module } from '@nestjs/common';

import { BranchDirectoryRepository } from './branch-directory.repository';
import { PrismaRootService } from './prisma-root.service';
import { PrismaService } from './prisma.service';

/**
 * `PrismaService` for apps/worker (Worker milestone) - mirrors
 * `apps/api/src/platform/database/database.module.ts` exactly, minus the
 * `DatabaseHealthIndicator`, which is Terminus/HTTP-specific
 * (`@nestjs/terminus`'s `HealthIndicator` is designed to back an HTTP
 * `/health` endpoint) and apps/worker has no HTTP surface - it runs via
 * `NestFactory.createApplicationContext()`, not `NestFactory.create()`
 * (see `apps/worker/src/main.ts`). Database-reachability failures here
 * surface the same way every other worker startup failure does: the
 * process refuses to boot and logs why (`PrismaService.onModuleInit`).
 *
 * `[Row-Level Security sprint]` `PrismaRootService`/`BranchDirectoryRepository`
 * added - see each class's own doc comment.
 */
@Module({
  providers: [PrismaService, PrismaRootService, BranchDirectoryRepository],
  exports: [PrismaService, PrismaRootService, BranchDirectoryRepository],
})
export class WorkerDatabaseModule {}
