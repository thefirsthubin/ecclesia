import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PrismaClient } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { branchScopeStorage } from './branch-scope.storage';
import type { EnvConfig } from '../config/env.schema';

/** Identical injection defense to `apps/api`'s own `PrismaService` - see
 * that file's doc comment for the full reasoning. `SET LOCAL` cannot take
 * a bind parameter, so this regex *is* the defense. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getPrismaModelDelegateNames(): string[] {
  return Prisma.dmmf.datamodel.models.map((model) => model.name.charAt(0).toLowerCase() + model.name.slice(1));
}

/**
 * `[Row-Level Security sprint]` apps/worker's own copy of
 * `apps/api/src/platform/database/prisma.service.ts` - identical
 * `Object.defineProperty`/`AsyncLocalStorage` mechanism, identical
 * `runInBranchScope` contract, duplicated rather than imported for the
 * same "no shared `libs/database`" reason this file already predates this
 * sprint for (see the original class doc comment, preserved in spirit
 * below). Now connects via `APP_DATABASE_URL` (the non-owner
 * `ecclesia_app` role) instead of the default `DATABASE_URL` Prisma would
 * otherwise read from `db/schema.prisma`'s own `env("DATABASE_URL")`.
 *
 * Who calls `runInBranchScope` here: `SqsConsumerBase.processMessage()`
 * (once per SQS message) and every sweep job's per-branch loop (once per
 * Branch, wrapping that Branch's entire unit of work including any
 * `EventBridgePublisherService.publish()` call inside it - the same
 * disclosed "external I/O held inside the transaction" tradeoff as
 * apps/api, see `db/ROW_LEVEL_SECURITY_DESIGN_NOTES.md` §5).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(
    configService: ConfigService<EnvConfig, true>,
    @InjectPinoLogger(PrismaService.name) private readonly logger: PinoLogger,
  ) {
    super({ datasourceUrl: configService.get('APP_DATABASE_URL', { infer: true }) });

    for (const modelName of getPrismaModelDelegateNames()) {
      const rootDelegate = (this as unknown as Record<string, unknown>)[modelName];
      if (rootDelegate === undefined) {
        continue;
      }
      Object.defineProperty(this, modelName, {
        configurable: true,
        enumerable: true,
        get: () => {
          const scoped = branchScopeStorage.getStore();
          return scoped ? (scoped as unknown as Record<string, unknown>)[modelName] : rootDelegate;
        },
      });
    }
  }

  async runInBranchScope<T>(branchId: string, fn: () => Promise<T>): Promise<T> {
    if (!UUID_PATTERN.test(branchId)) {
      throw new Error(`runInBranchScope: "${branchId}" is not a valid UUID - refusing to interpolate it into a SET LOCAL statement`);
    }
    return this.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.current_branch_id = '${branchId}'`);
        return branchScopeStorage.run(tx, fn);
      },
      { timeout: 15_000 },
    );
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.info('Prisma connected to the database (ecclesia_app role, RLS-scoped)');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.info('Prisma disconnected from the database');
  }
}
