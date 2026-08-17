import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PrismaClient } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { branchScopeStorage } from './branch-scope.storage';
import type { EnvConfig } from '../config/env.schema';

/** Strict, anchored UUID match - the one and only defense against SQL
 * injection into the `SET LOCAL` statement `runInBranchScope` below
 * builds via string interpolation. Postgres's `SET` family of commands
 * does not accept bind parameters the way `SELECT`/`INSERT` do (unlike
 * every other query in this codebase, which always goes through Prisma's
 * own parameterized query builder or a validated raw-SQL template) - this
 * regex *is* the injection defense, not an optional nicety. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Every Prisma model's own camelCase delegate property name (`branch`,
 * `person`, `groupMembership`, ...), read from Prisma's generated DMMF
 * metadata at runtime rather than hand-maintained here - stays correct
 * automatically as `db/schema.prisma` gains new models, with nothing in
 * this file to remember to update. Verified in this sandbox (no live
 * database needed - DMMF is static metadata baked into the generated
 * client): `Prisma.dmmf.datamodel.models` returns all 30 models this
 * schema currently defines. */
function getPrismaModelDelegateNames(): string[] {
  return Prisma.dmmf.datamodel.models.map((model) => model.name.charAt(0).toLowerCase() + model.name.slice(1));
}

/**
 * `[Row-Level Security sprint]` The one `PrismaClient` instance every
 * repository in this app injects and queries directly
 * (`this.prisma.person.findUnique(...)`, etc.) - unchanged from that
 * call site's point of view. What changed: this now connects via
 * `APP_DATABASE_URL` (the new, non-owner `ecclesia_app` Postgres role -
 * see `db/ROW_LEVEL_SECURITY_DESIGN_NOTES.md`), not `DATABASE_URL`, and
 * every model-delegate property (`.person`, `.gathering`, ...) is
 * redefined via `Object.defineProperty` in the constructor to read from
 * an active branch-scoped transaction (`branchScopeStorage`'s
 * `AsyncLocalStorage`) when one exists, falling back to this instance's
 * own root connection otherwise.
 *
 * `$transaction`/`$connect`/`$disconnect`/`$executeRaw`/every other
 * `$`-prefixed method is deliberately **not** touched - they remain the
 * real `PrismaClient` prototype methods, called with a normal `this`
 * binding, never wrapped in a `Proxy`. See `db/ROW_LEVEL_SECURITY_DESIGN_NOTES.md`
 * §3 for why a whole-instance `Proxy` was considered and rejected (a real
 * risk with recent Prisma Client versions' internal use of private class
 * fields, not merely a style choice) in favor of this narrower,
 * per-property `Object.defineProperty` approach.
 *
 * Who calls `runInBranchScope`: `BranchScopeInterceptor` (this app, once
 * per authenticated HTTP request) and, in `apps/worker`, its own copy of
 * this same file (once per SQS message and once per Branch inside every
 * nightly sweep job's loop).
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
        // Defensive only - would mean a DMMF model name that Prisma's own
        // generated client didn't also set up as an instance property,
        // which would be a Prisma-internal inconsistency, not something
        // this constructor should throw over.
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

  /**
   * Opens one Prisma interactive transaction, sets the RLS session
   * variable every policy in `db/migrations/20260801000000_.../migration.sql`
   * reads, and runs `fn` with every model-delegate property (anywhere in
   * `fn`'s call stack, however deep) transparently resolving to that one
   * transaction's connection for the duration.
   *
   * `{ timeout: 15_000 }` - longer than Prisma's 5-second default. See
   * `db/ROW_LEVEL_SECURITY_DESIGN_NOTES.md` §5: a unit of work wrapped
   * this way may include external I/O (e.g. `EventBridgePublisherService.publish()`
   * mid-sweep in `apps/worker`) while the transaction is open - a
   * disclosed tradeoff of wrapping a whole unit of work rather than just
   * its DB statements, not fixed by this timeout, only made less likely
   * to bite in practice.
   */
  async runInBranchScope<T>(branchId: string, fn: () => Promise<T>): Promise<T> {
    if (!UUID_PATTERN.test(branchId)) {
      throw new Error(`runInBranchScope: "${branchId}" is not a valid UUID - refusing to interpolate it into a SET LOCAL statement`);
    }
    return this.$transaction(
      async (tx) => {
        // `$executeRawUnsafe`, not `$executeRaw`, because `SET LOCAL`
        // does not accept Postgres bind parameters (`$1`) the way
        // `SELECT`/`INSERT`/`UPDATE` do - this is exactly why
        // `UUID_PATTERN` validates `branchId` above before it ever
        // reaches this string template.
        await tx.$executeRawUnsafe(`SET LOCAL app.current_branch_id = '${branchId}'`);
        return branchScopeStorage.run(tx, fn);
      },
      { timeout: 15_000 },
    );
  }

  /**
   * `[Multi-Tenant Foundation, Phase 1]` Council-scoped equivalent of
   * `runInBranchScope` above, for an actor whose authorization scope is
   * every Branch in their Council (`ActorContext.councilBranchIds`), not
   * one Branch. Deliberately NOT a new RLS policy or session variable -
   * it calls the existing, unmodified `runInBranchScope` once per
   * `branchId`, so every read still goes through the exact same hardened
   * per-Branch RLS policy every other query in this codebase already
   * relies on. See this phase's migration (`db/migrations/
   * 20260815000000_multi_tenant_foundation/migration.sql`, Part 3) for
   * the full reasoning against a new cross-Branch RLS policy shape in
   * this same foundational phase.
   *
   * Sequential, not `Promise.all` - each `runInBranchScope` call opens its
   * own Prisma interactive transaction; running them concurrently would
   * mean N simultaneous transactions/connections per Council-scoped
   * request instead of N sequential ones. A known, disclosed performance
   * limitation for a Council with many Branches, not a correctness one -
   * left for a later phase to optimize once a real Council-scoped
   * endpoint exists to measure it against.
   */
  async runInCouncilScope<T>(branchIds: readonly string[], fn: () => Promise<T>): Promise<T[]> {
    const results: T[] = [];
    for (const branchId of branchIds) {
      results.push(await this.runInBranchScope(branchId, fn));
    }
    return results;
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
