import { AsyncLocalStorage } from 'node:async_hooks';
import type { Prisma } from '@prisma/client';

/**
 * `[Row-Level Security sprint]` apps/worker's own copy of
 * `apps/api/src/platform/database/branch-scope.storage.ts` - identical
 * mechanism and reasoning, duplicated rather than imported for the same
 * "no shared `libs/database`, Nx forbids one app importing another app's
 * code directly" reason every other file in `apps/worker/src/platform`
 * already mirrors rather than imports its `apps/api` counterpart.
 *
 * Consulted by apps/worker's own `PrismaService` on every model-delegate
 * property read, and set by that same class's `runInBranchScope` - once
 * per SQS message (`SqsConsumerBase.processMessage`) and once per Branch
 * inside every sweep job's per-branch loop. See
 * `db/ROW_LEVEL_SECURITY_DESIGN_NOTES.md` §3/§4 for the full mechanism.
 */
export const branchScopeStorage = new AsyncLocalStorage<Prisma.TransactionClient>();
