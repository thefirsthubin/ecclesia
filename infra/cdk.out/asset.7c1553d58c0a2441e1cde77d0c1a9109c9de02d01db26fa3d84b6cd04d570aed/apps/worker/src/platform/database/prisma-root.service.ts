import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import type { EnvConfig } from '../config/env.schema';

/**
 * `[Row-Level Security sprint]` apps/worker's own copy of
 * `apps/api/src/platform/database/prisma-root.service.ts` - connects via
 * `DATABASE_URL` (the `ecclesia` table-owning role, RLS-exempt), not
 * `APP_DATABASE_URL`'s restricted `ecclesia_app` role this app's own
 * `PrismaService` uses for everything else.
 *
 * Inject this ONLY into `BranchDirectoryRepository.listBranches()` - the
 * one apps/worker call site that structurally cannot know which Branch to
 * scope by before running its query, because listing every Branch is that
 * query's entire job (mirrors `ActorContextResolverService`/`DevAuthService`'s
 * equivalent bootstrap case in apps/api). Every other worker-side
 * repository has a `branchId` to filter by and should keep injecting the
 * RLS-scoped `PrismaService` instead. See
 * `db/ROW_LEVEL_SECURITY_DESIGN_NOTES.md` §2.
 */
@Injectable()
export class PrismaRootService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(
    configService: ConfigService<EnvConfig, true>,
    @InjectPinoLogger(PrismaRootService.name) private readonly logger: PinoLogger,
  ) {
    super({ datasourceUrl: configService.get('DATABASE_URL', { infer: true }) });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.info('Prisma connected to the database (ecclesia owner role, RLS-exempt - branch-directory bootstrap only)');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.info('Prisma disconnected from the database');
  }
}
