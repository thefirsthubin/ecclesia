import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import type { EnvConfig } from '../config/env.schema';

/**
 * `[Row-Level Security sprint]` Connects via `DATABASE_URL` - the
 * `ecclesia` table-owning role, exempt from Row-Level Security by
 * Postgres's own owner-bypass rule - **not** `APP_DATABASE_URL`'s
 * restricted `ecclesia_app` role `PrismaService` uses for everything
 * else.
 *
 * Inject this ONLY into a call site that structurally cannot know which
 * Branch to scope to *before* running its query, because the query's own
 * job is to discover that fact:
 *
 * - `ActorContextResolverService.resolve(cognitoSub)` - looks up
 *   `platform.users` by `cognitoSub` to find out which Person, and
 *   therefore which Branch, just authenticated.
 * - `DevAuthService.listAvailableUsers()`/`issueTokenFor()` - the same
 *   shape, development mode only.
 *
 * Do **not** inject this into a repository that has a `branchId` (or
 * anything derivable into one) to filter by - that repository should use
 * `PrismaService` instead, so its queries actually get the RLS backstop.
 * See `db/ROW_LEVEL_SECURITY_DESIGN_NOTES.md` §2 for the full reasoning:
 * this class exists to keep the RLS-bypassing connection reachable from
 * exactly two files instead of leaving it available to all thirty-plus
 * repositories, which is the whole point of it having a distinct,
 * deliberately loud name rather than being a second, easy-to-reach-for
 * constructor option on `PrismaService` itself.
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
    this.logger.info('Prisma connected to the database (ecclesia owner role, RLS-exempt - identity bootstrapping only)');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.info('Prisma disconnected from the database');
  }
}
