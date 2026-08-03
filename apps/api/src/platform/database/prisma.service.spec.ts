import { PrismaClient } from '@prisma/client';
import type { PinoLogger } from 'nestjs-pino';

import { branchScopeStorage } from './branch-scope.storage';
import { PrismaService } from './prisma.service';

function buildLogger(): PinoLogger {
  return { info: jest.fn() } as unknown as PinoLogger;
}

/**
 * `[Row-Level Security sprint]` `PrismaService` now takes a
 * `ConfigService<EnvConfig, true>` too (reads `APP_DATABASE_URL`, not the
 * default `DATABASE_URL` env var Prisma would otherwise pick up) - every
 * `new PrismaService(...)` call below was updated for the new two-arg
 * constructor. The `$connect`/`$disconnect` tests are unchanged in spirit
 * from before this sprint; the tests after them are new, covering the
 * `Object.defineProperty`/`AsyncLocalStorage` branch-scoping mechanism and
 * `runInBranchScope`'s UUID guard - see that file's own doc comment for
 * why these are safely exercisable without a live database connection
 * (construction and the synchronous guard don't touch the network; this
 * sandbox has neither a live Postgres nor a working `apps/api` Jest run at
 * all - `@swc/core`'s native binding fails to load here, the same
 * pre-existing limitation `apps/worker/WORKER_DESIGN_NOTES.md` already
 * discloses for its own suites - so this file is `tsc --noEmit`-verified
 * here; the user's own `pnpm test` is what actually runs it).
 */
function buildConfigService() {
  return { get: () => 'postgresql://fake:fake@localhost:5432/fake' } as never;
}

describe('PrismaService', () => {
  it('connects and logs on module init', async () => {
    const connectSpy = jest.spyOn(PrismaClient.prototype, '$connect').mockResolvedValue(undefined);
    const logger = buildLogger();
    const service = new PrismaService(buildConfigService(), logger);

    await service.onModuleInit();

    expect(connectSpy).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith('Prisma connected to the database (ecclesia_app role, RLS-scoped)');

    connectSpy.mockRestore();
  });

  it('disconnects and logs on module destroy', async () => {
    const disconnectSpy = jest.spyOn(PrismaClient.prototype, '$disconnect').mockResolvedValue(undefined);
    const logger = buildLogger();
    const service = new PrismaService(buildConfigService(), logger);

    await service.onModuleDestroy();

    expect(disconnectSpy).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith('Prisma disconnected from the database');

    disconnectSpy.mockRestore();
  });

  it('a model-delegate property (e.g. .branch) resolves to the same root delegate when no branch scope is active', () => {
    const service = new PrismaService(buildConfigService(), buildLogger());
    expect(branchScopeStorage.getStore()).toBeUndefined();
    // Identity check: the getter must return the exact same
    // constructor-captured `rootDelegate` object on every read, not a
    // fresh value manufactured per call.
    expect(service.branch).toBe(service.branch);
  });

  it('a model-delegate property resolves to the active branch-scoped transaction client while one is running, and stops once it ends', () => {
    const service = new PrismaService(buildConfigService(), buildLogger());
    const fakeTxBranchDelegate = { findMany: jest.fn() };
    const fakeTx = { branch: fakeTxBranchDelegate } as never;

    branchScopeStorage.run(fakeTx, () => {
      expect(service.branch).toBe(fakeTxBranchDelegate);
    });

    expect(service.branch).not.toBe(fakeTxBranchDelegate);
  });

  it('runInBranchScope rejects a non-UUID branchId before attempting any database call', async () => {
    const service = new PrismaService(buildConfigService(), buildLogger());
    const fn = jest.fn();

    await expect(service.runInBranchScope('not-a-uuid; DROP TABLE users;--', fn)).rejects.toThrow(
      /is not a valid UUID - refusing to interpolate it into a SET LOCAL statement/,
    );
    expect(fn).not.toHaveBeenCalled();
  });
});
