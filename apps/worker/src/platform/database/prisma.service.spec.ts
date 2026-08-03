import { branchScopeStorage } from './branch-scope.storage';
import { PrismaService } from './prisma.service';

/**
 * `[Row-Level Security sprint]` apps/worker's own copy of
 * `apps/api/src/platform/database/prisma.service.spec.ts` - identical
 * mechanism, identical reasoning for why this is safely testable without a
 * live database (construction doesn't connect; `runInBranchScope`'s UUID
 * guard runs before any `$transaction` call). This sandbox's own
 * `apps/worker` Jest cannot execute at all (`@swc/core`'s native binding
 * fails to load - `WORKER_DESIGN_NOTES.md`'s own pre-existing disclosure);
 * `tsc --noEmit`-verified here, the user's own `pnpm test` runs it for
 * real.
 */
function buildConfigService() {
  return { get: () => 'postgresql://fake:fake@localhost:5432/fake' } as never;
}

function buildLogger() {
  return { info: jest.fn(), warn: jest.fn(), error: jest.fn() } as never;
}

describe('PrismaService', () => {
  it('a model-delegate property (e.g. .branch) resolves to the same root delegate when no branch scope is active', () => {
    const service = new PrismaService(buildConfigService(), buildLogger());
    expect(branchScopeStorage.getStore()).toBeUndefined();
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
